export default defineNuxtRouteMiddleware((to) => {
  // 로그인 페이지는 항상 허용
  if (to.path === '/login') {
    if (import.meta.server) return;

    const authStore = useAuthStore();
    if (authStore.isAuthenticated && authStore.isAdmin) {
      return navigateTo('/');
    }
    return;
  }

  // SSR에서는 localStorage 기반 인증을 확인할 수 없으므로 로그인으로 리다이렉트
  if (import.meta.server) {
    return navigateTo('/login');
  }

  const authStore = useAuthStore();

  // 인증 확인
  if (!authStore.isAuthenticated) {
    return navigateTo('/login');
  }

  // 관리자 역할 확인
  if (!authStore.isAdmin) {
    authStore.logout();
    return navigateTo('/login');
  }
});
