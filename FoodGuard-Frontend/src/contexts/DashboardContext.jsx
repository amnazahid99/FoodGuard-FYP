import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import dashboardService from '../services/dashboard.service';
import { useAuth } from './AuthContext';
import { useInventory } from './InventoryContext';

const DashboardContext = createContext(null);

const EMPTY = {
  stats: {
    totalItems: 0, expiringSoon: 0, freshItems: 0, expired: 0,
    deltas: {
      totalItems: 'Add items to get started',
      expiringSoon: 'Next 7 days',
      freshItems: 'Items still fresh',
      expired: 'Action needed',
    },
  },
  inventoryBreakdown: [],
  weeklyTrend: [
    { day: 'Mon', saved: 0, wasted: 0 }, { day: 'Tue', saved: 0, wasted: 0 },
    { day: 'Wed', saved: 0, wasted: 0 }, { day: 'Thu', saved: 0, wasted: 0 },
    { day: 'Fri', saved: 0, wasted: 0 }, { day: 'Sat', saved: 0, wasted: 0 },
    { day: 'Sun', saved: 0, wasted: 0 },
  ],
  upcomingItems: [],
  recentActivity: [],
  recipes: [],
};

function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return Infinity;
  return Math.ceil((d - new Date()) / 86_400_000);
}

function buildFromInventory(items = []) {
  let fresh = 0, expiring = 0, expired = 0;
  const upcoming = [];
  for (const it of items) {
    const days = daysUntil(it.expiry || it.expiryDate);
    if (days < 0) expired++;
    else if (days <= 7) { expiring++; upcoming.push({
      name: it.name, category: it.category || '—', days,
      status: days <= 2 ? 'critical' : 'warning',
    }); }
    else fresh++;
  }
  upcoming.sort((a, b) => a.days - b.days);
  const total = items.length;
  const breakdown = [];
  if (fresh)    breakdown.push({ name: 'Fresh',    value: fresh,    color: '#22c55e' });
  if (expiring) breakdown.push({ name: 'Expiring', value: expiring, color: '#f59e0b' });
  if (expired)  breakdown.push({ name: 'Expired',  value: expired,  color: '#ef4444' });
  return {
    stats: {
      totalItems: total, expiringSoon: expiring, freshItems: fresh, expired,
      deltas: {
        totalItems: total ? `${total} item${total === 1 ? '' : 's'} tracked` : 'Add items to get started',
        expiringSoon: 'Next 7 days',
        freshItems: total ? `${Math.round((fresh / total) * 100)}% of stock` : '—',
        expired: expired ? 'Action needed' : 'All good',
      },
    },
    inventoryBreakdown: breakdown,
    upcomingItems: upcoming.slice(0, 8),
  };
}

export function DashboardProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { items } = useInventory();
  const [remote, setRemote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true); setError(null);
    try {
      const r = await dashboardService.overview();
      setRemote(r || null);
    } catch (err) {
      setError(err.message);
      setRemote(null);
    } finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { if (isAuthenticated) fetch(); else setRemote(null); }, [isAuthenticated, fetch]);

  const data = useMemo(() => {
    const derived = buildFromInventory(items || []);
    return { ...EMPTY, ...derived, ...(remote || {}) };
  }, [items, remote]);

  return (
    <DashboardContext.Provider value={{ data, loading, error, refresh: fetch }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used inside <DashboardProvider>');
  return ctx;
}
