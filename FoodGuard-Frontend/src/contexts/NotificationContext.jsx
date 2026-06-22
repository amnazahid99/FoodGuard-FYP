import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import settingsService from '../services/settings.service';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const notify = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await settingsService.notifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setNotifications([]); // Empty array so component renders empty state
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAuthenticated) fetchNotifications(); }, [isAuthenticated, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{ toasts, notify, notifications, loading, error, refresh: fetchNotifications,
               setNotifications }}>
      {children}
      {/* Lightweight toast layer — non-intrusive, fixed position */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map((t) => (
          <div key={t.id}
               style={{
                 pointerEvents: 'auto',
                 padding: '10px 14px',
                 borderRadius: 10,
                 fontSize: 13,
                 fontFamily: 'Inter, sans-serif',
                 color: '#fff',
                 boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                 background:
                   t.type === 'error'   ? 'linear-gradient(135deg,#ef4444,#b91c1c)' :
                   t.type === 'success' ? 'linear-gradient(135deg,#1ABC9C,#0e9c80)' :
                                          'linear-gradient(135deg,#334155,#1e293b)',
               }}>
            {t.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>');
  return ctx;
}
