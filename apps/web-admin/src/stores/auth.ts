import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role } from '@shoplink/shared';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  businessId: string;
  businessName: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      setToken: (accessToken) => set({ accessToken }),
      logout: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'dukapos-auth',
      // Only persist the user object, not the token (token comes from cookie refresh)
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
