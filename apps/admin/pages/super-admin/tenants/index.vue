<script setup lang="ts">
definePageMeta({ middleware: ['admin-auth', 'super-admin'] });
useHead({ title: '테넌트 관리' });

const page = ref(1);
const limit = ref(20);
const search = ref('');
const isActive = ref('');

const queryString = computed(() => {
  const params = new URLSearchParams();
  params.set('page', String(page.value));
  params.set('limit', String(limit.value));
  if (search.value) params.set('search', search.value);
  if (isActive.value) params.set('isActive', isActive.value);
  return `/super-admin/tenants?${params.toString()}`;
});

const { data, pending, refresh } = useAdminApi<any>(queryString);

const activeOptions = [
  { label: '전체', value: '' },
  { label: '활성', value: 'true' },
  { label: '비활성', value: 'false' },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ko-KR');
}

function onSearch() {
  page.value = 1;
  refresh();
}

watch([isActive], () => { page.value = 1; refresh(); });

const columns = [
  { key: 'name', label: '이름' },
  { key: 'slug', label: 'Slug' },
  { key: 'domain', label: '도메인' },
  { key: 'users', label: '사용자 수' },
  { key: 'isActive', label: '상태' },
  { key: 'createdAt', label: '생성일' },
  { key: 'actions', label: '', class: 'w-20' },
];
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">테넌트 관리</h1>
      <UButton to="/super-admin/tenants/create" icon="i-heroicons-plus" label="테넌트 생성" />
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <div class="flex flex-wrap gap-3">
        <UInput
          v-model="search"
          placeholder="이름, slug 검색..."
          icon="i-heroicons-magnifying-glass"
          class="w-64"
          @keyup.enter="onSearch"
        />
        <USelect v-model="isActive" :options="activeOptions" value-attribute="value" option-attribute="label" />
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <UTable :columns="columns" :rows="data?.data || []" :loading="pending">
        <template #name-data="{ row }">
          <NuxtLink :to="`/super-admin/tenants/${row.id}`" class="text-sm font-medium text-primary-600 hover:underline">
            {{ row.name }}
          </NuxtLink>
        </template>
        <template #slug-data="{ row }">
          <code class="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{{ row.slug }}</code>
        </template>
        <template #domain-data="{ row }">
          <span class="text-sm text-gray-500">{{ row.domain || '-' }}</span>
        </template>
        <template #users-data="{ row }">
          <span class="text-sm">{{ row._count?.users || 0 }}</span>
        </template>
        <template #isActive-data="{ row }">
          <UBadge :color="row.isActive ? 'green' : 'red'" variant="subtle" size="xs">
            {{ row.isActive ? '활성' : '비활성' }}
          </UBadge>
        </template>
        <template #createdAt-data="{ row }">
          <span class="text-sm text-gray-500">{{ formatDate(row.createdAt) }}</span>
        </template>
        <template #actions-data="{ row }">
          <UButton :to="`/super-admin/tenants/${row.id}`" variant="ghost" color="gray" icon="i-heroicons-eye" size="xs" />
        </template>
      </UTable>

      <div v-if="data?.meta" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <p class="text-sm text-gray-500">총 {{ data.meta.total }}건</p>
        <UPagination v-model="page" :total="data.meta.total" :page-count="limit" @update:model-value="refresh" />
      </div>
    </div>
  </div>
</template>
