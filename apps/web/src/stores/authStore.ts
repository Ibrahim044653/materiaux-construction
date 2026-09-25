import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@materiaux/shared';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  selectedStoreId: string | null;

  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string) => void;
  setSelectedStore: (storeId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      selectedStoreId: null,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      setAccessToken: (token) => set({ accessToken: token }),

      setSelectedStore: (storeId) => set({ selectedStoreId: storeId }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          selectedStoreId: null,
        }),
    }),
    {
      name: 'materiaux-auth',
      // Ne pas persister l'accessToken (court-vécu), seulement le refresh
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        selectedStoreId: state.selectedStoreId,
      }),
    }
  )
);
