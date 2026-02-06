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
  },

  actions: {
    setUser(user: User | null) {
      this.user = user;
    },

    setTokens(tokens: AuthTokens | null) {
      this.tokens = tokens;
      if (tokens) {
        localStorage.setItem('admin_accessToken', tokens.accessToken);
        localStorage.setItem('admin_refreshToken', tokens.refreshToken);
      } else {
        localStorage.removeItem('admin_accessToken');
        localStorage.removeItem('admin_refreshToken');
      }
    },

    async login(email: string, password: string) {
      this.isLoading = true;
      try {
        const config = useRuntimeConfig();
        const response = await $fetch<{ user: User; accessToken: string; refreshToken: string }>(
          `${config.public.apiBaseUrl}/auth/login`,
          {
            method: 'POST',
            body: { email, password },
          }
        );

        // 관리자 역할 검증
        if (response.user.role !== 'ADMIN' && response.user.role !== 'SUPER_ADMIN') {
          throw new Error('관리자 권한이 없습니다.');
        }

        this.setUser(response.user);
        this.setTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken });

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

        // 관리자 역할 검증
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
          this.setUser(null);
          this.setTokens(null);
          return null;
        }

        this.setUser(user);
        return user;
      } catch {
        return null;
      }
    },

    initFromStorage() {
      const accessToken = localStorage.getItem('admin_accessToken');
      const refreshToken = localStorage.getItem('admin_refreshToken');

      if (accessToken && refreshToken) {
        this.tokens = { accessToken, refreshToken };
        this.fetchUser();
      }
    },
  },
});
