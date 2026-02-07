export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return;

  const authStore = useAuthStore();

  if (authStore.user?.role !== 'SUPER_ADMIN') {
    return navigateTo('/');
  }
});
