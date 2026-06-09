import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Package,
  Bell,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChefHat,
  Leaf,
  PiggyBank,
  Plus,
  ScanLine,
  Sparkles,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useDashboard } from '../contexts/DashboardContext';
import { useAuth } from '../contexts/AuthContext';
import inventoryService from '../services/inventory.service';

export function Dashboard() {
  const { c, isDark } = useTheme();
  const { data, loading, error, refresh } = useDashboard();
  const { user } = useAuth();

  const [waste, setWaste] = useState(null);
  useEffect(() => { inventoryService.wastageReport().then(setWaste).catch(() => {}); }, []);

  const firstName = (user?.name || user?.fullName || '').split(' ')[0] || 'there';

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const ICON_MAP = {
    add: Plus, scan: ScanLine, recipe: ChefHat, check: CheckCircle2, bell: Bell,
  };
  const ACTIVITY_COLOR = {
    add: c.teal, scan: '#3b82f6', recipe: '#a855f7', check: '#22c55e', bell: '#f59e0b',
  };

  const s = data?.stats || {};
  const stats = [
    { label: 'Total Items',   value: String(s.totalItems   ?? 0), delta: s.deltas?.totalItems   ?? '',              Icon: Package,        iconColor: c.teal    },
    { label: 'Expiring Soon', value: String(s.expiringSoon ?? 0), delta: s.deltas?.expiringSoon ?? 'Next 7 days',   Icon: Bell,           iconColor: '#f59e0b' },
    { label: 'Fresh Items',   value: String(s.freshItems   ?? 0), delta: s.deltas?.freshItems   ?? '',              Icon: TrendingUp,     iconColor: '#22c55e' },
    { label: 'Expired',       value: String(s.expired      ?? 0), delta: s.deltas?.expired      ?? 'Action needed', Icon: AlertTriangle,  iconColor: '#ef4444' },
  ];

  const inventoryBreakdown = data?.inventoryBreakdown || [];
  const weeklyTrend        = data?.weeklyTrend        || [];
  const upcoming           = data?.upcomingItems      || [];
  const recipes            = data?.recipes            || [];
  const activity = (data?.recentActivity || []).map((a) => ({
    label: a.label,
    time:  a.time,
    Icon:  ICON_MAP[a.iconKey] || Activity,
    color: ACTIVITY_COLOR[a.iconKey] || c.teal,
  }));

  const statusBg = {
    critical: 'rgba(239,68,68,0.12)',
    warning:  'rgba(245,158,11,0.12)',
    good:     'rgba(34,197,94,0.12)',
  };
  const statusColor = {
    critical: '#ef4444',
    warning:  '#f59e0b',
    good:     '#22c55e',
  };

  const cardBase = {
    background: c.cardBg,
    border: `1px solid ${c.border}`,
    boxShadow: c.cardShadow,
  };
  const onCardPrimary = isDark ? c.textPrimary : c.textOnCardPrimary;
  const onCardSecondary = isDark ? c.textSecondary : c.textOnCardSecondary;

  return (
    <div className="relative min-h-screen pt-24 pb-16" style={{ background: c.pageBg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Header ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
        >
          <div>
            <p className="text-sm mb-1" style={{ color: c.textSecondary }}>
              {today}
            </p>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold"
              style={{ color: c.textPrimary }}
            >
              {greeting}, <span style={{ color: c.teal }}>{firstName}</span>
            </h1>
            <p className="text-sm sm:text-base mt-2" style={{ color: c.textSecondary }}>
              Here's how your kitchen is doing today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/inventory">
              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-transform hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${c.teal}, ${c.tealHover})`,
                  boxShadow: `0 4px 14px ${c.teal}55`,
                }}
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </Link>
            <Link to="/ai-meals">
              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  background: c.tagBg,
                  color: c.teal,
                  border: `1px solid ${c.border}`,
                }}
              >
                <Sparkles className="w-4 h-4" /> AI Meals
              </button>
            </Link>
          </div>
        </motion.div>

        {/* ─── Stats ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((item, i) => (
            <motion.div
              key={item.label}
              className="rounded-2xl p-5 sm:p-6"
              style={cardBase}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs sm:text-sm font-medium" style={{ color: onCardSecondary }}>
                  {item.label}
                </h3>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `${item.iconColor}1f` }}
                >
                  <item.Icon className="w-4 h-4" style={{ color: item.iconColor }} />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-bold mb-1" style={{ color: onCardPrimary }}>
                {item.value}
              </p>
              <p className="text-xs" style={{ color: onCardSecondary }}>
                {item.delta}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ─── Charts row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Weekly trend */}
          <motion.div
            className="lg:col-span-2 rounded-2xl p-5 sm:p-6"
            style={cardBase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-semibold" style={{ color: onCardPrimary }}>
                  Weekly Activity
                </h3>
                <p className="text-xs sm:text-sm" style={{ color: onCardSecondary }}>
                  Items saved vs. wasted this week
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.teal }} />
                  <span style={{ color: onCardSecondary }}>Saved</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
                  <span style={{ color: onCardSecondary }}>Wasted</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={weeklyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="savedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c.teal} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={c.teal} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="wastedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={c.divider} vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke={onCardSecondary}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke={onCardSecondary}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: isDark ? '#0D1B2A' : '#0D2137',
                    border: `1px solid ${c.border}`,
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="saved"
                  stroke={c.teal}
                  strokeWidth={2}
                  fill="url(#savedGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="wasted"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#wastedGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Inventory pie */}
          <motion.div
            className="rounded-2xl p-5 sm:p-6"
            style={cardBase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-base sm:text-lg font-semibold mb-1" style={{ color: onCardPrimary }}>
              Inventory Health
            </h3>
            <p className="text-xs sm:text-sm mb-4" style={{ color: onCardSecondary }}>
              Current stock breakdown
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={inventoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {inventoryBreakdown.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: isDark ? '#0D1B2A' : '#0D2137',
                    border: `1px solid ${c.border}`,
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {inventoryBreakdown.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-sm" style={{ color: onCardSecondary }}>{d.name}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: onCardPrimary }}>
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ─── Impact / Sustainability ────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[
            { Icon: PiggyBank, label: 'Money Saved',       value: 'Rs. 4,250', sub: 'this month' },
            { Icon: Leaf,      label: 'Food Waste Reduced', value: '6.2 kg',    sub: 'this month' },
            { Icon: Activity,  label: 'Sustainability Score', value: '87 / 100', sub: '+12 vs last month' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              className="rounded-2xl p-5 sm:p-6 flex items-center gap-4"
              style={cardBase}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: c.tagBg }}
              >
                <item.Icon className="w-6 h-6" style={{ color: c.teal }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm" style={{ color: onCardSecondary }}>{item.label}</p>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: onCardPrimary }}>
                  {item.value}
                </p>
                <p className="text-xs" style={{ color: onCardSecondary }}>{item.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ─── Weekly Waste Report (FEATURE 7) ────────────────────────── */}
        {waste && (
          <motion.div
            className="rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8"
            style={cardBase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: c.tagBg }}>
                <Leaf className="w-5 h-5" style={{ color: c.teal }} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold" style={{ color: onCardPrimary }}>
                  Weekly Waste Report
                </h3>
                <p className="text-xs sm:text-sm" style={{ color: onCardSecondary }}>
                  AI analysis of your recent food waste
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl p-4" style={{ background: c.inlineCardBg, border: `1px solid ${c.inlineCardBorder}` }}>
                <p className="text-xs" style={{ color: onCardSecondary }}>Food wasted</p>
                <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>
                  {waste.total_waste_kg || 0} <span className="text-sm">kg</span>
                </p>
              </div>
              <div className="rounded-xl p-4" style={{ background: c.inlineCardBg, border: `1px solid ${c.inlineCardBorder}` }}>
                <p className="text-xs" style={{ color: onCardSecondary }}>Estimated loss</p>
                <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
                  Rs. {Math.round(waste.estimated_loss_pkr || 0)}
                </p>
              </div>
              <div className="rounded-xl p-4" style={{ background: c.inlineCardBg, border: `1px solid ${c.inlineCardBorder}` }}>
                <p className="text-xs mb-1" style={{ color: onCardSecondary }}>By category</p>
                {Object.keys(waste.waste_by_category || {}).length ? (
                  <div className="space-y-1">
                    {Object.entries(waste.waste_by_category).slice(0, 3).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-xs">
                        <span className="capitalize" style={{ color: onCardPrimary }}>{k}</span>
                        <span style={{ color: onCardSecondary }}>{v}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: c.teal }}>No waste recorded 🎉</p>
                )}
              </div>
            </div>

            {waste.recommendations?.length ? (
              <div className="mt-5">
                <p className="text-sm font-semibold mb-2" style={{ color: onCardPrimary }}>AI Recommendations</p>
                <ul className="space-y-1.5">
                  {waste.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: onCardSecondary }}>
                      <span style={{ color: c.teal }}>•</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </motion.div>
        )}

        {/* ─── Upcoming + Activity ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Upcoming expirations */}
          <motion.div
            className="rounded-2xl p-5 sm:p-6"
            style={cardBase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold" style={{ color: onCardPrimary }}>
                  Upcoming Expirations
                </h3>
                <p className="text-xs sm:text-sm" style={{ color: onCardSecondary }}>
                  Next items to use up
                </p>
              </div>
              <Link
                to="/expiry-alerts"
                className="text-xs font-semibold flex items-center gap-1 hover:underline"
                style={{ color: c.teal }}
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {upcoming.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{
                    background: c.inlineCardBg,
                    border: `1px solid ${c.inlineCardBorder}`,
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: statusBg[item.status] }}
                    >
                      {item.status === 'critical' ? (
                        <AlertTriangle className="w-4 h-4" style={{ color: statusColor[item.status] }} />
                      ) : (
                        <Clock className="w-4 h-4" style={{ color: statusColor[item.status] }} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: onCardPrimary }}>
                        {item.name}
                      </div>
                      <div className="text-xs" style={{ color: onCardSecondary }}>
                        {item.category}
                      </div>
                    </div>
                  </div>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ml-2"
                    style={{
                      background: statusBg[item.status],
                      color: statusColor[item.status],
                    }}
                  >
                    {item.days} {item.days === 1 ? 'day' : 'days'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent activity */}
          <motion.div
            className="rounded-2xl p-5 sm:p-6"
            style={cardBase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold" style={{ color: onCardPrimary }}>
                  Recent Activity
                </h3>
                <p className="text-xs sm:text-sm" style={{ color: onCardSecondary }}>
                  Latest changes in your kitchen
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {activity.map((a, i) => {
                const Icon = a.Icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${a.color}1f` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: a.color }} />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-sm" style={{ color: onCardPrimary }}>
                        {a.label}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: onCardSecondary }}>
                        {a.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ─── Recipe Suggestions ─────────────────────────────────────── */}
        <motion.div
          className="rounded-2xl p-5 sm:p-6"
          style={cardBase}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: c.tagBg }}
              >
                <ChefHat className="w-5 h-5" style={{ color: c.teal }} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold" style={{ color: onCardPrimary }}>
                  AI Recipe Suggestions
                </h3>
                <p className="text-xs sm:text-sm" style={{ color: onCardSecondary }}>
                  Built from items expiring soon
                </p>
              </div>
            </div>
            <Link
              to="/ai-meals"
              className="text-xs font-semibold flex items-center gap-1 hover:underline"
              style={{ color: c.teal }}
            >
              See all recipes <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map((r, i) => (
              <Link
                key={i}
                to="/ai-meals"
                className="block p-4 rounded-xl transition-transform hover:-translate-y-1"
                style={{
                  background: c.inlineCardBg,
                  border: `1px solid ${c.inlineCardBorder}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: c.tagBg }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: c.teal }} />
                </div>
                <h4 className="text-sm font-semibold mb-1" style={{ color: onCardPrimary }}>
                  {r.title}
                </h4>
                <p className="text-xs mb-2" style={{ color: onCardSecondary }}>
                  Uses: {r.uses}
                </p>
                <div className="flex items-center gap-1 text-xs" style={{ color: c.teal }}>
                  <Clock className="w-3 h-3" /> {r.time}
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
