<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });
useHead({ title: '상품 관리' });

const route = useRoute();
const router = useRouter();

const page = ref(Number(route.query.page) || 1);
const limit = ref(20);
const search = ref((route.query.search as string) || '');
const status = ref((route.query.status as string) || '');
const category = ref((route.query.category as string) || '');

const queryString = computed(() => {
  const params = new URLSearchParams();
  params.set('page', String(page.value));
  params.set('limit', String(limit.value));
  if (search.value) params.set('search', search.value);
  if (status.value) params.set('status', status.value);
  if (category.value) params.set('category', category.value);
  return `/admin/products?${params.toString()}`;
});

const { data, pending, refresh } = useAdminApi<any>(queryString);

const statusOptions = [
  { label: '전체 상태', value: '' },
  { label: '판매중', value: 'AVAILABLE' },
  { label: '예약중', value: 'RESERVED' },
  { label: '판매완료', value: 'SOLD' },
  { label: '비활성', value: 'UNAVAILABLE' },
];

const categoryOptions = [
  { label: '전체 카테고리', value: '' },
  { label: '스마트폰', value: 'SMARTPHONE' },
  { label: '태블릿', value: 'TABLET' },
  { label: '스마트워치', value: 'WATCH' },
  { label: '노트북', value: 'LAPTOP' },
  { label: '무선이어폰', value: 'EARPHONE' },
];

const statusColors: Record<string, string> = {
  AVAILABLE: 'green',
  RESERVED: 'yellow',
  SOLD: 'gray',
  UNAVAILABLE: 'red',
};

const statusLabels: Record<string, string> = {
  AVAILABLE: '판매중',
  RESERVED: '예약중',
  SOLD: '판매완료',
  UNAVAILABLE: '비활성',
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
}

function onSearch() {
  page.value = 1;
  refresh();
}

watch([status, category], () => {
  page.value = 1;
  refresh();
});

function productName(row: any) {
  const model = row.model?.name || '';
  const storage = row.variant?.storage || '';
  const color = row.variant?.color || '';
  return [model, storage, color].filter(Boolean).join(' ') || '-';
}

const columns = [
  { key: 'id', label: 'ID', class: 'w-12' },
  { key: 'productName', label: '상품명' },
  { key: 'categoryName', label: '카테고리' },
  { key: 'grade', label: '등급' },
  { key: 'sellingPrice', label: '가격', class: 'text-right' },
  { key: 'status', label: '상태' },
  { key: 'actions', label: '', class: 'w-20' },
];
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">상품 관리</h1>
      <UButton
        to="/products/create"
        icon="i-heroicons-plus"
        label="상품 등록"
      />
    </div>

    <!-- 필터 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <div class="flex flex-wrap gap-3">
        <UInput
          v-model="search"
          placeholder="상품명 검색..."
          icon="i-heroicons-magnifying-glass"
          class="w-64"
          @keyup.enter="onSearch"
        />
        <USelect v-model="status" :options="statusOptions" value-attribute="value" option-attribute="label" />
        <USelect v-model="category" :options="categoryOptions" value-attribute="value" option-attribute="label" />
      </div>
    </div>

    <!-- 테이블 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <UTable :columns="columns" :rows="data?.data || []" :loading="pending">
        <template #productName-data="{ row }">
          <NuxtLink :to="`/products/${row.id}`" class="text-sm font-medium text-primary-600 hover:underline">
            {{ productName(row) }}
          </NuxtLink>
        </template>
        <template #categoryName-data="{ row }">
          <span class="text-sm text-gray-600">{{ row.category?.name || '-' }}</span>
        </template>
        <template #grade-data="{ row }">
          <UBadge variant="subtle" size="xs">{{ row.grade }}</UBadge>
        </template>
        <template #sellingPrice-data="{ row }">
          <span class="text-sm font-medium">{{ formatPrice(row.sellingPrice) }}</span>
        </template>
        <template #status-data="{ row }">
          <UBadge :color="statusColors[row.status] || 'gray'" variant="subtle" size="xs">
            {{ statusLabels[row.status] || row.status }}
          </UBadge>
        </template>
        <template #actions-data="{ row }">
          <UButton
            :to="`/products/${row.id}`"
            variant="ghost"
            color="gray"
            icon="i-heroicons-pencil-square"
            size="xs"
          />
        </template>
      </UTable>

      <!-- 페이지네이션 -->
      <div v-if="data?.meta" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <p class="text-sm text-gray-500">
          총 {{ data.meta.total }}건 중 {{ (page - 1) * limit + 1 }}-{{ Math.min(page * limit, data.meta.total) }}
        </p>
        <UPagination v-model="page" :total="data.meta.total" :page-count="limit" @update:model-value="refresh" />
      </div>
    </div>
  </div>
</template>
