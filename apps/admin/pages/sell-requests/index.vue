<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });
useHead({ title: '판매접수 관리' });

const page = ref(1);
const limit = ref(20);
const search = ref('');
const status = ref('');

const queryString = computed(() => {
  const params = new URLSearchParams();
  params.set('page', String(page.value));
  params.set('limit', String(limit.value));
  if (search.value) params.set('search', search.value);
  if (status.value) params.set('status', status.value);
  return `/admin/sell-requests?${params.toString()}`;
});

const { data, pending, refresh } = useAdminApi<any>(queryString);

const statusOptions = [
  { label: '전체', value: '' },
  { label: '접수 대기', value: 'PENDING' },
  { label: '견적 제안됨', value: 'QUOTED' },
  { label: '견적 수락', value: 'ACCEPTED' },
  { label: '배송중', value: 'SHIPPING' },
  { label: '검수중', value: 'INSPECTING' },
  { label: '완료', value: 'COMPLETED' },
  { label: '취소', value: 'CANCELLED' },
];

const statusColors: Record<string, string> = {
  PENDING: 'gray',
  QUOTED: 'blue',
  ACCEPTED: 'yellow',
  SHIPPING: 'orange',
  INSPECTING: 'purple',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

const statusLabels: Record<string, string> = {
  PENDING: '접수 대기',
  QUOTED: '견적 제안됨',
  ACCEPTED: '견적 수락',
  SHIPPING: '배송중',
  INSPECTING: '검수중',
  COMPLETED: '완료',
  CANCELLED: '취소',
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ko-KR');
}

function onSearch() {
  page.value = 1;
  refresh();
}

watch(status, () => { page.value = 1; refresh(); });

const columns = [
  { key: 'id', label: 'ID', class: 'w-12' },
  { key: 'deviceName', label: '기기명' },
  { key: 'user', label: '신청자' },
  { key: 'status', label: '상태' },
  { key: 'createdAt', label: '접수일' },
  { key: 'actions', label: '', class: 'w-20' },
];
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">판매접수 관리</h1>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <div class="flex flex-wrap gap-3">
        <UInput
          v-model="search"
          placeholder="기기명, 신청자 검색..."
          icon="i-heroicons-magnifying-glass"
          class="w-64"
          @keyup.enter="onSearch"
        />
        <USelect v-model="status" :options="statusOptions" value-attribute="value" option-attribute="label" />
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <UTable :columns="columns" :rows="data?.data || []" :loading="pending">
        <template #deviceName-data="{ row }">
          <NuxtLink :to="`/sell-requests/${row.id}`" class="text-sm font-medium text-primary-600 hover:underline">
            {{ row.deviceName || '기기' }}
          </NuxtLink>
        </template>
        <template #user-data="{ row }">
          <span class="text-sm text-gray-600">{{ row.user?.name || '-' }}</span>
        </template>
        <template #status-data="{ row }">
          <UBadge :color="statusColors[row.status] || 'gray'" variant="subtle" size="xs">
            {{ statusLabels[row.status] || row.status }}
          </UBadge>
        </template>
        <template #createdAt-data="{ row }">
          <span class="text-sm text-gray-500">{{ formatDate(row.createdAt) }}</span>
        </template>
        <template #actions-data="{ row }">
          <UButton :to="`/sell-requests/${row.id}`" variant="ghost" color="gray" icon="i-heroicons-eye" size="xs" />
        </template>
      </UTable>

      <div v-if="data?.meta" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <p class="text-sm text-gray-500">총 {{ data.meta.total }}건</p>
        <UPagination v-model="page" :total="data.meta.total" :page-count="limit" @update:model-value="refresh" />
      </div>
    </div>
  </div>
</template>
