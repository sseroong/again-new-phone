import { defineStore } from 'pinia';

interface TenantState {
  selectedTenantId: string | null;
}

export const useTenantStore = defineStore('tenant', {
  state: (): TenantState => ({
    selectedTenantId: null,
  }),

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
  },
});
