import { Bell, Clock, AlertTriangle, CheckCircle, Package, ChefHat, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useInventory } from '../contexts/InventoryContext';
import { useMemo, useState, useEffect } from 'react';
import alertsService from '../services/alerts.service';

function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return Infinity;
  return Math.ceil((d - new Date()) / 86_400_000);
}

export function ExpiryAlerts() {
  const { c, isDark } = useTheme();
  const { items } = useInventory();
  const onCardPrimary   = isDark ? c.textPrimary   : c.textOnCardPrimary;
  const onCardSecondary = isDark ? c.textSecondary : c.textOnCardSecondary;

  const statusConfig = {
    critical: { color: c.statusError || '#B85C5C', bg: c.statusErrorBg || 'rgba(184,92,92,0.10)', label: 'Critical', icon: AlertTriangle },
    warning:  { color: c.statusWarning || '#D4A94D', bg: c.statusWarningBg || 'rgba(212,169,77,0.12)', label: 'Warning',  icon: Clock },
    info:     { color: c.statusInfo || '#5A7FAF', bg: c.statusInfoBg || 'rgba(90,127,175,0.10)', label: 'Soon',     icon: Clock },
    good:     { color: c.statusFresh || '#2E8A74', bg: c.statusFreshBg || 'rgba(46,138,116,0.10)', label: 'Good',     icon: CheckCircle },
  };

  const [apiAlerts, setApiAlerts] = useState(null);
  const [dismissed, setDismissed] = useState(() => new Set());

  useEffect(() => {
    alertsService.list().then(setApiAlerts).catch(() => setApiAlerts([]));
  }, []);

  // Fallback: derive from inventory if the API has no alerts (e.g. cron hasn't run)
  const fallback = useMemo(() => (items || []).map((it, idx) => {
    const days = daysUntil(it.expiry || it.expiryDate);
    const status = days <= 1 ? 'critical' : days <= 3 ? 'warning' : days <= 7 ? 'info' : 'good';
    return {
      id: it.id ?? it._id ?? idx,
      item: it.name,
      category: it.category || '—',
      daysLeft: isFinite(days) ? days : 0,
      status,
      tip: null,
      suggestedRecipe: null,
    };
  }).filter((a) => a.daysLeft <= 7), [items]);

  const source = (apiAlerts && apiAlerts.length)
    ? apiAlerts.map((a) => ({
        id: a._id,
        item: a.itemName,
        category: a.category || '—',
        daysLeft: a.daysLeft,
        status: a.status,
        tip: a.tip,
        suggestedRecipe: a.suggestedRecipe,
      }))
    : fallback;

  const alerts = source.filter((a) => !dismissed.has(a.id));

  const dismiss = async (id) => {
    setDismissed((p) => new Set(p).add(id));
    try { await alertsService.dismiss(id); } catch (_) { /* keep optimistic */ }
  };

  const critical = alerts.filter(a => a.status === 'critical').length;
  const warning  = alerts.filter(a => a.status === 'warning' || a.status === 'info').length;
  const good     = alerts.filter(a => a.status === 'good').length;

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: c.tagBg }}>
              <Bell className="w-5 h-5" style={{ color: c.teal }} />
            </div>
            <h1 className="text-3xl font-bold" style={{ color: c.textPrimary, fontFamily: 'Poppins, sans-serif' }}>Expiry Alerts</h1>
          </div>
          <p style={{ color: c.textSecondary }} className="text-sm">Track food items nearing expiration and reduce waste.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Critical', count: critical, color: c.statusError },
            { label: 'Warning',  count: warning,  color: c.statusWarning },
            { label: 'Good',     count: good,     color: c.statusFresh },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-xl p-5 text-center transition-all duration-200"
              style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.cardShadow }}
              whileHover={{ boxShadow: c.cardHoverShadow }}
            >
              <div className="text-3xl font-bold mb-1" style={{ color: s.color }}>{s.count}</div>
              <div className="text-sm" style={{ color: onCardSecondary }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Alerts list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.elevatedShadow }}
        >
          <div className="px-6 py-4 border-b" style={{ borderColor: c.divider }}>
            <h2 className="font-semibold flex items-center gap-2" style={{ color: onCardPrimary }}>
              <Package className="w-4 h-4" style={{ color: c.teal }} /> Active Alerts
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: c.divider }}>
            {alerts.map((alert, i) => {
              const cfg = statusConfig[alert.status] || statusConfig.warning;
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                  className="px-6 py-4 rounded-xl transition-all duration-200"
                  style={{ backgroundColor: c.cardBg }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = c.cardBgHover;
                    e.currentTarget.style.boxShadow = c.cardHoverShadow;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = c.cardBg;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium" style={{ color: onCardPrimary }}>{alert.item}</div>
                        <div className="text-xs mt-0.5" style={{ color: onCardSecondary }}>{alert.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                        style={{ 
                          background: cfg.bg, 
                          color: cfg.color,
                          border: `1px solid ${cfg.color}33`,
                        }}
                      >
                        {alert.daysLeft <= 0 ? 'Expired' : `${alert.daysLeft}d left`}
                      </span>
                      <button
                        onClick={() => dismiss(alert.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                        style={{ color: onCardSecondary }}
                        aria-label="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* AI tip + actions */}
                  {(alert.tip || alert.suggestedRecipe) && (
                    <div className="mt-3 ml-13 pl-13 rounded-xl p-3" style={{ background: c.inputBg, border: `1px solid ${c.inputBorder}` }}>
                      {alert.tip && (
                        <p className="text-xs mb-2" style={{ color: onCardSecondary }}>
                          💡 {alert.tip}
                        </p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        {alert.suggestedRecipe && (
                          <span className="text-xs" style={{ color: onCardPrimary }}>
                            Try: <span style={{ color: c.teal }}>{alert.suggestedRecipe}</span>
                          </span>
                        )}
                        <Link
                          to="/ai-meals"
                          className="flex items-center gap-1 text-xs font-semibold transition-all hover:gap-2"
                          style={{ color: c.teal }}
                        >
                          <ChefHat className="w-3 h-3" /> Use in Recipe
                        </Link>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
            {alerts.length === 0 && (
              <div className="px-6 py-12 text-center" style={{ color: onCardSecondary }}>
                <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: c.teal, opacity: 0.7 }} />
                <p className="text-sm">No active expiry alerts. Your inventory is in good shape!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
