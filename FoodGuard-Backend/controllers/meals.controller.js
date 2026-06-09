const asyncHandler = require('express-async-handler');
const Item = require('../models/InventoryItem');
const Recipe = require('../models/Recipe');
const MealPlan = require('../models/MealPlan');
const GeneratedRecipe = require('../models/GeneratedRecipe');
const { aiPost } = require('../utils/aiClient');
const { recipeQuota, tryConsumeRecipe } = require('../middleware/plan');

const crypto = require('crypto');

const DAY = 86400000;

function normalizeOptionalChoice(value) {
  if (value == null) {
    return null;
  }
  const normalized = String(value).trim().toLowerCase();
  return normalized && normalized !== 'none' ? value : null;
}

function normalizeIngredient(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(large|small|medium|fresh|ground|chopped|sliced|diced|whole|ripe|uncooked|cooked|raw|packaged|package|can|cans|cup|cups|tbsp|tsp|tablespoon|tablespoons|teaspoon|teaspoons|gram|grams|g|kg|ml|l|oz|ounce|ounces|pound|pounds|lb|lbs|piece|pieces|slice|slices|bunch|dozen|pinch|dash)\b/g, ' ')
    .replace(/\b(and|of|the|with|to|for|a|an)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ingredientMatches(left, right) {
  const normalizedLeft = normalizeIngredient(left);
  const normalizedRight = normalizeIngredient(right);
  if (!normalizedLeft || !normalizedRight) {
    return false;
  }
  if (normalizedLeft === normalizedRight) {
    return true;
  }
  if (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) {
    return true;
  }

  const leftTokens = new Set(normalizedLeft.split(' '));
  const rightTokens = new Set(normalizedRight.split(' '));
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      return true;
    }
  }
  return false;
}

function calculateMatchPercent(recipeIngredients, inventoryNames) {
  const normalizedRecipe = (recipeIngredients || []).filter(Boolean);
  const normalizedInventory = (inventoryNames || []).filter(Boolean);
  if (!normalizedRecipe.length || !normalizedInventory.length) {
    return normalizedRecipe.length ? 0 : null;
  }

  let matched = 0;
  for (const recipeIngredient of normalizedRecipe) {
    if (normalizedInventory.some((inventoryItem) => ingredientMatches(recipeIngredient, inventoryItem))) {
      matched += 1;
    }
  }
  return Math.round((matched / normalizedRecipe.length) * 100);
}

function extractRecipeIngredients(recipe) {
  if (!recipe) {
    return [];
  }

  if (Array.isArray(recipe.ingredients) && recipe.ingredients.length) {
    return recipe.ingredients;
  }

  if (Array.isArray(recipe.extendedIngredients) && recipe.extendedIngredients.length) {
    return recipe.extendedIngredients
      .map((ingredient) => ingredient.originalName || ingredient.name || ingredient.original || ingredient.aisle)
      .filter(Boolean);
  }

  return [];
}

function extractRecipeInstructions(recipe) {
  if (!recipe) {
    return [];
  }

  if (Array.isArray(recipe.instructions) && recipe.instructions.length) {
    return recipe.instructions;
  }

  if (Array.isArray(recipe.analyzedInstructions) && recipe.analyzedInstructions.length) {
    return recipe.analyzedInstructions
      .flatMap((block) => block.steps || [])
      .map((step) => step.step)
      .filter(Boolean);
  }

  if (typeof recipe.instructions === 'string' && recipe.instructions.trim()) {
    return [recipe.instructions.trim()];
  }

  return [];
}

function buildInventoryRecipeResponse(recipe, inventoryNames) {
  const recipeIngredients = extractRecipeIngredients(recipe);
  const match = calculateMatchPercent(recipeIngredients, inventoryNames);
  const matchedIngredients = recipeIngredients.filter((ingredient) =>
    inventoryNames.some((inventoryItem) => ingredientMatches(ingredient, inventoryItem))
  );
  const missedIngredients = recipeIngredients.filter((ingredient) =>
    !matchedIngredients.includes(ingredient)
  );

  return {
    _id: String(recipe.id || recipe._id),
    title: recipe.title || recipe.name || 'Recipe',
    name: recipe.title || recipe.name || 'Recipe',
    image: recipe.image || null,
    calories: recipe.calories || recipe.nutrition?.nutrients?.find?.((n) => n.name === 'Calories')?.amount || 0,
    protein: recipe.protein || 0,
    carbs: recipe.carbs || 0,
    fats: recipe.fats || 0,
    description: recipe.summary || recipe.description || recipe.healthNote || '',
    healthNote: recipe.healthNote || recipe.summary || recipe.description || '',
    usesExpiring: false,
    match,
    tags: recipe.tags || [],
    uses: matchedIngredients.join(', '),
    missed: missedIngredients,
    reasoning: recipe.reasoning || recipe.summary || recipe.description || '',
    ingredients: recipeIngredients,
    instructions: extractRecipeInstructions(recipe),
    prep: recipe.readyInMinutes ? `${recipe.readyInMinutes} mins` : recipe.prep || '',
    cook: recipe.readyInMinutes ? `${recipe.readyInMinutes} mins` : recipe.cook || '',
    total: recipe.readyInMinutes ? `${recipe.readyInMinutes} mins` : recipe.total || '',
    servingsLabel: recipe.servings ? `${recipe.servings} servings` : recipe.servingsLabel || 'Serves',
    difficulty: recipe.difficulty || '',
    rating: recipe.rating || 0,
    reviews: recipe.reviews || recipe.aggregateLikes || 0,
    dailyTotal: recipe.dailyTotal || 2000,
  };
}

// FEATURE 2 — AI meal & recipe recommendations
exports.recommend = asyncHandler(async (req, res) => {
  const now = Date.now();
  const items = await Item.find({ user: req.user._id, status: { $in: ['fresh', 'expiring'] } }).limit(25);
  const inventoryNames = items.map((i) => i.name);
  const expiring = items
    .filter((i) => Math.ceil((new Date(i.expiry).getTime() - now) / DAY) <= 3)
    .map((i) => i.name);

  // Allow the AI Meals page to pass typed ingredients / free-text query;
  // otherwise fall back to the user's inventory.
  const bodyIngredients = Array.isArray(req.body?.ingredients) ? req.body.ingredients : [];
  const queryText = (req.body?.query || '').trim();
  const queryTokens = queryText ? queryText.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const ingredients = (bodyIngredients.length || queryTokens.length)
    ? [...new Set([...bodyIngredients, ...queryTokens])]
    : inventoryNames;

  if (!ingredients.length) {
    return res.json({ recipes: [], message: 'Add inventory items to get recommendations', quota: recipeQuota(req.user) });
  }

  // Free-tier weekly quota — only explicit ("manual") generations are counted,
  // so the passive auto-load when the page opens never burns a user's allowance.
  const isManual = req.method === 'POST' && req.body && req.body.manual === true;
  let quota = recipeQuota(req.user);
  if (isManual) {
    quota = await tryConsumeRecipe(req.user);
    if (!quota.ok) {
      res.status(403);
      throw new Error(`You've used all ${quota.limit} free AI recipe generations this week. Upgrade to Pro for unlimited.`);
    }
  }

  // Honor the user's saved preferences (Settings → Preferences / Health Profile),
  // with an optional per-request override from the body. Cuisine + dietary +
  // health condition are all forwarded so the AI prompt is actually personalised.
  const prefs = req.user?.preferences || {};
  const healthCondition = normalizeOptionalChoice(req.body?.health_condition || req.user?.healthCondition);
  const dietaryPref = normalizeOptionalChoice(
    req.body?.dietary_preference || req.user?.dietaryPreference || prefs.diet
  );
  const cuisinePref = normalizeOptionalChoice(req.body?.cuisine || req.body?.cuisine_preference || prefs.cuisine);

  const data = await aiPost('/ai/recommend-meals', {
    ingredients,
    expiring_items: expiring,
    health_condition: healthCondition,
    dietary_preference: dietaryPref,
    cuisine_preference: cuisinePref,
  });

  const recipes = (data.meals || []).map((m, i) => {
    const usedArr = m.used_ingredients || [];
    const missedArr = m.missed_ingredients || [];
    const inventoryMatch = calculateMatchPercent(
      [...usedArr, ...missedArr],
      inventoryNames
    );
    const match = inventoryMatch ?? ((usedArr.length + missedArr.length)
      ? Math.round((usedArr.length / (usedArr.length + missedArr.length)) * 100)
      : null);
    const tags = [];
    if (m.uses_expiring) tags.push('Uses Expiring');
    if (healthCondition && healthCondition !== 'none') {
      tags.push(healthCondition.replace(/_/g, ' '));
    }
    if (cuisinePref) tags.push(String(cuisinePref).replace(/_/g, ' '));
    // Generate stable deterministic ID using recipe name hash to prevent ID mismatches
    // when recommendations are fetched multiple times
    const idBase = m.recipe_id ? String(m.recipe_id) : m.name;
    const stableId = idBase ? crypto.createHash('md5').update(idBase.toLowerCase()).digest('hex').substring(0, 12) : `local-${i}`;
    return {
      _id: stableId,
      title: m.name,
      name: m.name,
      image: m.image || null,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fats: m.fats,
      description: m.health_note || m.reasoning || '',
      healthNote: m.health_note || m.reasoning,
      usesExpiring: !!m.uses_expiring,
      match,
      tags,
      uses: usedArr.join(', '),
      missed: missedArr,
      reasoning: m.reasoning,
    };
  });

  // Cache each recommendation so the Recipe Detail page can resolve the SAME
  // recipe later by its stable id (refresh / direct link), instead of falling
  // back to a wrong/empty recipe. Never let a cache write break the response.
  try {
    await Promise.all(
      recipes.map((r) =>
        GeneratedRecipe.updateOne(
          { user: req.user._id, recipeId: r._id },
          { $set: { user: req.user._id, recipeId: r._id, data: r } },
          { upsert: true }
        )
      )
    );
  } catch (err) {
    console.warn('[meals] could not cache generated recipes:', err.message);
  }

  res.json({ recipes, quota });
});

exports.recipe = asyncHandler(async (req, res) => {
  const inventoryItems = await Item.find({ user: req.user._id, status: { $in: ['fresh', 'expiring'] } }).limit(25);
  const inventoryNames = inventoryItems.map((item) => item.name);

  // 1) A previously recommended AI recipe (hash id) — resolve from the per-user
  // cache so "View Recipe" always opens the correct recipe, even after refresh.
  const cached = await GeneratedRecipe.findOne({ user: req.user._id, recipeId: req.params.id }).catch(() => null);
  if (cached && cached.data) {
    const data = cached.data;
    const recipeIngredients = extractRecipeIngredients(data);
    return res.json({
      recipe: {
        ...data,
        _id: req.params.id,
        match: data.match ?? calculateMatchPercent(recipeIngredients, inventoryNames),
      },
    });
  }

  // 2) A curated recipe stored by Mongo ObjectId.
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
  const recipe = isObjectId ? await Recipe.findById(req.params.id).catch(() => null) : null;
  if (recipe) {
    const recipeData = recipe.toObject ? recipe.toObject() : recipe;
    const recipeIngredients = extractRecipeIngredients(recipeData);
    return res.json({
      recipe: {
        ...recipeData,
        _id: String(recipeData._id || req.params.id),
        title: recipeData.title || recipeData.name || 'Recipe',
        name: recipeData.title || recipeData.name || 'Recipe',
        ingredients: recipeIngredients,
        instructions: extractRecipeInstructions(recipeData),
        match: calculateMatchPercent(recipeIngredients, inventoryNames),
      },
    });
  }

  res.json({ recipe: { _id: req.params.id, title: 'Recipe', ingredients: [], instructions: [], match: 0 } });
});

exports.save = asyncHandler(async (req, res) => {
  res.json({ message: 'Saved', id: req.params.id });
});

exports.upload = asyncHandler(async (req, res) => {
  res.json({ url: req.file ? `/uploads/${req.file.filename}` : null });
});

// FEATURE 4 — condition-based meal plan (generate + persist)
exports.mealPlan = asyncHandler(async (req, res) => {
  const items = await Item.find({ user: req.user._id, status: { $in: ['fresh', 'expiring'] } }).limit(30);
  const condition = req.body.condition || req.user.healthCondition || 'none';

  const data = await aiPost('/ai/condition-meal-plan', {
    condition,
    available_ingredients: items.map((i) => i.name),
    days: 7,
  });

  const plan = await MealPlan.findOneAndUpdate(
    { user: req.user._id },
    { user: req.user._id, condition, weekPlan: data.week_plan || [] },
    { new: true, upsert: true }
  );
  res.json({ plan });
});

exports.getMealPlan = asyncHandler(async (req, res) => {
  const plan = await MealPlan.findOne({ user: req.user._id }).sort({ updatedAt: -1 });
  res.json({ plan: plan || null });
});
