import { defineStore } from 'pinia';

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
}

interface UserTenantRecord {
  userId: string;
  tenantId: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
  tenant: TenantInfo;
}

interface TenantState {
  selectedTenantId: string | null;
  tenants: UserTenantRecord[];
  isLoaded: boolean;
}

export const useTenantStore = defineStore('tenant', {
  state: (): TenantState => ({
    selectedTenantId: null,
    tenants: [],
    isLoaded: false,
  }),

  getters: {
    currentTenant(state): TenantInfo | null {
      if (!state.selectedTenantId) return null;
      const found = state.tenants.find(t => t.tenant.id === state.selectedTenantId);
      return found?.tenant || null;
    },

    tenantOptions(state): Array<{ label: string; value: string }> {
      return state.tenants.map(t => ({
        label: t.tenant.name,
        value: t.tenant.id,
      }));
    },
  },

  actions: {
    setTenantId(id: string) {
      this.selectedTenantId = id;
      localStorage.setItem('admin_selectedTenantId', id);
    },

    clearTenantId() {
      this.selectedTenantId = null;
      localStorage.removeItem('admin_selectedTenantId');
    },

    initFromStorage() {
      const stored = localStorage.getItem('admin_selectedTenantId');
      if (stored) {
        this.selectedTenantId = stored;
      }
    },

    async fetchUserTenants() {
      if (this.isLoaded) return;

      const config = useRuntimeConfig();
      const authStore = useAuthStore();

      if (!authStore.tokens?.accessToken) return;

      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${authStore.tokens.accessToken}`,
        };

        if (authStore.user?.role === 'SUPER_ADMIN') {
          // 슈퍼어드민: 전체 테넌트 목록
          const res = await $fetch<{ data: Array<{ id: string; name: string; slug: string }> }>(
            `${config.public.apiBaseUrl}/super-admin/tenants`,
            { headers, params: { limit: 100 } },
          );
          this.tenants = (res.data || []).map(t => ({
            userId: authStore.user!.id,
            tenantId: t.id,
            role: 'SUPER_ADMIN',
            isActive: true,
            joinedAt: '',
            tenant: { id: t.id, name: t.name, slug: t.slug },
          }));
        } else {
          // 일반 관리자: 자신의 테넌트만
          const res = await $fetch<UserTenantRecord[]>(
            `${config.public.apiBaseUrl}/users/me/tenants`,
            { headers },
          );
          this.tenants = res || [];
        }

        // 저장된 테넌트가 목록에 있으면 유지, 없으면 첫번째 선택
        if (this.tenants.length > 0) {
          const stored = this.selectedTenantId;
          const isValid = stored && this.tenants.some(t => t.tenant.id === stored);
          if (!isValid) {
            this.setTenantId(this.tenants[0].tenant.id);
          }
        }
      } catch {
        // 조회 실패 시 무시
      } finally {
        this.isLoaded = true;
      }
    },
  },
});
