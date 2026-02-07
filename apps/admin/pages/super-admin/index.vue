<script setup lang="ts">
definePageMeta({ middleware: ['admin-auth', 'super-admin'] });
useHead({ title: '글로벌 대시보드' });

const { data: stats, pending } = useAdminApi<any>('/super-admin/dashboard');

function formatPrice(price: number) {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
}

const tenantColumns = [
  { key: 'name', label: '테넌트' },
  { key: 'slug', label: 'Slug' },
  { key: 'users', label: '사용자' },
  { key: 'products', label: '상품' },
  { key: 'orders', label: '주문' },
];
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">글로벌 대시보드</h1>

    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

    <template v-else-if="stats">
      <!-- 통계 카드 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div class="stat-card">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-building-office-2" class="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">전체 테넌트</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.stats?.totalTenants }}</p>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-check-badge" class="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">활성 테넌트</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.stats?.activeTenants }}</p>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-users" class="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">전체 사용자</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.stats?.totalUsers?.toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-shopping-bag" class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">전체 주문</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.stats?.totalOrders?.toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">전체 매출</p>
              <p class="text-2xl font-bold text-gray-900">{{ formatPrice(stats.stats?.totalRevenue || 0) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 테넌트별 통계 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900">테넌트별 통계</h2>
          <NuxtLink to="/super-admin/tenants" class="text-sm text-primary-600 hover:underline">전체 보기</NuxtLink>
        </div>
        <UTable :columns="tenantColumns" :rows="stats.tenantStats || []">
          <template #name-data="{ row }">
            <NuxtLink :to="`/super-admin/tenants/${row.id}`" class="text-sm font-medium text-primary-600 hover:underline">
              {{ row.name }}
            </NuxtLink>
          </template>
          <template #slug-data="{ row }">
            <span class="text-sm text-gray-500">{{ row.slug }}</span>
          </template>
          <template #users-data="{ row }">
            <span class="text-sm">{{ row._count?.users || 0 }}</span>
          </template>
          <template #products-data="{ row }">
            <span class="text-sm">{{ row._count?.products || 0 }}</span>
          </template>
          <template #orders-data="{ row }">
            <span class="text-sm">{{ row._count?.orders || 0 }}</span>
          </template>
        </UTable>
      </div>
    </template>
  </div>
</template>
