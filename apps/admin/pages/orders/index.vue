<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });
useHead({ title: '주문 관리' });

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
  return `/admin/orders?${params.toString()}`;
});

const { data, pending, refresh } = useAdminApi<any>(queryString);

const statusOptions = [
  { label: '전체', value: '' },
  { label: '결제 대기', value: 'PENDING_PAYMENT' },
  { label: '결제 완료', value: 'PAID' },
  { label: '상품 준비중', value: 'PREPARING' },
  { label: '배송중', value: 'SHIPPING' },
  { label: '배송 완료', value: 'DELIVERED' },
  { label: '거래 완료', value: 'COMPLETED' },
  { label: '취소', value: 'CANCELLED' },
  { label: '환불', value: 'REFUNDED' },
];

const statusColors: Record<string, string> = {
  PENDING_PAYMENT: 'gray',
  PAID: 'blue',
  PREPARING: 'yellow',
  SHIPPING: 'orange',
  DELIVERED: 'green',
  COMPLETED: 'emerald',
  CANCELLED: 'red',
  REFUNDED: 'purple',
};

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: '결제 대기',
  PAID: '결제 완료',
  PREPARING: '상품 준비중',
  SHIPPING: '배송중',
  DELIVERED: '배송 완료',
  COMPLETED: '거래 완료',
  CANCELLED: '취소',
  REFUNDED: '환불',
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ko-KR');
}

function onSearch() {
  page.value = 1;
  refresh();
}

watch(status, () => { page.value = 1; refresh(); });

const columns = [
  { key: 'orderNumber', label: '주문번호' },
  { key: 'user', label: '주문자' },
  { key: 'totalAmount', label: '금액', class: 'text-right' },
  { key: 'status', label: '상태' },
  { key: 'createdAt', label: '주문일' },
  { key: 'actions', label: '', class: 'w-20' },
];
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">주문 관리</h1>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <div class="flex flex-wrap gap-3">
        <UInput
          v-model="search"
          placeholder="주문번호, 주문자 검색..."
          icon="i-heroicons-magnifying-glass"
          class="w-64"
          @keyup.enter="onSearch"
        />
        <USelect v-model="status" :options="statusOptions" value-attribute="value" option-attribute="label" />
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <UTable :columns="columns" :rows="data?.data || []" :loading="pending">
        <template #orderNumber-data="{ row }">
          <NuxtLink :to="`/orders/${row.id}`" class="text-sm font-medium text-primary-600 hover:underline">
            {{ row.orderNumber }}
          </NuxtLink>
        </template>
        <template #user-data="{ row }">
          <span class="text-sm text-gray-600">{{ row.user?.name || '-' }}</span>
        </template>
        <template #totalAmount-data="{ row }">
          <span class="text-sm font-medium">{{ formatPrice(row.totalAmount) }}</span>
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
          <UButton :to="`/orders/${row.id}`" variant="ghost" color="gray" icon="i-heroicons-eye" size="xs" />
        </template>
      </UTable>

      <div v-if="data?.meta" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <p class="text-sm text-gray-500">총 {{ data.meta.total }}건</p>
        <UPagination v-model="page" :total="data.meta.total" :page-count="limit" @update:model-value="refresh" />
      </div>
    </div>
  </div>
</template>
