import api, { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from './api';

const persist = (token, user, remember = true, refreshToken = null) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const authService = {
  async login({ email, password, remember = true }) {
    const { data } = await api.post('/auth/login', { email, password });
    const token = data?.token || data?.accessToken;
    const refreshToken = data?.refreshToken || null;
    const user = data?.user || data?.profile || null;
    persist(token, user, remember, refreshToken);
    return { token, user };
  },

  async signup({ name, email, password }) {
    const { data } = await api.post('/auth/signup', { name, email, password });
    const token = data?.token || data?.accessToken;
    const user = data?.user || data?.profile || null;
    if (token) persist(token, user, true, data?.refreshToken);
    return { token, user };
  },

  async googleLogin() {
    const width = 500;
    const height = 600;
    const left = (screenX || screen.availWidth) / 2 - width / 2;
    const top = (screenY || screen.availHeight) / 2 - height / 2;
    
    const popup = window.open(
      '/api/auth/google',
      'google-login',
      `width=${width},height=${height},top=${top},left=${left}`
    );
    
    return new Promise((resolve) => {
      const handleMessage = (event) => {
        if (event.data?.type === 'google-auth-success') {
          window.removeEventListener('message', handleMessage);
          const { token, refreshToken, user } = event.data;
          persist(token, user, true, refreshToken);
          resolve({ ok: true, user });
        } else if (event.data?.type === 'google-auth-error') {
          window.removeEventListener('message', handleMessage);
          resolve({ ok: false, error: event.data.error });
        }
      };
      window.addEventListener('message', handleMessage);
      
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          resolve({ ok: false, error: 'Login cancelled' });
        }
      }, 500);
    });
  },

  async logout() {
    try { await api.post('/auth/logout'); } catch (_) {}
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async profile() {
    const { data } = await api.get('/auth/profile');
    const user = data?.user || data;
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  async forgotPassword(email) {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  async resetPassword({ token, password }) {
    const { data } = await api.post('/auth/reset-password', { token, password });
    return data;
  },

  getStoredToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getStoredUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
};

export default authService;