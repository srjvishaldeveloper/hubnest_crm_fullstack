import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser } from '../services/auth';
import { authService } from '../services/auth';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  pendingUserId: string | null;   // userId waiting for OTP verification

  // Actions
  setPendingUserId: (userId: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  loginSuccess: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  hasPermission: (module: string, action: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      pendingUserId: null,

      setPendingUserId: (userId) => set({ pendingUserId: userId }),

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        // Mirror in localStorage so Axios interceptor can read them
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }
      },

      setUser: (user) => set({ user }),

      loginSuccess: (accessToken, refreshToken, user) => {
        set({ accessToken, refreshToken, user, pendingUserId: null });
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) await authService.logout(refreshToken);
        } catch {
          // Swallow — clear state regardless
        }
        set({ user: null, accessToken: null, refreshToken: null, pendingUserId: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          document.cookie = 'accessToken=; path=/; max-age=0';
        }
      },

      isAuthenticated: () => {
        const { accessToken, user } = get();
        return !!accessToken && !!user;
      },

      hasPermission: (module, action) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'Super Admin') return true;
        return !!user.permissions?.[module]?.[action];
      },
    }),
    {
      name: 'crm-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        pendingUserId: state.pendingUserId,
      }),
    }
  )
);
