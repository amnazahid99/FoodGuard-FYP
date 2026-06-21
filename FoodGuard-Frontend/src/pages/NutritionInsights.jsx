import { useState, useEffect } from 'react';
import { Activity, TrendingUp, Droplets, Zap, Plus, Lightbulb, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar,
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import nutritionService from '../services/nutrition.service';

const round = (n) => Math.round(n || 0);
const weekday = (d) => {
  try { return new Date(d).toLocaleDateString('en-US', { weekday: 'short' }); }
  catch { return d; }
};
const scoreLabel = (pct) =>
  pct >= 85 ? 'Excellent' : pct >= 70 ? 'Good' : pct >= 50 ? 'Fair' : 'Poor';

export function NutritionInsights() {
  const { c, isDark } = useTheme();
  const onCardPrimary   = isDark ? c.textPrimary   : c.textOnCardPrimary;
  const onCardSecondary = isDark ? c.textSecondary : c.textOnCardSecondary;

  const [log, setLog]       = useState(null);
  const [report, setReport] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [foodText, setFoodText] = useState('');
  const [logging, setLogging] = useState(false);
  const [err, setErr] = useState(null);

  const load = async () => {
    try {
      const [t, r] = await Promise.all([
        nutritionService.today().catch(() => null),
        nutritionService.report().catch(() => null),
      ]);
      setLog(t);
      setReport(r);
    } catch (_) { /* keep zeros */ }
  };
  useEffect(() => { load(); }, []);

  const handleLogFood = async (e) => {
    e.preventDefault();
    const items = foodText.split(',').map(s => s.trim()).filter(Boolean);
    if (!items.length) return;
    setLogging(true);
    setErr(null);
    try {
      const updated = await nutritionService.analyze(items);
      setLog(updated);
      setFoodText('');
      setShowLog(false);
      nutritionService.report().then(setReport).catch(() => {});
    } catch (e2) {
      setErr(e2.message || 'Could not analyze food.');
    } finally {
      setLogging(false);
    }
  };

  const cardStyle = { 
    background: c.cardBg, 
    border: `1px solid ${c.border}`, 
    boxShadow: c.elevatedShadow 
  };

  const totals = log?.totals || {};
  const targets = log?.dailyTargets || { calories: 2000, protein_g: 50, carbs_g: 275, fat_g: 70 };
  const cals = round(totals.calories);
  const score10 = log?.healthScore ?? 0;
  const scorePct = Math.min(100, score10 * 10);
  const weeklyAvg = report?.weekly
    ? round((report.weekly.calories || 0) / Math.max(1, report.daily?.length || 1))
    : 0;

  const stats = [
    { label: "Today's Calories", value: cals.toLocaleString(),      unit: 'kcal', icon: Zap,        color: c.teal },
    { label: 'Water Intake',      value: '2.4',                      unit: 'L',    icon: Droplets,   color: c.statusInfo },
    { label: 'Weekly Avg',        value: weeklyAvg.toLocaleString(), unit: 'kcal', icon: TrendingUp, color: c.statusWarning },
    { label: 'Health Score',      value: String(scorePct),           unit: '/100', icon: Activity,   color: c.statusFresh },
  ];

  const goalCals = targets.calories || 2000;
  let calorieData = (report?.daily || []).slice().reverse()
    .map(d => ({ day: weekday(d.date), calories: round(d.calories), goal: goalCals }));
  if (!calorieData.length) calorieData = [{ day: 'Today', calories: cals, goal: goalCals }];

  const macros = [
    { name: 'Protein', value: round(totals.protein_g), goal: round(targets.protein_g || 50),  color: c.statusFresh },
    { name: 'Carbs',   value: round(totals.carbs_g),   goal: round(targets.carbs_g || 275),   color: c.statusInfo },
    { name: 'Fat',     value: round(totals.fat_g),     goal: round(targets.fat_g || 70),      color: c.statusWarning },
    { name: 'Fiber',   value: round(totals.fiber_g),   goal: 25,                              color: '#8B5CF6' },
  ].map(m => ({ ...m, fill: m.goal > 0 ? Math.min(100, Math.round((m.value / m.goal) * 100)) : 0 }));

  const healthScoreData = [{ name: 'Score', value: scorePct, fill: c.teal }];
  const tips = log?.tips || [];

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: c.tagBg }}>
                <Activity className="w-5 h-5" style={{ color: c.teal }} />
              </div>
              <h1 className="text-3xl font-bold" style={{ color: c.textPrimary, fontFamily: 'Poppins, sans-serif' }}>Nutrition Insights</h1>
            </div>
            <p style={{ color: c.textSecondary }} className="text-sm">Track your daily nutrition, calories, and health score.</p>
          </div>
          <motion.button
            onClick={() => setShowLog(true)}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm flex-shrink-0"
            style={{ background: c.teal, boxShadow: `0 0 20px ${c.teal}55` }}
          >
            <Plus className="w-4 h-4" /> Log Food
          </motion.button>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}
                className="rounded-2xl p-5"
                style={cardStyle}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}18` }}>
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold" style={{ color: onCardPrimary }}>{s.value}</span>
                  <span className="text-xs" style={{ color: onCardSecondary }}>{s.unit}</span>
                </div>
                <div className="text-xs mt-1" style={{ color: onCardSecondary }}>{s.label}</div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calorie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-2 rounded-2xl p-6"
            style={cardStyle}
          >
            <h3 className="font-semibold mb-6" style={{ color: onCardPrimary }}>Weekly Calorie Intake</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={calorieData}>
<defs>
                    <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c.teal} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={c.teal} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c.statusInfo} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={c.statusInfo} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'} />
                 <XAxis dataKey="day" tick={{ fill: onCardSecondary, fontSize: 12 }} axisLine={false} tickLine={false} />
                 <YAxis tick={{ fill: onCardSecondary, fontSize: 11 }} axisLine={false} tickLine={false} />
                 <Tooltip
                   contentStyle={{ 
                     background: isDark ? '#0D1B2A' : c.cardBg, 
                     border: `1px solid ${c.border}`, 
                     borderRadius: 8, 
                     color: isDark ? '#fff' : c.textPrimary, 
                     fontSize: 12 
                   }}
                 />
<Area type="monotone" dataKey="goal"     stroke={c.statusInfo} strokeWidth={1.5} fill="url(#goalGrad)" strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="calories" stroke={c.teal} strokeWidth={2}   fill="url(#calGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Health Score */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
            className="rounded-2xl p-6"
            style={cardStyle}
          >
            <h3 className="font-semibold mb-4" style={{ color: onCardPrimary }}>Health Score</h3>
            <ResponsiveContainer width="100%" height={160}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" barSize={12} data={healthScoreData} startAngle={180} endAngle={-180}>
                <RadialBar background={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} dataKey="value" fill={c.teal} cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="text-center -mt-6">
              <div className="text-4xl font-bold" style={{ color: onCardPrimary }}>{scorePct}</div>
              <div className="text-xs mt-1" style={{ color: c.teal }}>{scoreLabel(scorePct)}</div>
            </div>

            {/* Macros */}
            <div className="space-y-3 mt-6">
              {macros.map(m => (
                <div key={m.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: onCardSecondary }}>{m.name}</span>
                    <span style={{ color: onCardPrimary }}>{m.value}g / {m.goal}g</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${m.fill}%` }} transition={{ duration: 0.8, delay: 0.4 }}
                      className="h-full rounded-full"
                      style={{ background: m.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Nutritional Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl p-6 mt-6"
          style={cardStyle}
        >
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5" style={{ color: c.teal }} />
            <h3 className="font-semibold" style={{ color: onCardPrimary }}>Nutritional Tips</h3>
          </div>
          {tips.length ? (
            <ul className="space-y-2">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: onCardSecondary }}>
                  <span style={{ color: c.teal }}>•</span> {tip}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: onCardSecondary }}>
              Log your meals to get personalized AI nutrition tips.
            </p>
          )}
        </motion.div>
      </div>

      {/* Log Food Modal */}
      <AnimatePresence>
        {showLog && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setShowLog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
            >
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${c.border}` }}>
                <h3 className="font-bold" style={{ color: onCardPrimary }}>Log Food</h3>
                <button onClick={() => setShowLog(false)} style={{ color: onCardSecondary, cursor: 'pointer' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleLogFood} className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-xs" style={{ color: onCardSecondary }}>What did you eat? (comma-separated)</label>
                  <textarea
                    rows={3}
                    value={foodText}
                    onChange={e => setFoodText(e.target.value)}
                    placeholder="e.g. 2 eggs, 1 cup rice, grilled chicken breast"
                    className="w-full mt-1 resize-none rounded-xl text-sm outline-none"
                    style={{ background: c.inputBg, border: `1px solid ${c.inputBorder}`, color: c.inputText || '#fff', padding: '12px 14px' }}
                  />
                </div>
                {err && <p className="text-xs" style={{ color: '#ef4444' }}>{err}</p>}
                <button
                  type="submit"
                  disabled={logging}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-70"
                  style={{ background: c.teal }}
                >
                  {logging ? 'Analyzing…' : 'Analyze & Log'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
