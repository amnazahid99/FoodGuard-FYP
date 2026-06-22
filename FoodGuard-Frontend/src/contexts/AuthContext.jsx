import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

// Pull the human-readable message the API returned, not axios's generic
// "Request failed with status code 500".
const apiError = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

export function AuthProvider({ children }) {
  // Token-driven: only treat a stored user as logged in when a token also
  // exists. Otherwise the app would show "logged in" with no token and every
  // protected call would 401.
  const [user, setUser] = useState(() =>
    authService.getStoredToken() ? authService.getStoredUser() : null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session on mount
  useEffect(() => {
    let active = true;
    (async () => {
      const token = authService.getStoredToken();
      if (!token) {
        // No token => definitely logged out. Clear any stale stored user.
        await authService.logout().catch(() => {});
        if (active) { setUser(null); setLoading(false); }
        return;
      }
      try {
        const fresh = await authService.profile();
        if (active && fresh) setUser(fresh);
      } catch (_) {
        // Token invalid/expired — clear silently
        await authService.logout().catch(() => {});
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // A 401 anywhere (expired/invalid token) drops us to a logged-out state.
  // The axios interceptor already cleared storage; just sync React state.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (credentials) => {
    setError(null);
    try {
      const { user } = await authService.login(credentials);
      setUser(user || { email: credentials.email });
      return { ok: true };
    } catch (err) {
      const message = apiError(err, 'Login failed. Please try again.');
      setError(message);
      return { ok: false, error: message };
    }
  }, []);

  const signup = useCallback(async (payload) => {
    setError(null);
    try {
      const { user } = await authService.signup(payload);
      setUser(user || { email: payload.email, name: payload.name });
      return { ok: true };
    } catch (err) {
      const message = apiError(err, 'Sign up failed. Please try again.');
      setError(message);
      return { ok: false, error: message };
    }
  }, []);

  const googleLogin = useCallback(async () => {
    setError(null);
    try {
      const result = await authService.googleLogin();
      if (result.ok) {
        setUser(result.user || null);
        return { ok: true };
      }
      return { ok: false, error: result.error || 'Google login failed.' };
    } catch (err) {
      const message = apiError(err, 'Google login failed. Please try again.');
      setError(message);
      return { ok: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    signup,
    googleLogin,
    logout,
    refreshProfile: async () => {
      try { const u = await authService.profile(); setUser(u); return u; }
      catch (e) { return null; }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}