import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const BASE = import.meta.env.VITE_API_URL ?? import.meta.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export const api = axios.create({
  baseURL: BASE,
  withCredentials: true, // send httpOnly refresh token cookie
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach access token ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor — transparent token refresh ─────────────────────────
let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post<{ data: { accessToken: string } }>('/auth/refresh')
            .then(r => r.data.data.accessToken)
            .finally(() => { refreshPromise = null; });
        }
        const token = await refreshPromise;
        useAuthStore.getState().setToken(token);
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
