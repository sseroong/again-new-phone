export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();
  authStore.initFromStorage();

  const tenantStore = useTenantStore();
  tenantStore.initFromStorage();

  if (authStore.isAuthenticated) {
    await tenantStore.fetchUserTenants();
  }
});
