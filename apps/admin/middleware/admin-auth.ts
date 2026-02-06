export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return;

  const authStore = useAuthStore();

  // 로그인 페이지는 미인증 허용
  if (to.path === '/login') {
    if (authStore.isAuthenticated && authStore.isAdmin) {
      return navigateTo('/');
    }
    return;
  }

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
