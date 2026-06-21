import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Clock, Flame, ChefHat, Upload, Leaf, CalendarDays, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useInventory } from '../contexts/InventoryContext';
import mealsService from '../services/meals.service';

const quickTags = ['+ Diabetic Friendly', '+ Low Calorie', '+ High Protein', '+ Heart Healthy'];
const conditions = [
  { value: 'none', label: 'General Healthy' },
  { value: 'diabetes', label: 'Diabetic-Friendly' },
  { value: 'hypertension', label: 'Low-Sodium (Hypertension)' },
  { value: 'heart_disease', label: 'Heart-Healthy' },
  { value: 'weight_loss', label: 'Weight Loss' },
];

const AI_UNAVAILABLE_MESSAGE = 'AI service is temporarily unavailable. Please try again';

export function AIMeals() {
  const [tab, setTab]                   = useState('recommend');
  const [queryText, setQueryText]       = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging]     = useState(false);
  const [isAnalyzing, setIsAnalyzing]   = useState(false);
  const [recipes, setRecipes]           = useState([]);
  const [error, setError]               = useState(null);
  const [quota, setQuota]               = useState(null);

  // Meal plan state (Feature 4)
  const [plan, setPlan]                 = useState(null);
  const [planCondition, setPlanCondition] = useState('none');
  const [planLoading, setPlanLoading]   = useState(false);
  const [planError, setPlanError]       = useState(null);

  const recipesRef = useRef(null);
  const { c, isDark } = useTheme();
  const { items } = useInventory();
  const { user } = useAuth();
  const onCardPrimary   = isDark ? c.textPrimary   : c.textOnCardPrimary;
  const onCardSecondary = isDark ? c.textSecondary : c.textOnCardSecondary;
  const onCardMuted     = isDark ? c.textMuted     : (c.textOnCardMuted || c.textOnCardSecondary);

  const fetchRecommendations = async (extra = {}) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await mealsService.recommend({
        query: queryText,
        ingredients: (items || []).map(i => i.name),
        // include stored user preferences (if present) so backend can honor them
        health_condition: user?.healthCondition || undefined,
        dietary_preference: user?.dietaryPreference || user?.preferences?.diet || undefined,
        cuisine: user?.preferences?.cuisine || undefined,
        ...extra,
      });
      const list = Array.isArray(result) ? result : (result?.recipes || []);
      setRecipes(list);
      if (result && result.quota) setQuota(result.quota);
    } catch (e) {
      const message = e?.message || '';
      setError(message.includes('AI service') ? AI_UNAVAILABLE_MESSAGE : (message || 'Could not get recommendations.'));
      setRecipes([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retryRecommendations = async () => {
    await fetchRecommendations({ manual: true });
    recipesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Auto-load recommendations on first visit
  useEffect(() => { fetchRecommendations(); /* eslint-disable-next-line */ }, []);

  // Load the saved meal plan when opening that tab
  useEffect(() => {
    if (tab !== 'plan') return;
    setPlanLoading(true);
    setPlanError(null);
    (async () => {
      try {
        const p = await mealsService.getMealPlan();
        if (p) { setPlan(p); setPlanCondition(p.condition || 'none'); }
      } catch (_) { setPlan(null); }
    })();
    return () => {};
    /* eslint-disable-next-line */
  }, [tab]);

  const handleGetRecommendations = async () => {
    await retryRecommendations();
  };

  const handleGeneratePlan = async () => {
    setPlanLoading(true);
    setPlanError(null);
    try {
      const p = await mealsService.generateMealPlan(planCondition);
      setPlan(p);
    } catch (e) {
      const message = e?.message || '';
      setPlanError(message.includes('AI service') ? AI_UNAVAILABLE_MESSAGE : (message || 'Could not generate meal plan.'));
    } finally {
      setPlanLoading(false);
    }
  };

  const appendTag = (tag) => {
    const clean = tag.replace('+ ', '');
    setQueryText(prev => (prev.trim() ? `${prev.trim()}, ${clean}` : clean));
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) setUploadedFile(e.target.files[0].name);
  };

  const tabBtn = (key, label, Icon) => (
    <button
      onClick={() => setTab(key)}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
      style={{
        background: tab === key ? c.teal : 'transparent',
        color: tab === key ? '#fff' : onCardSecondary,
        border: `1px solid ${tab === key ? c.teal : c.border}`,
        cursor: 'pointer',
      }}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  const renderPlanMeal = (mealKey, meal) => {
    if (!meal) return null;
    const instructions = Array.isArray(meal.instructions) ? meal.instructions : (typeof meal.instructions === 'string' ? [meal.instructions] : []);
    return (
      <div className="mb-3 rounded-xl p-3" style={{ background: c.inlineCardBg, border: `1px solid ${c.inlineCardBorder}` }}>
        <div className="text-xs uppercase tracking-wide mb-1" style={{ color: c.teal }}>{mealKey}</div>
        <div className="text-sm font-medium" style={{ color: onCardPrimary }}>{meal.name}</div>
        <div className="text-xs mt-1 flex flex-wrap gap-2" style={{ color: onCardSecondary }}>
          <span><Flame className="w-3 h-3 inline mr-1" />{meal.calories || 0} kcal</span>
          <span>P {Math.round(meal.protein || 0)}g</span>
          <span>C {Math.round(meal.carbs || 0)}g</span>
          <span>F {Math.round(meal.fats || 0)}g</span>
        </div>
        {meal.ingredients?.length ? (
          <p className="text-xs mt-2" style={{ color: onCardMuted }}>Ingredients: {(meal.ingredients || []).slice(0, 5).join(', ')}</p>
        ) : null}
        {instructions.length ? (
          <p className="text-xs mt-1" style={{ color: onCardMuted }}>Instructions: {instructions.slice(0, 2).join(' ')}</p>
        ) : null}
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        {/* ── Page Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }} className="mb-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${c.teal}22` }}>
              <Sparkles className="w-5 h-5" style={{ color: c.teal }} />
            </div>
            <h1 className="text-3xl font-bold" style={{ color: c.textPrimary, fontFamily: 'Poppins, sans-serif' }}>
              AI Meal Recommendations
            </h1>
          </div>
          <p style={{ color: c.textSecondary }} className="text-sm">
            Personalized recipes generated from your current inventory to minimize waste.
          </p>
        </motion.div>

        {/* ── Tabs ── */}
        <div className="flex gap-3 mb-8">
          {tabBtn('recommend', 'Recommendations', Sparkles)}
          {tabBtn('plan', 'My Meal Plan', CalendarDays)}
        </div>

        {tab === 'recommend' && (
        <>
        {/* ── Ask AI Chef ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mb-6"
          style={{
            background:   c.cardBg,
            border:       `1px solid ${c.border}`,
            borderLeft:   `3px solid ${c.teal}`,
            borderRadius: '16px',
            padding:      '28px',
            boxShadow:    c.cardShadow,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <ChefHat className="w-5 h-5" style={{ color: c.teal }} />
              <span className="font-bold" style={{ fontSize: '22px', color: onCardPrimary, fontFamily: 'Inter, sans-serif' }}>
                Ask AI Chef
              </span>
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: c.tagBg, color: c.teal, border: `1px solid ${c.border}` }}
            >
              Powered by AI
            </span>
          </div>

          <p className="mb-5 text-sm" style={{ color: onCardSecondary }}>
            Tell our AI Chef what's in your fridge or describe your health condition — get instant personalized meal recommendations with full nutrition details.
          </p>

          {quota && !quota.unlimited && quota.limit != null && (
            <div className="mb-5 text-xs font-medium">
              {quota.remaining > 0 ? (
                <span style={{ color: c.teal }}>
                  {quota.remaining} of {quota.limit} free AI generations left this week
                </span>
              ) : (
                <span style={{ color: '#ef4444' }}>
                  Weekly free limit reached.{' '}
                  <Link to="/pricing" className="underline font-semibold">Upgrade to Pro</Link> for unlimited.
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 mb-5">
            {/* Textarea */}
            <div className="flex flex-col gap-2" style={{ flex: '0 0 60%' }}>
              <label className="text-xs" style={{ color: onCardSecondary, fontFamily: 'Inter, sans-serif' }}>
                Type your ingredients or health condition
              </label>
              <textarea
                rows={3}
                value={queryText}
                onChange={e => setQueryText(e.target.value)}
                placeholder="e.g. I have chicken, spinach, onions, tomatoes..."
                className="w-full resize-none rounded-xl text-sm outline-none"
                style={{
                  background:  c.inputBg,
                  border:      `1px solid ${c.inputBorder}`,
                  color:       c.inputText || '#FFFFFF',
                  padding:     '12px 14px',
                  fontFamily:  'Inter, sans-serif',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = c.teal; e.currentTarget.style.boxShadow = `0 0 0 2px ${c.teal}26`; }}
                onBlur={e => { e.currentTarget.style.borderColor = c.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <div className="flex flex-wrap gap-2 mt-1">
                {quickTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => appendTag(tag)}
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ border: `1px solid ${c.teal}66`, color: c.teal, background: 'transparent', cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget).style.background = c.tagBg; }}
                    onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload */}
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-xs" style={{ color: onCardSecondary, fontFamily: 'Inter, sans-serif' }}>
                Or upload ingredients list
              </label>
              <label
                className="flex-1 flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer"
                style={{
                  border:     `2px dashed ${isDragging ? c.teal : `${c.teal}59`}`,
                  background: isDragging ? c.tagBg : c.inputBg,
                  minHeight:  '110px',
                  padding:    '16px',
                }}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) setUploadedFile(e.dataTransfer.files[0].name); }}
              >
                <input type="file" accept=".txt,.pdf,image/*" className="hidden" onChange={handleFileChange} />
                <Upload className="w-7 h-7" style={{ color: c.teal }} />
                {uploadedFile ? (
                  <span className="text-xs font-medium text-center" style={{ color: c.teal }}>{uploadedFile}</span>
                ) : (
                  <>
                    <span className="text-sm" style={{ color: onCardPrimary }}>Drop your list here</span>
                    <span className="text-xs" style={{ color: c.teal }}>or click to browse</span>
                    <span className="text-xs" style={{ color: onCardMuted }}>Supports .txt, .pdf, image</span>
                  </>
                )}
              </label>
              <p className="text-xs text-center" style={{ color: onCardMuted }}>AI will extract ingredients automatically</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs max-w-xs" style={{ color: onCardMuted }}>
              AI will analyze ingredients + suggest meals with calories, protein, carbs &amp; health score
            </p>
            <motion.button
              onClick={handleGetRecommendations}
              disabled={isAnalyzing}
              whileHover={{ scale: isAnalyzing ? 1 : 1.03 }} whileTap={{ scale: isAnalyzing ? 1 : 0.97 }}
              className="flex-shrink-0 px-6 py-3 rounded-xl text-white font-bold text-base disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: c.teal, boxShadow: `0 0 20px ${c.teal}66`, fontFamily: 'Inter, sans-serif', borderRadius: '10px' }}
            >
              {isAnalyzing ? 'Analyzing…' : '✨ Get AI Recommendations'}
            </motion.button>
          </div>
        </motion.div>

        {/* ── Analyzing Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-2xl p-5 mb-8 flex items-center gap-4"
          style={{ background: `${c.teal}18`, border: `1px solid ${c.border}` }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: c.teal }}>
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm mb-0.5" style={{ color: onCardPrimary }}>
              {isAnalyzing ? 'AI Chef is analyzing your inventory…' : 'AI Chef is ready'}
            </div>
            <div className="text-xs" style={{ color: onCardSecondary }}>
              Tracking <span style={{ color: c.teal }}>{(items || []).length} items</span> in your inventory · <span style={{ color: c.teal }}>{recipes.length} recipes</span> generated
            </div>
          </div>
        </motion.div>

        {/* ── Recipe Cards ── */}
        <div ref={recipesRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recipes.length === 0 && (
            <div className="col-span-full text-center py-12" style={{ color: onCardSecondary }}>
              <ChefHat className="w-10 h-10 mx-auto mb-3" style={{ color: c.teal, opacity: 0.7 }} />
              <p className="text-sm">
                {error ? error : 'No recommendations yet. Add ingredients to your inventory and click "Get AI Recommendations".'}
              </p>
              {error && (
                <button onClick={retryRecommendations} disabled={isAnalyzing} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-70" style={{ background: c.teal, color: '#fff' }}>
                  Retry
                </button>
              )}
            </div>
          )}
          {recipes.map((recipe, i) => (
            <motion.div
              key={recipe._id ?? i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06 * i }}
              whileHover={{ y: -6, boxShadow: c.cardHoverShadow }}
              className="rounded-2xl cursor-pointer overflow-hidden group"
              style={{ background: c.cardBg, border: `1px solid ${c.borderLight}`, boxShadow: c.cardShadow }}
            >
              {/* Image / placeholder */}
              <div className="relative overflow-hidden" style={{ height: '180px' }}>
                {recipe.image ? (
                  <img
                    src={recipe.image} alt={recipe.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    style={{ borderRadius: '12px 12px 0 0' }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${c.teal}33, ${c.teal}11)`, borderRadius: '12px 12px 0 0' }}
                  >
                    <ChefHat className="w-12 h-12" style={{ color: c.teal, opacity: 0.7 }} />
                  </div>
                )}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.5) 100%)', borderRadius: '12px 12px 0 0' }} />
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  {recipe.usesExpiring ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ background: '#22c55e' }}>
                      <Leaf className="w-3 h-3" /> Uses Expiring
                    </span>
                  ) : recipe.match != null ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ background: c.teal }}>
                      {recipe.match}% match
                    </span>
                  ) : <span />}
                  {recipe.calories ? (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(4px)' }}>
                      <Flame className="w-3 h-3" style={{ color: '#f59e0b' }} />
                      <span className="text-xs text-white font-medium">{recipe.calories} kcal</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-semibold mb-1.5" style={{ fontSize: '18px', color: onCardPrimary, fontFamily: 'Inter, sans-serif' }}>
                  {recipe.title}
                </h3>
                {recipe.description ? (
                  <p className="text-xs mb-4 leading-relaxed line-clamp-2" style={{ color: onCardSecondary }}>
                    {recipe.description}
                  </p>
                ) : null}
                {recipe.tags?.length ? (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {recipe.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-xs capitalize" style={{ background: c.tagBg, color: c.tagColor }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4" style={{ color: onCardSecondary }}>
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {recipe.calories || 0} kcal</span>
                  <span className="flex items-center gap-1">{Math.round(recipe.protein || 0)}g protein</span>
                  <span className="flex items-center gap-1">{Math.round(recipe.carbs || 0)}g carbs</span>
                  <span className="flex items-center gap-1">{Math.round(recipe.fats || 0)}g fat</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-4" style={{ color: onCardMuted }}>
                  <span>Difficulty: {recipe.difficulty || 'Not set'}</span>
                  <span>Cuisine: {recipe.cuisine || 'Mixed'}</span>
                  <span>Match: {recipe.matchScore ?? recipe.match ?? 0}%</span>
                </div>
                {recipe.uses ? (
                  <p className="text-xs mb-4 line-clamp-1" style={{ color: onCardMuted }}>
                    <Clock className="w-3 h-3 inline mr-1" />Uses: {recipe.uses}
                  </p>
                ) : null}
                <Link to={`/ai-meals/recipe/${recipe._id}`} state={{ recipe }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: `linear-gradient(135deg,${c.teal},${c.tealHover})` }}
                  >
                    View Recipe
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
        </>
        )}

        {tab === 'plan' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Plan controls */}
            <div
              className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '20px', boxShadow: c.cardShadow }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${c.teal}22` }}>
                  <CalendarDays className="w-5 h-5" style={{ color: c.teal }} />
                </div>
                <div>
                  <div className="font-bold" style={{ color: onCardPrimary }}>7-Day Meal Plan</div>
                  <div className="text-xs" style={{ color: onCardSecondary }}>Condition-tailored, using your inventory</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={planCondition}
                  onChange={e => setPlanCondition(e.target.value)}
                  className="rounded-xl text-sm outline-none"
                  style={{ background: c.inputBg, border: `1px solid ${c.inputBorder}`, color: c.inputText || '#fff', padding: '10px 12px' }}
                >
                  {conditions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <motion.button
                  onClick={handleGeneratePlan}
                  disabled={planLoading}
                  whileHover={{ scale: planLoading ? 1 : 1.03 }} whileTap={{ scale: planLoading ? 1 : 0.97 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-70"
                  style={{ background: c.teal, boxShadow: `0 0 20px ${c.teal}55` }}
                >
                  <RefreshCw className={`w-4 h-4 ${planLoading ? 'animate-spin' : ''}`} />
                  {planLoading ? 'Generating your personalized meal plan...' : 'Generate New Plan'}
                </motion.button>
              </div>
            </div>

            {planError && (
              <div className="text-center py-4 mb-4 text-sm" style={{ color: '#ef4444' }}>
                {planError}
                <button onClick={handleGeneratePlan} disabled={planLoading} className="ml-3 underline disabled:opacity-70" style={{ color: c.teal }}>
                  Retry
                </button>
              </div>
            )}

            {!plan && !planLoading && (
              <div className="text-center py-12" style={{ color: onCardSecondary }}>
                <CalendarDays className="w-10 h-10 mx-auto mb-3" style={{ color: c.teal, opacity: 0.7 }} />
                <p className="text-sm">No meal plan yet. Pick a condition and click "Generate New Plan".</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const day = (plan?.weekPlan || [])[dayIndex] || {};
                return (
<motion.div
                     key={day.day || dayIndex}
                     initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * dayIndex }}
                     className="rounded-2xl p-5 transition-all duration-200"
                     style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
                     whileHover={{ 
                       boxShadow: c.cardHoverShadow,
                       transform: 'translateY(-2px)',
                     }}
                   >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold" style={{ color: onCardPrimary }}>{day.day || `Day ${dayIndex + 1}`}</h3>
                      {plan.condition && plan.condition !== 'none' && (
                        <span className="px-2 py-0.5 rounded-full text-xs capitalize" style={{ background: c.tagBg, color: c.teal }}>
                          {plan.condition.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    {renderPlanMeal('breakfast', day.breakfast)}
                    {renderPlanMeal('lunch', day.lunch)}
                    {renderPlanMeal('dinner', day.dinner)}
                    {renderPlanMeal('snack', day.snack)}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
