import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  ChefHat,
  CheckCircle2,
  ShoppingCart,
  TrendingUp,
  Trash2,
  Settings as SettingsIcon,
  CheckCheck,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications as useNotifCtx } from '../contexts/NotificationContext';
import settingsService from '../services/settings.service';

const initialNotifs = [];

const typeConfig = {
  expiry:   { Icon: AlertTriangle, color: '#ef4444', label: 'Expiry' },
  recipe:   { Icon: ChefHat,       color: '#a855f7', label: 'Recipe' },
  success:  { Icon: CheckCircle2,  color: '#22c55e', label: 'Success' },
  shopping: { Icon: ShoppingCart,  color: '#3b82f6', label: 'Shopping' },
  trend:    { Icon: TrendingUp,    color: '#f59e0b', label: 'Insight' },
  info:     { Icon: Bell,          color: '#3b82f6', label: 'Info' },
};

const FILTERS = [
  { id: 'all',     label: 'All' },
  { id: 'unread',  label: 'Unread' },
  { id: 'expiry',  label: 'Expiry' },
  { id: 'recipe',  label: 'Recipes' },
  { id: 'success', label: 'Insights' },
];

export function Notifications() {
  const { c, isDark } = useTheme();
  const { notifications: remote, refresh } = useNotifCtx();
  const [notifs, setNotifs] = useState(initialNotifs);
  const [filter, setFilter] = useState('all');

  // Hydrate from backend when available
  useEffect(() => {
    if (Array.isArray(remote)) {
      setNotifs(remote);
    }
  }, [remote]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    if (filter === 'all')    return notifs;
    if (filter === 'unread') return notifs.filter((n) => !n.read);
    return notifs.filter((n) => n.type === filter);
  }, [filter, notifs]);

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    Promise.all(notifs.filter(n => !n.read).map(n => settingsService.dismissNotification(n.id).catch(() => {})));
  };
  const markRead = (id) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    settingsService.dismissNotification(id).catch(() => {});
  };
  const removeOne = (id) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    settingsService.dismissNotification(id).catch(() => {});
  };
  const clearAll = () => {
    setNotifs([]);
    settingsService.clearNotifications().catch(() => {});
    refresh?.();
  };

  const cardBase = {
    background: c.cardBg,
    border: `1px solid ${c.border}`,
    boxShadow: c.cardShadow,
  };
  const onCardPrimary = isDark ? c.textPrimary : c.textOnCardPrimary;
  const onCardSecondary = isDark ? c.textSecondary : c.textOnCardSecondary;

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: c.pageBg }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: c.tagBg }}
              >
                <Bell className="w-5 h-5" style={{ color: c.teal }} />
              </div>
              <h1
                className="text-3xl sm:text-4xl font-bold"
                style={{ color: c.textPrimary }}
              >
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                  style={{ background: c.teal }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: c.textSecondary }}>
              Stay on top of expiry alerts, recipes, and your weekly insights.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: c.tagBg,
                color: c.teal,
                border: `1px solid ${c.border}`,
              }}
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
            <Link
              to="/settings"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: c.cardBg,
                color: c.textSecondary,
                border: `1px solid ${c.border}`,
              }}
            >
              <SettingsIcon className="w-4 h-4" />
              Preferences
            </Link>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1"
        >
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
                style={{
                  background: active ? c.teal : c.cardBg,
                  color: active ? '#FFFFFF' : c.textSecondary,
                  border: active ? 'none' : `1px solid ${c.border}`,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </motion.div>

        {/* List */}
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl p-10 sm:p-14 text-center"
                style={cardBase}
              >
                <div
                  className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
                  style={{ background: c.tagBg }}
                >
                  <Bell className="w-7 h-7" style={{ color: c.teal }} />
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: onCardPrimary }}
                >
                  You're all caught up
                </h3>
                <p
                  className="text-sm"
                  style={{ color: onCardSecondary }}
                >
                  No notifications match this filter.
                </p>
              </motion.div>
            ) : (
              filtered.map((n) => {
                const cfg = typeConfig[n.type] || typeConfig.info;
                const Icon = cfg.Icon;
                return (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4 group"
                    style={{
                      ...cardBase,
                      borderLeft: !n.read
                        ? `3px solid ${c.teal}`
                        : `1px solid ${c.border}`,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${cfg.color}1f` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3
                          className="text-sm sm:text-base font-semibold"
                          style={{ color: onCardPrimary }}
                        >
                          {n.title}
                        </h3>
                        {!n.read && (
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                            style={{ background: c.teal }}
                            aria-label="Unread"
                          />
                        )}
                      </div>
                      <p
                        className="text-xs sm:text-sm leading-relaxed mb-2"
                        style={{ color: onCardSecondary }}
                      >
                        {n.body || n.message}
                      </p>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: `${cfg.color}1f`,
                              color: cfg.color,
                            }}
                          >
                            {cfg.label}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: onCardSecondary }}
                          >
                            {n.time || ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!n.read && (
                            <button
                              onClick={() => markRead(n.id)}
                              className="text-xs font-medium hover:underline"
                              style={{ color: c.teal }}
                            >
                              Mark read
                            </button>
                          )}
                          <button
                            onClick={() => removeOne(n.id)}
                            className="text-xs font-medium hover:underline opacity-60 hover:opacity-100"
                            style={{ color: onCardSecondary }}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Clear all */}
        {notifs.length > 0 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium opacity-70 hover:opacity-100"
              style={{ color: c.textSecondary }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
}