import axios from 'axios';

// Base URL is the Vite dev proxy (`/api` -> VITE_API_URL, see vite.config.js),
// which keeps requests same-origin and avoids CORS. In a non-proxied build you
// can point straight at the API by setting VITE_API_URL.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
});

const TOKEN_KEY = 'token';
const AUTH_ENDPOINT = /\/auth\/(login|signup|refresh|forgot-password|reset-password)\b/;

// ── Request: attach the JWT to every call automatically ──
API.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: on 401, the token is missing/expired/invalid. Clear the broken
// session and notify the app so it can drop to a logged-out state (and
// ProtectedRoute will bounce to /login). This prevents the "still shows logged
// in but every API call fails with no token" state. ──
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Surface the API's friendly message instead of axios's generic
    // "Request failed with status code N" in every catch block that reads err.message.
    const backendMsg = error.response?.data?.message;
    if (backendMsg) error.message = backendMsg;

    if (status === 401 && !AUTH_ENDPOINT.test(url)) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      // Let AuthContext react (sets user=null) without a hard redirect on public pages.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default API;
