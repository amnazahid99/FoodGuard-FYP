import { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Share2, Printer, Clock, Flame, Users, BarChart3,
  Star, Sparkles, ChevronRight, ShoppingCart, MessageSquare,
  Bookmark, BookmarkCheck, AlertTriangle, X as XIcon, Send, RefreshCw,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import mealsService from '../services/meals.service';

// ─── Data ────────────────────────────────────────────────────────────────────

// Dynamic ingredient groups computed from recipe data
function getIngredientGroups(recipe) {
  // If recipe has structured ingredients, use them
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    return [{
      category: 'Ingredients',
      items: recipe.ingredients.map(ing => ({
        name: typeof ing === 'string' ? ing : (ing.name || ing.originalName || ing.original || 'Unknown'),
        qty: typeof ing === 'object' ? (ing.amount ? `${ing.amount} ${ing.unit || ''}` : '') : ''
      }))
    }];
  }

  // If recipe has uses/missed fields (from AI recommendations), build from those
  if (recipe.uses || recipe.missed) {
    const items = [];
    if (recipe.uses) {
      recipe.uses.split(',').forEach(ing => items.push({ name: ing.trim(), qty: 'Available' }));
    }
    if (recipe.missed && Array.isArray(recipe.missed)) {
      recipe.missed.forEach(ing => items.push({ name: typeof ing === 'string' ? ing : (ing.name || ing), qty: 'Missing' }));
    }
    if (items.length > 0) {
      return [{ category: 'Recipe Ingredients', items }];
    }
  }

  // Fallback to empty - don't show dummy data
  return [];
}

// Dynamic steps computed from recipe data
function getSteps(recipe) {
  // If recipe has structured instructions, use them
  if (recipe.instructions && recipe.instructions.length > 0) {
    return recipe.instructions.map((step, index) => ({
      title: `Step ${index + 1}`,
      body: typeof step === 'string' ? step : (step.step || step.instruction || step.text || ''),
      time: typeof step === 'object' ? (step.time || step.minutes ? `${step.time || step.minutes || 0} mins` : '') : '',
      tip: null
    }));
  }

  // If recipe has reasoning/description, use as single step
  if (recipe.description || recipe.healthNote || recipe.reasoning) {
    return [{
      title: 'AI Generated Recipe',
      body: recipe.description || recipe.healthNote || recipe.reasoning || 'Recipe details not available.',
      time: recipe.prep || recipe.total || '',
      tip: null
    }];
  }

  // Fallback to empty - don't show dummy data
  return [];
}

// Dynamic macros derived from recipe nutrition data
function getMacros(recipe) {
  const calories = recipe.calories || 0;
  const protein = recipe.protein || 0;
  const carbs = recipe.carbs || 0;
  const fats = recipe.fats || 0;

  // Calculate total calories from macros as a sanity check
  const macroCalories = (protein * 4) + (carbs * 4) + (fats * 9);
  const dailyTotal = recipe.dailyTotal || 2000;

  return [
    { label: 'Carbohydrates', grams: carbs, daily: 48, color: '#3498DB', sub: 'Main energy source', pct: carbs > 0 ? Math.min(carbs / (macroCalories / 4 || 1), 1) : 0.5 },
    { label: 'Protein', grams: protein, daily: 76, color: '#1ABC9C', sub: 'Muscle building & repair', pct: protein > 0 ? Math.min(protein / 76, 1) : 0 },
    { label: 'Total Fat', grams: fats, daily: 23, color: '#F39C12', sub: 'Includes cooking oil & fats', pct: fats > 0 ? Math.min(fats / 23, 1) : 0 },
  ];
}

// Dynamic micros - placeholder since AI doesn't provide these
function getMicros() {
  return [];
}

// Dynamic health scores derived from recipe data
function getHealthScores(recipe) {
  const reasons = [];
  if (recipe.healthNote) reasons.push(recipe.healthNote);
  if (recipe.reasoning) reasons.push(recipe.reasoning);

  return [
    { label: 'AI Confidence', score: reasons.length ? 8 : 5 },
  ];
}

// Dynamic suitable for based on health condition
function getSuitableFor(healthCondition) {
  const condition = (healthCondition || 'none').toLowerCase();
  const suitable = [];

  if (condition === 'diabetes') {
    suitable.push({ label: 'Low Glycemic Diet', status: 'good' });
    suitable.push({ label: 'Weight Loss', status: 'good' });
    suitable.push({ label: 'High Sugar Diet', status: 'bad' });
  } else if (condition === 'hypertension' || condition === 'heart_disease') {
    suitable.push({ label: 'Heart Healthy Diet', status: 'good' });
    suitable.push({ label: 'Low Sodium Diet', status: 'good' });
    suitable.push({ label: 'High Sodium Diet', status: 'bad' });
  } else if (condition === 'weight_loss') {
    suitable.push({ label: 'Calorie Controlled', status: 'good' });
    suitable.push({ label: 'High Calorie Diet', status: 'bad' });
  }

  return suitable;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildRecipeFromRecommendation(recipe) {
  if (!recipe) {
    return null;
  }

  return {
    name: recipe.name || recipe.title || 'Recipe',
    description: recipe.description || recipe.healthNote || recipe.reasoning || '',
    image: recipe.image || '',
    tags: recipe.tags || [],
    match: recipe.match ?? 0,
    rating: recipe.rating || 0,
    reviews: recipe.reviews || 0,
    prep: recipe.prep || '',
    cook: recipe.cook || '',
    total: recipe.total || '',
    servingsLabel: recipe.servingsLabel || 'Serves',
    difficulty: recipe.difficulty || '',
    calories: recipe.calories || 0,
    dailyTotal: recipe.dailyTotal || 2000,
    ingredients: recipe.ingredients || [],
    instructions: recipe.instructions || [],
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusIcon(s) {
  if (s === 'good')    return <span className="text-green-400">✅</span>;
  if (s === 'warn')    return <span className="text-orange-400">⚠️</span>;
  if (s === 'bad')     return <span className="text-red-400">❌</span>;
  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RecipeDetail() {
  const { id } = useParams();
  const location = useLocation();
  const initialRecommendation = location.state?.recipe;
  // Use recipe from state (passed from recommendations list) or fetch from backend
  // by id (resolved from the per-user generated-recipe cache). Never fall back to
  // hardcoded demo data — that's what caused the wrong recipe to display.
  const [recipe, setRecipe] = useState(buildRecipeFromRecommendation(initialRecommendation) || null);
  const [loading, setLoading] = useState(false);

  const [servings, setServings]         = useState(4);
  const [checked, setChecked]           = useState({});
  const [saved, setSaved]               = useState(false);
  const [compareOpen, setCompareOpen]   = useState(false);
  const [healthierRecipe, setHealthierRecipe] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [chatOpen, setChatOpen]         = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput]       = useState('');
  const [chatLoading, setChatLoading]   = useState(false);
  const { c, isDark } = useTheme();

  const onCardPrimary   = isDark ? c.textPrimary   : c.textOnCardPrimary;
  const onCardSecondary = isDark ? c.textSecondary : c.textOnCardSecondary;
  const onCardMuted     = isDark ? c.textMuted     : (c.textOnCardMuted || c.textOnCardSecondary);

  const baseServings = 4;
  const ratio = servings / baseServings;

  // Get dynamic ingredient groups and steps from recipe data
  const ingredientGroups = getIngredientGroups(recipe);
  const steps = getSteps(recipe);
  const macros = getMacros(recipe);
  const micros = getMicros();
  const healthScores = getHealthScores(recipe);
  const suitableFor = getSuitableFor(recipe?.healthCondition);

  const toggleCheck = (key) =>
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));

  // Handle opening compare modal and fetching healthier version
  const handleCompareClick = async () => {
    setCompareOpen(true);
    setCompareLoading(true);
    setHealthierRecipe(null);
    try {
      const result = await mealsService.recommend({
        query: recipe?.name || '',
        health_condition: 'none',
        dietary_preference: 'none',
      });
      const list = Array.isArray(result) ? result : (result?.recipes || []);
      if (list && list.length > 0) {
        setHealthierRecipe(list[0]);
      }
    } catch (e) {
      // ignore
    } finally {
      setCompareLoading(false);
    }
  };

  const closeCompare = () => setCompareOpen(false);

  // Chat handlers
  const openChat = () => {
    setChatOpen(true);
    if (chatMessages.length === 0) {
      setChatMessages([{ role: 'assistant', content: 'Hi! I\'m your FoodGuard AI Chef. Ask me anything about this recipe, nutrition tips, or cooking advice!' }]);
    }
  };

  const closeChat = () => setChatOpen(false);

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);
    try {
      const result = await mealsService.chatWithChef({
        message: userMsg,
        history: chatMessages,
        recipeContext: recipe?.reasoning || recipe?.healthNote || '',
        recipeName: recipe?.name || ''
      });
      const reply = result?.chef_response || result?.response || 'Sorry, I could not process your request.';
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, the AI Chef is temporarily unavailable. Please try again later.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  // Fetch recipe from backend and map to UI shape; fallback to static demo
  useEffect(() => {
    if (initialRecommendation) {
      setRecipe(buildRecipeFromRecommendation(initialRecommendation));
      return;
    }

    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await mealsService.recipe(id);
        const r = data?.recipe || data || null;
        if (!r) return;
        if (!active) return;
        setRecipe({
          name: r.title || r.name || 'Recipe',
          description: r.description || r.healthNote || '',
          image: r.image || '',
          tags: r.tags || [],
          match: r.match || 0,
          rating: r.rating || 0,
          reviews: r.reviews || 0,
          prep: r.prep || r.time || '',
          cook: r.cook || '',
          total: r.total || '',
          servingsLabel: r.servingsLabel || 'Serves',
          difficulty: r.difficulty || '',
          calories: r.calories || 0,
          dailyTotal: r.dailyTotal || 2000,
          ingredients: r.ingredients || [],
          instructions: r.instructions || [],
        });
      } catch (e) {
        // ignore, leave fallback
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, initialRecommendation]);

  // keep rendering safe if recipe still loading or not fetched
  if (!recipe) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center">Loading recipe…</div>
    );
  }

  // calories ring: per-recipe calories vs daily total
  const ringR = 54;
  const ringCirc = 2 * Math.PI * ringR;
  const ringPct = (recipe.calories * ratio) / recipe.dailyTotal;

  const cardStyle = {
    background: c.cardBg,
    border: `1px solid ${c.borderLight}`,
    boxShadow: c.cardShadow,
  };

  return (
    <div className="min-h-screen pb-24" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ════════════════════════ HERO BANNER ════════════════════════ */}
      <div className="relative w-full" style={{ height: '420px' }}>
        <img
          src={recipe.image}
          alt={recipe.name}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay — always darken bottom so white text stays readable in both themes */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.65) 100%)' }}
        />

        {/* Top-right icon buttons */}
        <div className="absolute top-5 right-6 flex gap-2" style={{ marginTop: '72px' }}>
          {[
            { Icon: Heart,   label: 'Save'  },
            { Icon: Share2,  label: 'Share' },
            { Icon: Printer, label: 'Print' },
          ].map(({ Icon, label }) => (
            <button
              key={label}
              title={label}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <Icon className="w-4 h-4 text-white" />
            </button>
          ))}
        </div>

        {/* Bottom-left: breadcrumb + title + tags */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            {/* Left */}
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-1 mb-2 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <Link to="/ai-meals" className="hover:text-white transition-colors">AI Meals</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white">{recipe.name}</span>
              </div>
              {/* Title */}
              <h1
                className="text-white font-bold mb-2"
                style={{ fontSize: '42px', lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
              >
                {recipe.name}
              </h1>
              {/* Description */}
              <p className="text-white mb-4 max-w-lg" style={{ fontSize: '16px', opacity: 0.88 }}>
                {recipe.description}
              </p>
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-sm text-white"
                    style={{
                      background: 'rgba(255,255,255,0.12)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right */}
            <div className="flex flex-col gap-2 items-start lg:items-end flex-shrink-0">
              <span
                className="px-4 py-1.5 rounded-full text-sm font-semibold text-white"
                style={{ background: c.teal, boxShadow: `0 0 16px ${c.teal}80` }}
              >
                {recipe.match}% match with your inventory
              </span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-white text-sm font-semibold">{recipe.rating}</span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>({recipe.reviews} reviews)</span>
              </div>
              <span
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: c.tagBg, color: c.teal, border: `1px solid ${c.border}` }}
              >
                ✨ AI Generated Recipe
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════ QUICK INFO BAR ════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 mt-6 mb-8">
        <div
          className="rounded-2xl px-6 py-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
          style={cardStyle}
        >
          {[
            { Icon: Clock,    label: 'Prep Time',  value: recipe.prep },
            { Icon: Flame,    label: 'Cook Time',  value: recipe.cook },
            { Icon: Clock,    label: 'Total Time', value: recipe.total },
            { Icon: Users,    label: 'Servings',   value: recipe.servingsLabel },
            { Icon: BarChart3, label: 'Difficulty', value: recipe.difficulty },
          ].map(({ Icon, label, value }, i, arr) => (
            <div key={label} className="flex flex-col items-center text-center relative">
              <Icon className="w-5 h-5 mb-1" style={{ color: c.teal }} />
              <div className="text-xs mb-0.5" style={{ color: onCardSecondary }}>{label}</div>
              <div className="font-bold" style={{ fontSize: '16px', color: onCardPrimary }}>{value}</div>
              {i < arr.length - 1 && (
                <div
                  className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 h-8"
                  style={{ width: '1px', background: c.divider }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════ TWO COLUMNS ════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── LEFT COLUMN (70%) ── */}
          <div className="flex-1 min-w-0">

            {/* ─── INGREDIENTS ─── */}
            <motion.section
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="rounded-2xl p-6 mb-8"
              style={cardStyle}
            >
              <h2 className="font-bold mb-1" style={{ fontSize: '22px', color: onCardPrimary }}>🧄 Ingredients</h2>
              <p className="text-sm mb-4" style={{ color: onCardSecondary }}>
                For {servings} servings — adjust using the serving size selector below
              </p>

              {/* Serving size adjuster */}
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <span className="text-sm" style={{ color: onCardPrimary }}>Servings:</span>
                <button
                  onClick={() => setServings(s => Math.max(1, s - 1))}
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg transition-all hover:scale-110"
                  style={{ border: `1px solid ${c.teal}`, color: c.teal, background: 'transparent' }}
                >–</button>
                <div
                  className="w-10 h-8 rounded-lg flex items-center justify-center font-bold"
                  style={{ border: `1px solid ${c.teal}`, color: onCardPrimary }}
                >{servings}</div>
                <button
                  onClick={() => setServings(s => s + 1)}
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg transition-all hover:scale-110"
                  style={{ border: `1px solid ${c.teal}`, color: c.teal, background: 'transparent' }}
                >+</button>
                <span className="text-xs" style={{ color: onCardMuted }}>(quantities update automatically)</span>
              </div>

              {/* Ingredient groups */}
              <div className="space-y-6">
                {ingredientGroups.map(group => (
                  <div key={group.category}>
                    <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: c.teal }}>
                      {group.category}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {group.items.map(item => {
                        const key = `${group.category}-${item.name}`;
                        const done = checked[key];
                        return (
                          <div
                            key={key}
                            onClick={() => toggleCheck(key)}
                            className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all group"
                            style={{
                              borderLeft: done ? `3px solid ${c.teal}` : '3px solid transparent',
                              background: done ? `${c.teal}0d` : 'transparent',
                            }}
                            onMouseEnter={e => {
                              if (!done) (e.currentTarget).style.borderLeftColor = `${c.teal}59`;
                            }}
                            onMouseLeave={e => {
                              if (!done) (e.currentTarget).style.borderLeftColor = 'transparent';
                            }}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all"
                                style={{
                                  border: `1.5px solid ${done ? c.teal : c.inputBorder}`,
                                  background: done ? c.teal : 'transparent',
                                }}
                              >
                                {done && <span className="text-white text-[10px] font-bold">✓</span>}
                              </div>
                              <span
                                className="text-sm"
                                style={{
                                  color: done ? onCardMuted : onCardPrimary,
                                  textDecoration: done ? 'line-through' : 'none',
                                  transition: 'all 0.2s',
                                }}
                              >{item.name}</span>
                            </div>
                            <span className="text-sm font-medium flex-shrink-0 ml-3" style={{ color: c.teal }}>
                              {scaleQty(item.qty, ratio)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Shopping list button */}
              <button
                className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{ border: `1px solid ${c.teal}`, color: c.teal, background: 'transparent' }}
              >
                <ShoppingCart className="w-4 h-4" />
                📋 Add Missing Items to Shopping List
              </button>
            </motion.section>

            {/* ─── INSTRUCTIONS ─── */}
            <motion.section
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="font-bold mb-6" style={{ fontSize: '22px', color: c.textPrimary }}>
                👨‍🍳 Step-by-Step Instructions
              </h2>
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                    className="rounded-xl p-5 relative"
                    style={{
                      background: c.cardBg,
                      borderLeft: `4px solid ${c.teal}`,
                      marginBottom: '16px',
                      boxShadow: c.cardShadow,
                    }}
                  >
                    <div
                      className="absolute -left-5 top-5 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                      style={{ background: c.teal, boxShadow: `0 0 16px ${c.teal}66` }}
                    >
                      {i + 1}
                    </div>
                    <div className="pl-7">
                      <h3 className="font-semibold mb-2" style={{ fontSize: '16px', color: onCardPrimary }}>{step.title}</h3>
                      <p className="text-sm mb-3 leading-relaxed" style={{ color: onCardSecondary }}>{step.body}</p>
                      <div className="flex items-center gap-1.5 text-xs mb-3" style={{ color: c.teal }}>
                        <Clock className="w-3 h-3" />
                        <span>{step.time}</span>
                      </div>
                      {step.tip && (
                        <div
                          className="rounded-lg px-3 py-2.5 text-xs leading-relaxed"
                          style={{
                            background: `${c.teal}0f`,
                            border: `1px solid ${c.teal}33`,
                            color: onCardSecondary,
                          }}
                        >
                          💡 {step.tip}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* ─── AI HEALTH INSIGHT ─── */}
            <motion.section
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="rounded-2xl p-6 mb-8"
              style={{
                background: c.cardBg,
                borderLeft: `4px solid ${c.teal}`,
                border: `1px solid ${c.border}`,
                boxShadow: c.cardShadow,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5" style={{ color: c.teal }} />
                <span className="font-bold text-base" style={{ color: c.teal }}>🤖 AI Health Insight</span>
              </div>
              <p className="text-xs mb-4" style={{ color: onCardMuted }}>Generated based on your health profile</p>
              <p className="text-sm leading-relaxed mb-4" style={{ color: onCardSecondary }}>
                {recipe.reasoning || recipe.healthNote || recipe.description || 'No specific health insights available for this recipe.'}
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {recipe.tags && recipe.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: `${c.teal}22`, color: c.teal }}>
                    {tag}
                  </span>
                ))}
              </div>
<button
                 onClick={openChat}
                 className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                 style={{ border: `1px solid ${c.teal}`, color: c.teal, background: 'transparent' }}
               >
                 <MessageSquare className="w-4 h-4" />
                 💬 Ask AI Chef About This Recipe
               </button>
            </motion.section>
          </div>

          {/* ── RIGHT COLUMN (30%) — sticky sidebar ── */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-5">

              {/* ─── NUTRITION PANEL ─── */}
              <div
                className="rounded-2xl p-6"
                style={cardStyle}
              >
                <h2 className="font-bold mb-0.5" style={{ fontSize: '20px', color: onCardPrimary }}>📊 Nutrition Facts</h2>
                <p className="text-xs mb-5" style={{ color: onCardSecondary }}>Per serving (1 of {servings})</p>

                {/* Calorie ring */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative" style={{ width: 136, height: 136 }}>
                    <svg width="136" height="136" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="68" cy="68" r={ringR} fill="none" stroke={c.divider} strokeWidth="12" />
                      <circle
                        cx="68" cy="68" r={ringR} fill="none"
                        stroke={c.teal} strokeWidth="12"
                        strokeDasharray={`${ringCirc * Math.min(ringPct, 1)} ${ringCirc}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 0.6s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-bold" style={{ fontSize: '36px', color: c.teal, lineHeight: 1 }}>
                        {Math.round(recipe.calories * ratio)}
                      </span>
                      <span className="text-xs text-center" style={{ color: onCardSecondary }}>kcal per serving</span>
                    </div>
                  </div>
                  <p className="text-xs mt-2" style={{ color: onCardMuted }}>
                    {Math.round(ringPct * 100)}% of daily intake ({recipe.dailyTotal} kcal)
                  </p>
                </div>

                {/* Macros */}
                <div className="mb-5">
                  <h3 className="font-bold mb-3" style={{ fontSize: '16px', color: onCardPrimary }}>Macronutrients</h3>
                  <div className="space-y-3">
                    {macros.map(m => (
                      <div key={m.label}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm" style={{ color: onCardSecondary }}>{m.label}</span>
                          <span className="text-sm font-bold" style={{ color: onCardPrimary }}>{m.grams ? Math.round(m.grams * ratio) + 'g' : '-'}</span>
                        </div>
                        <div className="h-1.5 rounded-full w-full" style={{ background: c.divider }}>
                          <div
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(m.pct * 100, 100)}%`, background: m.color }}
                          />
                        </div>
                        <div className="flex justify-between mt-0.5">
                          <span className="text-[10px]" style={{ color: onCardMuted }}>{m.sub}</span>
                          <span className="text-[10px]" style={{ color: onCardMuted }}>{m.daily ? Math.round(m.daily) + '% daily' : '-'}</span>
                        </div>
                        {m.label === 'Total Fat' && m.grams && (
                          <div className="ml-3 mt-1 space-y-0.5">
                            <div className="text-[11px]" style={{ color: onCardMuted }}>└ Saturated Fat: {Math.round(m.grams * 0.3 * ratio)}g</div>
                            <div className="text-[11px]" style={{ color: onCardMuted }}>└ Unsaturated Fat: {Math.round(m.grams * 0.7 * ratio)}g</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="my-4" style={{ height: '1px', background: c.divider }} />

                {/* Micros */}
                <div className="mb-4">
                  <h3 className="font-bold mb-3" style={{ fontSize: '16px', color: onCardPrimary }}>Micronutrients</h3>
                  {micros && micros.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                        {micros.map(m => (
                          <div key={m.name} className="flex items-center justify-between gap-1">
                            <span className="text-[12px]" style={{ color: onCardSecondary }}>{m.name}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[12px] font-bold" style={{ color: onCardPrimary }}>{m.value}</span>
                              {statusIcon(m.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs" style={{ color: onCardMuted }}>Nutrient details not available for this recipe.</p>
                  )}
                </div>

                <div className="my-4" style={{ height: '1px', background: c.divider }} />

                {/* Health Score */}
                <div
                  className="rounded-xl p-4 mb-4"
                  style={{ background: `${c.teal}12`, border: `1px solid ${c.teal}26` }}
                >
                  <div className="text-sm font-semibold mb-1" style={{ color: onCardPrimary }}>Overall Health Score</div>
                  <div className="font-bold mb-1" style={{ fontSize: '26px', color: c.teal }}>
                    {recipe.match ? Math.round(recipe.match / 10) : 5} / 10
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {[1,2,3,4].map(i => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                    <Star className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="space-y-2">
                    {healthScores.map(s => (
                      <div key={s.label}>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[11px]" style={{ color: onCardSecondary }}>{s.label}</span>
                          <span className="text-[11px] font-bold" style={{ color: c.teal }}>{s.score}/10</span>
                        </div>
                        <div className="h-1 rounded-full" style={{ background: c.divider }}>
                          <div
                            className="h-1 rounded-full"
                            style={{ width: `${s.score * 10}%`, background: c.teal, transition: 'width 0.5s ease' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="my-4" style={{ height: '1px', background: c.divider }} />

                {/* Suitable For */}
                <div className="mb-4">
                  <h3 className="font-bold mb-3" style={{ fontSize: '14px', color: onCardPrimary }}>Suitable For</h3>
                  <div className="flex flex-wrap gap-2">
                    {suitableFor && suitableFor.length > 0 ? suitableFor.map(s => (
                      <span
                        key={s.label}
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          background:
                            s.status === 'good' ? 'rgba(34,197,94,0.1)' :
                            s.status === 'warn' ? 'rgba(245,158,11,0.1)' :
                            'rgba(239,68,68,0.1)',
                          color:
                            s.status === 'good' ? '#4ade80' :
                            s.status === 'warn' ? '#f59e0b' :
                            '#f87171',
                        }}
                      >
                        {s.status === 'good' ? '✅' : s.status === 'warn' ? '⚠️' : '❌'} {s.label}
                      </span>
                    )) : (
                      <span className="text-xs" style={{ color: onCardMuted }}>No specific restrictions</span>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="my-4" style={{ height: '1px', background: c.divider }} />

                {/* Compare button */}
                <button
                  onClick={handleCompareClick}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold mb-3 transition-all hover:scale-[1.02]"
                  style={{ border: `1px solid ${c.teal}`, color: c.teal, background: 'transparent' }}
                >
                  ⚖️ Compare with Healthier Version
                </button>

                {/* Save & Share */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSaved(s => !s)}
                    className="py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                    style={{ border: `1px solid ${c.teal}`, color: c.teal, background: saved ? `${c.teal}1a` : 'transparent' }}
                  >
                    {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    {saved ? 'Saved' : '🔖 Save'}
                  </button>
                  <button
                    className="py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                    style={{ border: `1px solid ${c.teal}`, color: c.teal, background: 'transparent' }}
                  >
                    <Share2 className="w-4 h-4" />
                    📤 Share
                  </button>
                </div>
</div>
               </div>
             </div>
           </div>
         </div>

         {/* Compare Modal */}
         <AnimatePresence>
           {compareOpen && (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 flex items-center justify-center p-4"
               style={{ background: 'rgba(0,0,0,0.6)' }}
               onClick={closeCompare}
             >
               <motion.div
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.9, opacity: 0 }}
                 className="rounded-2xl p-6 max-w-lg w-full"
                 style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.elevatedShadow }}
                 onClick={e => e.stopPropagation()}
               >
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="font-bold" style={{ color: onCardPrimary }}>Healthier Alternative</h3>
                   <button onClick={closeCompare} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10">
                     <XIcon className="w-4 h-4" style={{ color: onCardSecondary }} />
                   </button>
                 </div>
                 {compareLoading ? (
                   <div className="text-center py-8" style={{ color: onCardSecondary }}>Loading healthier version...</div>
                 ) : healthierRecipe ? (
                   <div>
                     <p className="text-sm mb-2" style={{ color: onCardPrimary }}><strong>{healthierRecipe.name}</strong></p>
                     <p className="text-xs mb-3" style={{ color: onCardSecondary }}>{healthierRecipe.description || healthierRecipe.healthNote}</p>
                     <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: onCardMuted }}>
                       <span>Calories: {healthierRecipe.calories || 0} kcal</span>
                       <span>Protein: {Math.round(healthierRecipe.protein || 0)}g</span>
                       <span>Carbs: {Math.round(healthierRecipe.carbs || 0)}g</span>
                       <span>Fat: {Math.round(healthierRecipe.fats || 0)}g</span>
                     </div>
                   </div>
                 ) : (
                   <p className="text-sm" style={{ color: onCardSecondary }}>No alternative found. Try generating new recommendations.</p>
                 )}
               </motion.div>
             </motion.div>
           )}
         </AnimatePresence>

         {/* Chat Modal */}
         <AnimatePresence>
           {chatOpen && (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 flex items-end justify-end p-4"
               style={{ background: 'rgba(0,0,0,0.3)' }}
               onClick={closeChat}
             >
               <motion.div
                 initial={{ x: 300, y: 100, opacity: 0 }}
                 animate={{ x: 0, y: 0, opacity: 1 }}
                 exit={{ x: 300, y: 100, opacity: 0 }}
                 className="rounded-2xl flex flex-col w-80 sm:w-96"
                 style={{ 
                   background: c.cardBg, 
                   border: `1px solid ${c.border}`, 
                   boxShadow: c.elevatedShadow,
                   maxHeight: '450px'
                 }}
                 onClick={e => e.stopPropagation()}
               >
                 {/* Header */}
                 <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: c.border }}>
                   <div className="flex items-center gap-2">
                     <MessageSquare className="w-5 h-5" style={{ color: c.teal }} />
                     <span className="font-bold" style={{ color: onCardPrimary }}>AI Chef Chat</span>
                   </div>
                   <button onClick={closeChat} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10">
                     <XIcon className="w-4 h-4" style={{ color: onCardSecondary }} />
                   </button>
                 </div>

                 {/* Messages */}
                 <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: '320px' }}>
                   {chatMessages.map((msg, i) => (
                     <div key={i} className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div
                         className="max-w-[80%] rounded-xl px-3 py-2 text-sm"
                         style={{
                           background: msg.role === 'user' ? c.teal : c.tagBg,
                           color: msg.role === 'user' ? '#fff' : onCardPrimary,
                         }}
                       >
                         {msg.content}
                       </div>
                     </div>
                   ))}
                   {chatLoading && (
                     <div className="mb-3 flex justify-start">
                       <div className="rounded-xl px-3 py-2 text-sm" style={{ background: c.tagBg, color: onCardSecondary }}>
                         Thinking...
                       </div>
                     </div>
                   )}
                 </div>

                 {/* Input */}
                 <div className="p-3 border-t flex gap-2" style={{ borderColor: c.border }}>
                   <input
                     type="text"
                     value={chatInput}
                     onChange={e => setChatInput(e.target.value)}
                     onKeyPress={handleChatKeyPress}
                     placeholder="Ask about this recipe..."
                     className="flex-1 rounded-lg text-sm outline-none"
                     style={{
                       background: c.inputBg,
                       border: `1px solid ${c.inputBorder}`,
                       color: c.inputText || '#fff',
                       padding: '8px 12px',
                     }}
                   />
                   <button
                     onClick={handleChatSend}
                     disabled={!chatInput.trim() || chatLoading}
                     className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-50"
                     style={{ background: c.teal }}
                   >
                     <Send className="w-4 h-4 text-white" />
                   </button>
                 </div>
               </motion.div>
             </motion.div>
           )}
         </AnimatePresence>

    </div>
  );
}

// ─── Utility: scale textual quantities ───────────────────────────────────────
function scaleQty(qty, ratio) {
  if (ratio === 1) return qty;
  // Try to scale leading number
  const m = qty.match(/^([\d.⅛¼½¾⅓⅔]+)\s*(.*)/);
  if (!m) return qty;
  const num = parseFloat(m[1]);
  if (isNaN(num)) return qty;
  const scaled = num * ratio;
  const rest = m[2];
  // Format neatly
  const fmt = scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1).replace(/\.0$/, '');
  return `${fmt}${rest ? ' ' + rest : ''}`;
}
