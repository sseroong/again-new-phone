<script setup lang="ts">
const route = useRoute();
const authStore = useAuthStore();

const sidebarItems = [
  { label: '대시보드', to: '/', icon: 'i-heroicons-home' },
  { label: '상품 관리', to: '/products', icon: 'i-heroicons-cube' },
  { label: '주문 관리', to: '/orders', icon: 'i-heroicons-shopping-bag' },
  { label: '판매접수 관리', to: '/sell-requests', icon: 'i-heroicons-arrow-down-tray' },
  { label: '회원 관리', to: '/users', icon: 'i-heroicons-users' },
];

const isActive = (to: string) => {
  if (to === '/') return route.path === '/';
  return route.path.startsWith(to);
};

const sidebarCollapsed = ref(false);
</script>

<template>
  <div class="min-h-screen flex bg-gray-50">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-40 bg-gray-900 text-white transition-all duration-200"
      :class="sidebarCollapsed ? 'w-16' : 'w-60'"
    >
      <!-- Logo -->
      <div class="flex items-center h-16 px-4 border-b border-gray-800">
        <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 text-white" />
        </div>
        <span v-if="!sidebarCollapsed" class="ml-3 text-lg font-bold whitespace-nowrap">
          폰마켓 관리자
        </span>
      </div>

      <!-- Navigation -->
      <nav class="mt-4 px-2 space-y-1">
        <NuxtLink
          v-for="item in sidebarItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="[
            isActive(item.to)
              ? 'bg-primary-600 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          ]"
        >
          <UIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span v-if="!sidebarCollapsed" class="whitespace-nowrap">{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </aside>

    <!-- Main Area -->
    <div
      class="flex-1 transition-all duration-200"
      :class="sidebarCollapsed ? 'ml-16' : 'ml-60'"
    >
      <!-- Topbar -->
      <header class="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center px-6">
        <UButton
          variant="ghost"
          color="gray"
          :icon="sidebarCollapsed ? 'i-heroicons-bars-3' : 'i-heroicons-x-mark'"
          size="sm"
          @click="sidebarCollapsed = !sidebarCollapsed"
        />

        <div class="flex-1" />

        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-600">
            {{ authStore.user?.name }}
            <UBadge color="primary" variant="subtle" size="xs">
              {{ authStore.user?.role === 'SUPER_ADMIN' ? '최고관리자' : '관리자' }}
            </UBadge>
          </span>
          <UButton
            variant="ghost"
            color="gray"
            label="로그아웃"
            size="sm"
            icon="i-heroicons-arrow-right-on-rectangle"
            @click="authStore.logout().then(() => navigateTo('/login'))"
          />
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
