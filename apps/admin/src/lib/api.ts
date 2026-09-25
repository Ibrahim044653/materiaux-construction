import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAdminStore } from '../stores/adminStore';

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAdminStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const orig = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      const refreshToken = useAdminStore.getState().refreshToken;
      if (!refreshToken) {
        useAdminStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((token) => {
            orig.headers.Authorization = `Bearer ${token}`;
            resolve(api(orig));
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
        const newToken = data.data.accessToken;
        useAdminStore.getState().setAccessToken(newToken);
        pendingRequests.forEach((cb) => cb(newToken));
        pendingRequests = [];
        orig.headers.Authorization = `Bearer ${newToken}`;
        return api(orig);
      } catch {
        useAdminStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? 'Une erreur est survenue';
  }
  return 'Une erreur inattendue est survenue';
}
