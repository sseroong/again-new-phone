export default defineNuxtPlugin(async () => {
  const tenantStore = useTenantStore();
  await tenantStore.resolveTenant();
});
