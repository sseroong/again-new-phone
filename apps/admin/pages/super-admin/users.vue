<script setup lang="ts">
definePageMeta({ middleware: ['admin-auth', 'super-admin'] });
useHead({ title: '전체 사용자 관리' });

const toast = useToast();
const apiFetch = useAdminFetch();

const page = ref(1);
const limit = ref(20);
const search = ref('');
const role = ref('');
const tenantFilter = ref('');

const queryString = computed(() => {
  const params = new URLSearchParams();
  params.set('page', String(page.value));
  params.set('limit', String(limit.value));
  if (search.value) params.set('search', search.value);
  if (role.value) params.set('role', role.value);
  if (tenantFilter.value) params.set('tenantId', tenantFilter.value);
  return `/super-admin/users?${params.toString()}`;
});

const { data, pending, refresh } = useAdminApi<any>(queryString);

// 테넌트 목록 (필터용)
const { data: tenantsData } = useAdminApi<any>('/super-admin/tenants?limit=100');
const tenantOptions = computed(() => {
  const options = [{ label: '전체 테넌트', value: '' }];
  if (tenantsData.value?.data) {
    for (const t of tenantsData.value.data) {
      options.push({ label: t.name, value: t.id });
    }
  }
  return options;
});

const roleOptions = [
  { label: '전체 역할', value: '' },
  { label: '일반 회원', value: 'USER' },
  { label: '파트너', value: 'PARTNER' },
  { label: '관리자', value: 'ADMIN' },
  { label: '최고관리자', value: 'SUPER_ADMIN' },
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

watch([role, tenantFilter], () => { page.value = 1; refresh(); });

// 할당 모달
const showAssignModal = ref(false);
const assignTarget = ref<any>(null);
const assignForm = reactive({
  tenantId: '',
  role: 'USER',
});
const isAssigning = ref(false);

function openAssignModal(user: any) {
  assignTarget.value = user;
  assignForm.tenantId = '';
  assignForm.role = 'USER';
  showAssignModal.value = true;
}

async function handleAssign() {
  if (!assignForm.tenantId) {
    toast.add({ title: '테넌트를 선택해주세요.', color: 'red' });
    return;
  }

  isAssigning.value = true;
  try {
    await apiFetch(`/super-admin/users/${assignTarget.value.id}/assign`, {
      method: 'POST',
      body: { tenantId: assignForm.tenantId, role: assignForm.role },
    });
    toast.add({ title: '테넌트에 할당되었습니다.', color: 'green' });
    showAssignModal.value = false;
    refresh();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '할당 실패', color: 'red' });
  } finally {
    isAssigning.value = false;
  }
}

async function handleRemoveTenant(userId: string, tenantId: string, tenantName: string) {
  if (!confirm(`${tenantName} 테넌트에서 사용자를 해제하시겠습니까?`)) return;

  try {
    await apiFetch(`/super-admin/users/${userId}/tenants/${tenantId}`, {
      method: 'DELETE',
    });
    toast.add({ title: '테넌트에서 해제되었습니다.', color: 'green' });
    refresh();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '해제 실패', color: 'red' });
  }
}

const assignTenantOptions = computed(() => {
  if (!tenantsData.value?.data) return [];
  return tenantsData.value.data.map((t: any) => ({ label: t.name, value: t.id }));
});

const assignRoleOptions = [
  { label: '일반 회원', value: 'USER' },
  { label: '파트너', value: 'PARTNER' },
  { label: '관리자', value: 'ADMIN' },
];

const columns = [
  { key: 'name', label: '이름' },
  { key: 'email', label: '이메일' },
  { key: 'role', label: '역할' },
  { key: 'tenants', label: '소속 테넌트' },
  { key: 'isActive', label: '상태' },
  { key: 'createdAt', label: '가입일' },
  { key: 'actions', label: '', class: 'w-24' },
];
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">전체 사용자 관리</h1>

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
        <USelect v-model="tenantFilter" :options="tenantOptions" value-attribute="value" option-attribute="label" />
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <UTable :columns="columns" :rows="data?.data || []" :loading="pending">
        <template #name-data="{ row }">
          <span class="text-sm font-medium">{{ row.name }}</span>
        </template>
        <template #email-data="{ row }">
          <span class="text-sm text-gray-600">{{ row.email }}</span>
        </template>
        <template #role-data="{ row }">
          <UBadge :color="roleColors[row.role] || 'gray'" variant="subtle" size="xs">
            {{ roleLabels[row.role] || row.role }}
          </UBadge>
        </template>
        <template #tenants-data="{ row }">
          <div class="flex flex-wrap gap-1">
            <UBadge
              v-for="ut in row.tenants"
              :key="ut.tenant?.id"
              color="primary"
              variant="subtle"
              size="xs"
              class="cursor-pointer"
              @click="handleRemoveTenant(row.id, ut.tenant?.id, ut.tenant?.name)"
            >
              {{ ut.tenant?.name }}
              <UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-0.5" />
            </UBadge>
            <span v-if="!row.tenants?.length" class="text-xs text-gray-400">미소속</span>
          </div>
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
          <UButton variant="ghost" color="primary" icon="i-heroicons-plus" size="xs" label="할당" @click="openAssignModal(row)" />
        </template>
      </UTable>

      <div v-if="data?.meta" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <p class="text-sm text-gray-500">총 {{ data.meta.total }}건</p>
        <UPagination v-model="page" :total="data.meta.total" :page-count="limit" @update:model-value="refresh" />
      </div>
    </div>

    <!-- 할당 모달 -->
    <UModal v-model="showAssignModal">
      <div class="p-6 space-y-4">
        <h3 class="text-lg font-semibold">테넌트 할당</h3>
        <p class="text-sm text-gray-500">
          <strong>{{ assignTarget?.name }}</strong> ({{ assignTarget?.email }})을(를) 테넌트에 할당합니다.
        </p>

        <UFormGroup label="테넌트">
          <USelect v-model="assignForm.tenantId" :options="assignTenantOptions" value-attribute="value" option-attribute="label" placeholder="테넌트 선택" />
        </UFormGroup>

        <UFormGroup label="역할">
          <USelect v-model="assignForm.role" :options="assignRoleOptions" value-attribute="value" option-attribute="label" />
        </UFormGroup>

        <div class="flex gap-3 pt-2">
          <UButton label="할당" :loading="isAssigning" @click="handleAssign" />
          <UButton variant="outline" label="취소" @click="showAssignModal = false" />
        </div>
      </div>
    </UModal>
  </div>
</template>
