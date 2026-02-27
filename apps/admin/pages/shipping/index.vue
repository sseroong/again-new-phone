<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });
useHead({ title: '배송 관리' });

const page = ref(1);
const limit = ref(20);
const search = ref('');
const status = ref('');
const startDate = ref('');
const endDate = ref('');

const queryString = computed(() => {
  const params = new URLSearchParams();
  params.set('page', String(page.value));
  params.set('limit', String(limit.value));
  if (search.value) params.set('search', search.value);
  if (status.value) params.set('status', status.value);
  if (startDate.value) params.set('startDate', startDate.value);
  if (endDate.value) params.set('endDate', endDate.value);
  return `/admin/orders/shipping?${params.toString()}`;
});

const { data, pending, refresh } = useAdminApi<any>(queryString);

const statusOptions = [
  { label: '전체', value: '' },
  { label: '결제 완료', value: 'PAID' },
  { label: '상품 준비중', value: 'PREPARING' },
  { label: '배송중', value: 'SHIPPING' },
  { label: '배송 완료', value: 'DELIVERED' },
  { label: '거래 완료', value: 'COMPLETED' },
];

const statusColors: Record<string, string> = {
  PAID: 'blue',
  PREPARING: 'yellow',
  SHIPPING: 'orange',
  DELIVERED: 'green',
  COMPLETED: 'emerald',
};

const statusLabels: Record<string, string> = {
  PAID: '결제 완료',
  PREPARING: '상품 준비중',
  SHIPPING: '배송중',
  DELIVERED: '배송 완료',
  COMPLETED: '거래 완료',
};

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ko-KR');
}

function onSearch() {
  page.value = 1;
  refresh();
}

function clearDateFilter() {
  startDate.value = '';
  endDate.value = '';
  page.value = 1;
  refresh();
}

watch(status, () => { page.value = 1; refresh(); });

const columns = [
  { key: 'orderNumber', label: '주문번호' },
  { key: 'shippingName', label: '수취인' },
  { key: 'shippingPhone', label: '연락처' },
  { key: 'shippingAddress', label: '배송지' },
  { key: 'status', label: '상태' },
  { key: 'tracking', label: '송장' },
  { key: 'shippedAt', label: '출고일' },
  { key: 'createdAt', label: '주문일' },
  { key: 'actions', label: '', class: 'w-20' },
];
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">배송 관리</h1>

    <!-- 필터 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <div class="flex flex-wrap gap-3 items-end">
        <UInput
          v-model="search"
          placeholder="주문번호, 수취인, 송장번호..."
          icon="i-heroicons-magnifying-glass"
          class="w-64"
          @keyup.enter="onSearch"
        />
        <USelect v-model="status" :options="statusOptions" value-attribute="value" option-attribute="label" />
        <div class="flex items-center gap-2">
          <UInput v-model="startDate" type="date" size="sm" class="w-40" placeholder="시작일" />
          <span class="text-gray-400">~</span>
          <UInput v-model="endDate" type="date" size="sm" class="w-40" placeholder="종료일" />
          <UButton
            v-if="startDate || endDate"
            variant="ghost"
            color="gray"
            icon="i-heroicons-x-mark"
            size="xs"
            @click="clearDateFilter"
          />
        </div>
      </div>
    </div>

    <!-- 테이블 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <UTable :columns="columns" :rows="data?.data || []" :loading="pending">
        <template #orderNumber-data="{ row }">
          <NuxtLink :to="`/shipping/${row.id}`" class="text-sm font-medium text-primary-600 hover:underline">
            {{ row.orderNumber }}
          </NuxtLink>
        </template>
        <template #shippingName-data="{ row }">
          <span class="text-sm text-gray-700">{{ row.shippingName || '-' }}</span>
        </template>
        <template #shippingPhone-data="{ row }">
          <span class="text-sm text-gray-600">{{ row.shippingPhone || '-' }}</span>
        </template>
        <template #shippingAddress-data="{ row }">
          <span class="text-sm text-gray-600 truncate max-w-[200px] block">
            {{ row.shippingAddress ? `${row.shippingAddress} ${row.shippingDetail || ''}` : '-' }}
          </span>
        </template>
        <template #status-data="{ row }">
          <UBadge :color="statusColors[row.status] || 'gray'" variant="subtle" size="xs">
            {{ statusLabels[row.status] || row.status }}
          </UBadge>
        </template>
        <template #tracking-data="{ row }">
          <template v-if="row.trackingNumber">
            <span class="text-xs text-gray-500">{{ row.trackingCompany }}</span>
            <span class="text-sm font-medium block">{{ row.trackingNumber }}</span>
          </template>
          <span v-else class="text-xs text-gray-400">-</span>
        </template>
        <template #shippedAt-data="{ row }">
          <UBadge v-if="row.shippedAt" color="green" variant="subtle" size="xs">
            {{ formatDate(row.shippedAt) }}
          </UBadge>
          <UBadge v-else-if="['PAID', 'PREPARING'].includes(row.status)" color="yellow" variant="subtle" size="xs">
            미출고
          </UBadge>
          <span v-else class="text-xs text-gray-400">-</span>
        </template>
        <template #createdAt-data="{ row }">
          <span class="text-sm text-gray-500">{{ formatDate(row.createdAt) }}</span>
        </template>
        <template #actions-data="{ row }">
          <UButton :to="`/shipping/${row.id}`" variant="ghost" color="gray" icon="i-heroicons-eye" size="xs" />
        </template>
      </UTable>

      <div v-if="data?.meta" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <p class="text-sm text-gray-500">총 {{ data.meta.total }}건</p>
        <UPagination v-model="page" :total="data.meta.total" :page-count="limit" @update:model-value="refresh" />
      </div>
    </div>
  </div>
</template>
