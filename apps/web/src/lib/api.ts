import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000, // 15s — adapté réseau 3G
});

// Injecter le token JWT sur chaque requête
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Rafraîchissement automatique du token expiré
let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        window.location.href = '/connexion';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL ?? ''}/api/v1/auth/refresh`,
          { refreshToken }
        );
        const newToken = data.data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        pendingRequests.forEach((cb) => cb(newToken));
        pendingRequests = [];
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/connexion';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Helper pour extraire le message d'erreur API
export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? 'Une erreur est survenue';
  }
  return 'Une erreur inattendue est survenue';
}
