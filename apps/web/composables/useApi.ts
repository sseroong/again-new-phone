import type { UseFetchOptions } from 'nuxt/app';

export function useApi<T>(
  url: string | (() => string),
  options: UseFetchOptions<T> = {}
) {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const defaults: UseFetchOptions<T> = {
    baseURL: config.public.apiBaseUrl as string,
    key: typeof url === 'string' ? url : undefined,

    onRequest({ options }) {
      const headers = new Headers(options.headers);

      // 인증 토큰 추가
      if (authStore.tokens?.accessToken) {
        headers.set('Authorization', `Bearer ${authStore.tokens.accessToken}`);
      }

      // 테넌트 ID 헤더 추가
      const tenantStore = useTenantStore();
      headers.set('X-Tenant-ID', tenantStore.tenantId);

      options.headers = headers;
    },

    onResponseError({ response }) {
      // 401 에러 시 토큰 갱신 시도
      if (response.status === 401) {
        authStore.refreshTokens();
      }
    },
  };

  const params = {
    ...defaults,
    ...options,
  };

  return useFetch(url, params);
}

// GET 요청 헬퍼
export function useApiGet<T>(
  url: string | (() => string),
  options: UseFetchOptions<T> = {}
) {
  return useApi<T>(url, { ...options, method: 'GET' });
}

// POST 요청 헬퍼
export function useApiPost<T>(
  url: string | (() => string),
  body?: Record<string, unknown>,
  options: UseFetchOptions<T> = {}
) {
  return useApi<T>(url, { ...options, method: 'POST', body });
}

// PUT 요청 헬퍼
export function useApiPut<T>(
  url: string | (() => string),
  body?: Record<string, unknown>,
  options: UseFetchOptions<T> = {}
) {
  return useApi<T>(url, { ...options, method: 'PUT', body });
}

// DELETE 요청 헬퍼
export function useApiDelete<T>(
  url: string | (() => string),
  options: UseFetchOptions<T> = {}
) {
  return useApi<T>(url, { ...options, method: 'DELETE' });
}
