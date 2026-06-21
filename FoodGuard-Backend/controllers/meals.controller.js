const asyncHandler = require('express-async-handler');
const Item = require('../models/InventoryItem');
const Recipe = require('../models/Recipe');
const MealPlan = require('../models/MealPlan');
const GeneratedRecipe = require('../models/GeneratedRecipe');
const { aiPost } = require('../utils/aiClient');
const { recipeQuota, tryConsumeRecipe } = require('../middleware/plan');

const crypto = require('crypto');

const DAY = 86400000;
const ACTIVE_STATUSES = { $nin: ['consumed', 'wasted'] };

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
  if (typeof recipe.ingredients === 'string' && recipe.ingredients.trim()) {
    return [recipe.ingredients];
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
    fats: recipe.fats || recipe.fat || 0,
    description: recipe.summary || recipe.description || recipe.healthNote || '',
    healthNote: recipe.healthNote || recipe.summary || recipe.description || '',
    usesExpiring: false,
    match,
    matchScore: match,
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
    cuisine: recipe.cuisine || '',
    rating: recipe.rating || 0,
    reviews: recipe.reviews || recipe.aggregateLikes || 0,
    dailyTotal: recipe.dailyTotal || 2000,
  };
}

function normalizeMatchScore(value, fallback) {
  const numeric = Number(value ?? fallback);
  if (!Number.isFinite(numeric)) return null;
  if (numeric > 1) return Math.round(Math.min(numeric, 100));
  return Math.round(numeric * 100);
}

function inferDifficulty(minutes, text) {
  const total = Number(minutes) || 0;
  const joined = `${text || ''}`.toLowerCase();
  if (total && total <= 20) return 'Easy';
  if (total && total <= 45) return 'Medium';
  if (total) return 'Hard';
  if (joined.includes('easy')) return 'Easy';
  if (joined.includes('hard') || joined.includes('advanced')) return 'Hard';
  if (joined.includes('medium') || joined.includes('intermediate')) return 'Medium';
  return '';
}

function normalizeIngredients(value) {
  if (typeof value === 'string' && value.trim()) return [value];
  if (!Array.isArray(value)) return [];
  return value.filter(Boolean).map(String);
}

function normalizeInstructions(value) {
  if (typeof value === 'string' && value.trim()) return [value];
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return [];
}

function buildUserProfilePayload(user, body = {}) {
  const prefs = user.preferences || {};
  const bmi = user.bmi || {};
  return {
    daily_calories: body.daily_calories || bmi.dailyCalories || null,
    macros: body.macros || bmi.macros || null,
    health_goal: body.health_goal || bmi.healthGoal || null,
    activity_level: body.activity_level || user.activityLevel || null,
    bmi: {
      value: bmi.value || null,
      category: bmi.category || null,
      age: bmi.age || null,
      gender: bmi.gender || null,
    },
    units: body.units || prefs.units || 'metric',
  };
}

function buildInventoryPayload(items) {
  const now = Date.now();
  return items.map((i) => ({
    name: i.name,
    category: i.category,
    quantity: i.quantity || 1,
    unit: i.unit || 'pcs',
    expiry: i.expiry,
    days_left: Math.ceil((new Date(i.expiry).getTime() - now) / DAY),
    status: i.status,
  }));
}

function normalizeMealPlan(rawPlan, fallbackItems) {
  const source = Array.isArray(rawPlan?.weekPlan || rawPlan?.week_plan)
    ? (rawPlan.weekPlan || rawPlan.week_plan)
    : [];
  const inventoryNames = fallbackItems.map((i) => i.name);
  const mealKeys = ['breakfast', 'lunch', 'dinner'];

  function fallbackMeal(dayIndex, mealKey) {
    const base = inventoryNames.length ? inventoryNames[dayIndex % inventoryNames.length] : 'balanced meal';
    const label = mealKey === 'breakfast' ? 'Breakfast' : mealKey === 'lunch' ? 'Lunch' : 'Dinner';
    return {
      name: `${label} with ${base}`,
      calories: mealKey === 'breakfast' ? 350 : 550,
      protein: mealKey === 'breakfast' ? 18 : 30,
      carbs: mealKey === 'breakfast' ? 55 : 65,
      fats: mealKey === 'breakfast' ? 10 : 18,
      ingredients: [base],
      instructions: [`Prepare ${base} using available inventory and follow safe food-handling practices.`],
      cuisine: '',
      difficulty: '',
    };
  }

  function normalizeMeal(value, dayIndex, mealKey) {
    const fallback = fallbackMeal(dayIndex, mealKey);
    const meal = value && typeof value === 'object' ? value : {};
    const ingredients = normalizeIngredients(meal.ingredients?.length ? meal.ingredients : meal.ingredient_list);
    const instructions = normalizeInstructions(meal.instructions?.length ? meal.instructions : (meal.instruction || meal.method));
    return {
      name: meal.name || fallback.name,
      calories: Number(meal.calories ?? fallback.calories) || fallback.calories,
      protein: Number(meal.protein ?? fallback.protein) || fallback.protein,
      carbs: Number(meal.carbs ?? fallback.carbs) || fallback.carbs,
      fats: Number(meal.fats ?? meal.fat ?? fallback.fats) || fallback.fats,
      ingredients: ingredients.length ? ingredients : fallback.ingredients,
      instructions: instructions.length ? instructions : fallback.instructions,
      cuisine: meal.cuisine || fallback.cuisine || '',
      difficulty: meal.difficulty || fallback.difficulty || '',
    };
  }

  const normalized = Array.from({ length: 7 }, (_, index) => {
    const sourceDay = source[index] && typeof source[index] === 'object' ? source[index] : {};
    const day = { day: sourceDay.day || `Day ${index + 1}` };
    mealKeys.forEach((mealKey) => {
      day[mealKey] = normalizeMeal(sourceDay[mealKey], index, mealKey);
    });
    const snack = sourceDay.snack || sourceDay.snacks;
    if (snack) {
      day.snack = normalizeMeal(snack, index, 'snack');
    }
    return day;
  });

  return { ...rawPlan, weekPlan: normalized };
}

exports.recommend = asyncHandler(async (req, res) => {
  const now = Date.now();
  const items = await Item.find({ user: req.user._id, status: ACTIVE_STATUSES }).limit(25);
  const inventoryNames = items.map((i) => i.name);
  const expiring = items
    .filter((i) => Math.ceil((new Date(i.expiry).getTime() - now) / DAY) <= 3)
    .map((i) => i.name);

  const bodyIngredients = Array.isArray(req.body?.ingredients) ? req.body.ingredients : [];
  const queryText = (req.body?.query || '').trim();
  const queryTokens = queryText ? queryText.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const ingredients = (bodyIngredients.length || queryTokens.length)
    ? [...new Set([...bodyIngredients, ...queryTokens])]
    : inventoryNames;

  if (!ingredients.length) {
    return res.json({ recipes: [], message: 'Add inventory items to get recommendations', quota: recipeQuota(req.user) });
  }

  const isManual = req.method === 'POST' && req.body && req.body.manual === true;
  let quota = recipeQuota(req.user);
  if (isManual) {
    quota = await tryConsumeRecipe(req.user);
    if (!quota.ok) {
      res.status(403);
      throw new Error(`You've used all ${quota.limit} free AI recipe generations this week. Upgrade to Pro for unlimited.`);
    }
  }

  const prefs = req.user?.preferences || {};
  const healthCondition = normalizeOptionalChoice(req.body?.health_condition || req.user?.healthCondition);
  const dietaryPref = normalizeOptionalChoice(
    req.body?.dietary_preference || req.user?.dietaryPreference || prefs.diet
  );
  const cuisinePref = normalizeOptionalChoice(req.body?.cuisine || req.body?.cuisine_preference || prefs.cuisine);

  const data = await aiPost('/ai/recommend-meals', {
    ingredients,
    inventory_items: buildInventoryPayload(items),
    expiring_items: expiring,
    expiring_warn_days: Number(prefs.expiryWarning || 3),
    health_condition: healthCondition,
    dietary_preference: dietaryPref,
    cuisine_preference: cuisinePref,
    health_profile: buildUserProfilePayload(req.user, req.body),
  }, { timeout: 60000 });

  const recipes = (data.meals || []).map((m, i) => {
    const usedArr = m.used_ingredients || [];
    const missedArr = m.missed_ingredients || [];
    const allIngredients = normalizeIngredients(m.ingredients || m.ingredient_list || [...usedArr, ...missedArr]);
    const inventoryMatch = calculateMatchPercent(allIngredients, inventoryNames);
    const match = inventoryMatch ?? ((usedArr.length + missedArr.length)
      ? Math.round((usedArr.length / (usedArr.length + missedArr.length)) * 100)
      : null);
    const matchScore = normalizeMatchScore(m.match_score ?? m.matchScore, match);
    const tags = [];
    if (m.uses_expiring || expiring.some((name) => ingredientMatches(name, usedArr.join(' ')))) tags.push('Uses Expiring');
    if (healthCondition && healthCondition !== 'none') tags.push(healthCondition.replace(/_/g, ' '));
    if (cuisinePref || m.cuisine) tags.push(String(cuisinePref || m.cuisine).replace(/_/g, ' '));
    const idBase = m.recipe_id ? String(m.recipe_id) : m.name;
    const stableId = idBase ? crypto.createHash('md5').update(idBase.toLowerCase()).digest('hex').substring(0, 12) : `local-${i}`;
    return {
      _id: stableId,
      title: m.name,
      name: m.name,
      image: m.image || null,
      calories: Number(m.calories) || 0,
      protein: Number(m.protein) || 0,
      carbs: Number(m.carbs) || 0,
      fats: Number(m.fats ?? m.fat) || 0,
      description: m.health_note || m.reasoning || '',
      healthNote: m.health_note || m.reasoning,
      usesExpiring: !!m.uses_expiring,
      match: matchScore ?? match,
      matchScore: matchScore ?? match,
      difficulty: m.difficulty || inferDifficulty(m.total_time_minutes, m.reasoning || ''),
      cuisine: m.cuisine || cuisinePref || 'Mixed',
      tags,
      uses: usedArr.join(', '),
      missed: missedArr,
      reasoning: m.reasoning,
      ingredients: allIngredients,
      instructions: normalizeInstructions(m.instructions),
    };
  });

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
  const inventoryItems = await Item.find({ user: req.user._id, status: ACTIVE_STATUSES }).limit(25);
  const inventoryNames = inventoryItems.map((item) => item.name);

  const cached = await GeneratedRecipe.findOne({ user: req.user._id, recipeId: req.params.id }).catch(() => null);
  if (cached && cached.data) {
    const data = cached.data;
    const recipeIngredients = extractRecipeIngredients(data);
    return res.json({
      recipe: {
        ...data,
        _id: req.params.id,
        match: data.matchScore ?? data.match ?? calculateMatchPercent(recipeIngredients, inventoryNames),
        matchScore: data.matchScore ?? data.match ?? calculateMatchPercent(recipeIngredients, inventoryNames),
      },
    });
  }

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
        matchScore: calculateMatchPercent(recipeIngredients, inventoryNames),
      },
    });
  }

  res.json({ recipe: { _id: req.params.id, title: 'Recipe', ingredients: [], instructions: [], match: 0, matchScore: 0 } });
});

exports.save = asyncHandler(async (req, res) => {
  res.json({ message: 'Saved', id: req.params.id });
});

exports.upload = asyncHandler(async (req, res) => {
  res.json({ url: req.file ? `/uploads/${req.file.filename}` : null });
});

exports.mealPlan = asyncHandler(async (req, res) => {
  const items = await Item.find({ user: req.user._id, status: ACTIVE_STATUSES }).limit(40);
  const condition = normalizeOptionalChoice(req.body.condition || req.user.healthCondition) || 'none';
  const prefs = req.user.preferences || {};

  const data = await aiPost('/ai/condition-meal-plan', {
    condition,
    available_ingredients: items.map((i) => i.name),
    inventory_items: buildInventoryPayload(items),
    dietary_preference: normalizeOptionalChoice(req.user.dietaryPreference || prefs.diet),
    cuisine_preference: normalizeOptionalChoice(req.body.cuisine || prefs.cuisine),
    units: buildUserProfilePayload(req.user, req.body).units,
    health_profile: buildUserProfilePayload(req.user, req.body),
    days: 7,
    expiring_warn_days: Number(prefs.expiryWarning || 3),
  }, { timeout: 90000 });

  const plan = await MealPlan.findOneAndUpdate(
    { user: req.user._id },
    { user: req.user._id, condition, weekPlan: normalizeMealPlan(data, items).weekPlan },
    { new: true, upsert: true }
  );
  res.json({ plan });
});

exports.getMealPlan = asyncHandler(async (req, res) => {
  const plan = await MealPlan.findOne({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ plan: plan || null });
});

exports.chatWithChef = asyncHandler(async (req, res) => {
  const { message, recipeContext, recipeName } = req.body || {};
  if (!message?.trim()) { res.status(400); throw new Error('Message is required'); }

  const history = (Array.isArray(req.body?.history) ? req.body.history : []).slice(-10).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || ''),
  }));

  const payload = {
    messages: [
      { role: 'system', content: 'You are FoodGuard AI Chef. Answer questions about recipes, cooking techniques, nutrition, and healthy substitutions. Be concise and practical.' },
      ...history,
      { role: 'user', content: recipeContext ? `${message}\n\nContext — ${recipeName || 'Current recipe'}: ${recipeContext}` : message },
    ],
    user_context: {
      dietary_preference: req.user?.dietaryPreference || req.user?.preferences?.diet,
      health_condition: req.user?.healthCondition,
    },
  };

  const data = await aiPost('/ai/chatbot', payload, { timeout: 30000 });
  const reply = data?.response || data?.message || 'Chef is thinking — please rephrase your question.';
  res.json({ chef_response: reply });
});
