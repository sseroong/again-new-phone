import { defineStore } from 'pinia';
import type { User, AuthTokens } from '@phone-marketplace/shared';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    tokens: null,
    isLoading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.tokens?.accessToken,
    isAdmin: (state) => state.user?.role === 'ADMIN' || state.user?.role === 'SUPER_ADMIN',
    isPartner: (state) => state.user?.role === 'PARTNER',
  },

  actions: {
    setUser(user: User | null) {
      this.user = user;
    },

    setTokens(tokens: AuthTokens | null) {
      this.tokens = tokens;
      if (tokens) {
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    },

    async login(email: string, password: string) {
      this.isLoading = true;
      try {
        const config = useRuntimeConfig();
        const response = await $fetch<{ user: User; tokens: AuthTokens }>(
          `${config.public.apiBaseUrl}/auth/login`,
          {
            method: 'POST',
            body: { email, password },
          }
        );

        this.setUser(response.user);
        this.setTokens(response.tokens);

        return response;
      } finally {
        this.isLoading = false;
      }
    },

    async register(data: { email: string; password: string; name: string; phone?: string }) {
      this.isLoading = true;
      try {
        const config = useRuntimeConfig();
        const response = await $fetch<{ user: User; tokens: AuthTokens }>(
          `${config.public.apiBaseUrl}/auth/register`,
          {
            method: 'POST',
            body: data,
          }
        );

        this.setUser(response.user);
        this.setTokens(response.tokens);

        return response;
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      try {
        const config = useRuntimeConfig();
        if (this.tokens?.refreshToken) {
          await $fetch(`${config.public.apiBaseUrl}/auth/logout`, {
            method: 'POST',
            body: { refreshToken: this.tokens.refreshToken },
          });
        }
      } catch {
        // 로그아웃 API 실패해도 로컬 상태는 클리어
      } finally {
        this.setUser(null);
        this.setTokens(null);
      }
    },

    async refreshTokens() {
      if (!this.tokens?.refreshToken) return null;

      try {
        const config = useRuntimeConfig();
        const response = await $fetch<AuthTokens>(
          `${config.public.apiBaseUrl}/auth/refresh`,
          {
            method: 'POST',
            body: { refreshToken: this.tokens.refreshToken },
          }
        );

        this.setTokens(response);
        return response;
      } catch {
        this.setUser(null);
        this.setTokens(null);
        return null;
      }
    },

    async fetchUser() {
      if (!this.tokens?.accessToken) return null;

      try {
        const config = useRuntimeConfig();
        const user = await $fetch<User>(
          `${config.public.apiBaseUrl}/users/me`,
          {
            headers: {
              Authorization: `Bearer ${this.tokens.accessToken}`,
            },
          }
        );

        this.setUser(user);
        return user;
      } catch {
        return null;
      }
    },

    initFromStorage() {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken && refreshToken) {
        this.tokens = { accessToken, refreshToken };
        this.fetchUser();
      }
    },
  },
});
