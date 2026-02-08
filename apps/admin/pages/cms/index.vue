<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });
useHead({ title: 'CMS 관리' });

const route = useRoute();

const page = ref(Number(route.query.page) || 1);
const limit = ref(20);
const search = ref((route.query.search as string) || '');
const type = ref((route.query.type as string) || '');
const status = ref((route.query.status as string) || '');

const queryString = computed(() => {
  const params = new URLSearchParams();
  params.set('page', String(page.value));
  params.set('limit', String(limit.value));
  if (search.value) params.set('search', search.value);
  if (type.value) params.set('type', type.value);
  if (status.value) params.set('status', status.value);
  return `/admin/cms/contents?${params.toString()}`;
});

const { data, pending, refresh } = useAdminApi<any>(queryString);

const typeOptions = [
  { label: '전체 유형', value: '' },
  { label: '공지사항', value: 'NOTICE' },
  { label: '이벤트', value: 'EVENT' },
  { label: 'FAQ', value: 'FAQ' },
  { label: '이용가이드', value: 'GUIDE' },
];

const statusOptions = [
  { label: '전체 상태', value: '' },
  { label: '초안', value: 'DRAFT' },
  { label: '게시됨', value: 'PUBLISHED' },
  { label: '보관됨', value: 'ARCHIVED' },
];

const typeColors: Record<string, string> = {
  NOTICE: 'blue',
  EVENT: 'purple',
  FAQ: 'green',
  GUIDE: 'orange',
};

const typeLabels: Record<string, string> = {
  NOTICE: '공지',
  EVENT: '이벤트',
  FAQ: 'FAQ',
  GUIDE: '가이드',
};

const statusColors: Record<string, string> = {
  DRAFT: 'gray',
  PUBLISHED: 'green',
  ARCHIVED: 'red',
};

const statusLabels: Record<string, string> = {
  DRAFT: '초안',
  PUBLISHED: '게시됨',
  ARCHIVED: '보관됨',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

function onSearch() {
  page.value = 1;
  refresh();
}

watch([type, status], () => {
  page.value = 1;
  refresh();
});

const columns = [
  { key: 'type', label: '유형', class: 'w-20' },
  { key: 'title', label: '제목' },
  { key: 'status', label: '상태', class: 'w-20' },
  { key: 'author', label: '작성자', class: 'w-24' },
  { key: 'viewCount', label: '조회수', class: 'w-20 text-right' },
  { key: 'createdAt', label: '작성일', class: 'w-28' },
  { key: 'actions', label: '', class: 'w-20' },
];
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">CMS 관리</h1>
      <div class="flex gap-2">
        <UButton
          to="/cms/banners"
          variant="outline"
          icon="i-heroicons-photo"
          label="배너 관리"
        />
        <UButton
          to="/cms/create"
          icon="i-heroicons-plus"
          label="콘텐츠 등록"
        />
      </div>
    </div>

    <!-- 필터 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <div class="flex flex-wrap gap-3">
        <UInput
          v-model="search"
          placeholder="제목 검색..."
          icon="i-heroicons-magnifying-glass"
          class="w-64"
          @keyup.enter="onSearch"
        />
        <USelect v-model="type" :options="typeOptions" value-attribute="value" option-attribute="label" />
        <USelect v-model="status" :options="statusOptions" value-attribute="value" option-attribute="label" />
      </div>
    </div>

    <!-- 테이블 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <UTable :columns="columns" :rows="data?.data || []" :loading="pending">
        <template #type-data="{ row }">
          <UBadge :color="typeColors[row.type] || 'gray'" variant="subtle" size="xs">
            {{ typeLabels[row.type] || row.type }}
          </UBadge>
        </template>
        <template #title-data="{ row }">
          <NuxtLink :to="`/cms/${row.id}`" class="text-sm font-medium text-primary-600 hover:underline">
            <UIcon v-if="row.isPinned" name="i-heroicons-bookmark-solid" class="w-3.5 h-3.5 text-yellow-500 mr-1 inline" />
            {{ row.title }}
          </NuxtLink>
        </template>
        <template #status-data="{ row }">
          <UBadge :color="statusColors[row.status] || 'gray'" variant="subtle" size="xs">
            {{ statusLabels[row.status] || row.status }}
          </UBadge>
        </template>
        <template #author-data="{ row }">
          <span class="text-sm text-gray-600">{{ row.author?.name || '-' }}</span>
        </template>
        <template #viewCount-data="{ row }">
          <span class="text-sm text-gray-600">{{ row.viewCount ?? 0 }}</span>
        </template>
        <template #createdAt-data="{ row }">
          <span class="text-sm text-gray-500">{{ formatDate(row.createdAt) }}</span>
        </template>
        <template #actions-data="{ row }">
          <UButton
            :to="`/cms/${row.id}`"
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
