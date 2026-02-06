import type { UseFetchOptions } from 'nuxt/app';

export function useAdminApi<T>(
  url: string | (() => string),
  options: UseFetchOptions<T> = {}
) {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const defaults: UseFetchOptions<T> = {
    baseURL: config.public.apiBaseUrl as string,
    key: typeof url === 'string' ? url : undefined,

    onRequest({ options }) {
      if (authStore.tokens?.accessToken) {
        const headers = new Headers(options.headers);
        headers.set('Authorization', `Bearer ${authStore.tokens.accessToken}`);
        options.headers = headers;
      }
    },

    onResponseError({ response }) {
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

// $fetch 기반 직접 호출 (mutation용)
export function useAdminFetch() {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  return async <T>(url: string, options: RequestInit & { body?: unknown } = {}): Promise<T> => {
    const headers = new Headers(options.headers);
    if (authStore.tokens?.accessToken) {
      headers.set('Authorization', `Bearer ${authStore.tokens.accessToken}`);
    }
    headers.set('Content-Type', 'application/json');

    return $fetch<T>(url, {
      baseURL: config.public.apiBaseUrl as string,
      ...options,
      headers,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
    } as any);
  };
}
