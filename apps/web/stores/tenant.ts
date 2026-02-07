import { defineStore } from 'pinia';
import { DEFAULT_TENANT_ID } from '@phone-marketplace/shared';

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  settings: Record<string, unknown>;
}

interface TenantState {
  currentTenant: TenantInfo | null;
  isResolved: boolean;
}

export const useTenantStore = defineStore('tenant', {
  state: (): TenantState => ({
    currentTenant: null,
    isResolved: false,
  }),

  getters: {
    tenantId: (state): string => state.currentTenant?.id || DEFAULT_TENANT_ID,
  },

  actions: {
    async resolveTenant() {
      if (this.isResolved) return;

      try {
        const config = useRuntimeConfig();
        const domain = window.location.hostname;

        const tenant = await $fetch<TenantInfo | null>(
          `${config.public.apiBaseUrl}/tenants/resolve`,
          { params: { domain } },
        );

        if (tenant) {
          this.currentTenant = tenant;
        }
      } catch {
        // 실패 시 기본 테넌트 사용
      } finally {
        this.isResolved = true;
      }
    },
  },
});
