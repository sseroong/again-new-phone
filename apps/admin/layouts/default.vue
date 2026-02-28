<script setup lang="ts">
const route = useRoute();
const authStore = useAuthStore();
const tenantStore = useTenantStore();

function onTenantChange(tenantId: string) {
  tenantStore.setTenantId(tenantId);
  reloadNuxtApp();
}

const sidebarItems = [
  { label: '대시보드', to: '/', icon: 'i-heroicons-home' },
  { label: '상품 관리', to: '/products', icon: 'i-heroicons-cube' },
  { label: '주문 관리', to: '/orders', icon: 'i-heroicons-shopping-bag' },
  { label: '배송 관리', to: '/shipping', icon: 'i-heroicons-truck' },
  { label: '판매접수 관리', to: '/sell-requests', icon: 'i-heroicons-arrow-down-tray' },
  { label: '회원 관리', to: '/users', icon: 'i-heroicons-users' },
  { label: 'CMS 관리', to: '/cms', icon: 'i-heroicons-document-text' },
  { label: '메타데이터 관리', to: '/metadata', icon: 'i-heroicons-cog-6-tooth' },
];

const superAdminItems = [
  { label: '글로벌 대시보드', to: '/super-admin', icon: 'i-heroicons-chart-bar-square' },
  { label: '테넌트 관리', to: '/super-admin/tenants', icon: 'i-heroicons-building-office-2' },
  { label: '전체 사용자', to: '/super-admin/users', icon: 'i-heroicons-user-group' },
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
      <div class="flex items-center justify-between h-16 px-4 border-b border-gray-800">
        <img src="/images/logo-horizontal.png" alt="딱내폰 관리자" class="h-7 flex-shrink-0" v-if="!sidebarCollapsed" />
        <img src="/images/logo-vertical.png" alt="딱내폰" class="h-8 w-8 object-contain flex-shrink-0" v-else />
        <UButton
          variant="ghost"
          color="white"
          :icon="sidebarCollapsed ? 'i-heroicons-bars-3' : 'i-heroicons-x-mark'"
          size="xs"
          @click="sidebarCollapsed = !sidebarCollapsed"
        />
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
        <!-- Super Admin Section -->
        <template v-if="authStore.user?.role === 'SUPER_ADMIN'">
          <div class="border-t border-gray-800 my-3 mx-2" />
          <p v-if="!sidebarCollapsed" class="px-3 text-xs text-gray-500 uppercase tracking-wider mb-1">Super Admin</p>
          <NuxtLink
            v-for="item in superAdminItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            :class="[
              isActive(item.to)
                ? 'bg-red-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            ]"
          >
            <UIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
            <span v-if="!sidebarCollapsed" class="whitespace-nowrap">{{ item.label }}</span>
          </NuxtLink>
        </template>
      </nav>
    </aside>

    <!-- Main Area -->
    <div
      class="flex-1 transition-all duration-200"
      :class="sidebarCollapsed ? 'ml-16' : 'ml-60'"
    >
      <!-- Topbar -->
      <header class="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center px-6">
        <div class="flex-1" />

        <!-- 테넌트 셀렉터 -->
        <div v-if="tenantStore.tenantOptions.length > 1" class="mr-4">
          <USelect
            :model-value="tenantStore.selectedTenantId"
            :options="tenantStore.tenantOptions"
            value-attribute="value"
            option-attribute="label"
            size="sm"
            class="w-48"
            icon="i-heroicons-building-office-2"
            @update:model-value="onTenantChange"
          />
        </div>
        <UBadge v-else-if="tenantStore.currentTenant" color="gray" variant="subtle" size="xs" class="mr-4">
          <UIcon name="i-heroicons-building-office-2" class="w-3 h-3 mr-1" />
          {{ tenantStore.currentTenant.name }}
        </UBadge>

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
