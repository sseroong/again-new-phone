<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });
useHead({ title: '회원 관리' });

const page = ref(1);
const limit = ref(20);
const search = ref('');
const role = ref('');
const isActive = ref('');

const queryString = computed(() => {
  const params = new URLSearchParams();
  params.set('page', String(page.value));
  params.set('limit', String(limit.value));
  if (search.value) params.set('search', search.value);
  if (role.value) params.set('role', role.value);
  if (isActive.value) params.set('isActive', isActive.value);
  return `/admin/users?${params.toString()}`;
});

const { data, pending, refresh } = useAdminApi<any>(queryString);

const roleOptions = [
  { label: '전체 역할', value: '' },
  { label: '일반 회원', value: 'USER' },
  { label: '파트너', value: 'PARTNER' },
  { label: '관리자', value: 'ADMIN' },
  { label: '최고관리자', value: 'SUPER_ADMIN' },
];

const activeOptions = [
  { label: '전체', value: '' },
  { label: '활성', value: 'true' },
  { label: '비활성', value: 'false' },
];

const roleColors: Record<string, string> = {
  USER: 'gray',
  PARTNER: 'blue',
  ADMIN: 'orange',
  SUPER_ADMIN: 'red',
};

const roleLabels: Record<string, string> = {
  USER: '일반',
  PARTNER: '파트너',
  ADMIN: '관리자',
  SUPER_ADMIN: '최고관리자',
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ko-KR');
}

function onSearch() {
  page.value = 1;
  refresh();
}

watch([role, isActive], () => { page.value = 1; refresh(); });

const columns = [
  { key: 'name', label: '이름' },
  { key: 'email', label: '이메일' },
  { key: 'role', label: '역할' },
  { key: 'isActive', label: '상태' },
  { key: 'createdAt', label: '가입일' },
  { key: 'actions', label: '', class: 'w-20' },
];
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">회원 관리</h1>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <div class="flex flex-wrap gap-3">
        <UInput
          v-model="search"
          placeholder="이름, 이메일 검색..."
          icon="i-heroicons-magnifying-glass"
          class="w-64"
          @keyup.enter="onSearch"
        />
        <USelect v-model="role" :options="roleOptions" value-attribute="value" option-attribute="label" />
        <USelect v-model="isActive" :options="activeOptions" value-attribute="value" option-attribute="label" />
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <UTable :columns="columns" :rows="data?.data || []" :loading="pending">
        <template #name-data="{ row }">
          <NuxtLink :to="`/users/${row.id}`" class="text-sm font-medium text-primary-600 hover:underline">
            {{ row.name }}
          </NuxtLink>
        </template>
        <template #email-data="{ row }">
          <span class="text-sm text-gray-600">{{ row.email }}</span>
        </template>
        <template #role-data="{ row }">
          <UBadge :color="roleColors[row.role] || 'gray'" variant="subtle" size="xs">
            {{ roleLabels[row.role] || row.role }}
          </UBadge>
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
          <UButton :to="`/users/${row.id}`" variant="ghost" color="gray" icon="i-heroicons-eye" size="xs" />
        </template>
      </UTable>

      <div v-if="data?.meta" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <p class="text-sm text-gray-500">총 {{ data.meta.total }}건</p>
        <UPagination v-model="page" :total="data.meta.total" :page-count="limit" @update:model-value="refresh" />
      </div>
    </div>
  </div>
</template>
