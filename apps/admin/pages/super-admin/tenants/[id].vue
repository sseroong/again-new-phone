<script setup lang="ts">
definePageMeta({ middleware: ['admin-auth', 'super-admin'] });

const route = useRoute();
const toast = useToast();
const apiFetch = useAdminFetch();
const id = route.params.id as string;

const { data: tenant, pending, refresh } = useAdminApi<any>(`/super-admin/tenants/${id}`);

useHead({ title: computed(() => tenant.value ? `${tenant.value.name} - 테넌트 상세` : '테넌트 상세') });

const editForm = reactive({
  name: '',
  slug: '',
  domain: '',
  isActive: true,
});

const isUpdating = ref(false);

watch(tenant, (val) => {
  if (val) {
    editForm.name = val.name || '';
    editForm.slug = val.slug || '';
    editForm.domain = val.domain || '';
    editForm.isActive = val.isActive !== false;
  }
}, { immediate: true });

const roleLabels: Record<string, string> = {
  USER: '일반',
  PARTNER: '파트너',
  ADMIN: '관리자',
  SUPER_ADMIN: '최고관리자',
};

const roleColors: Record<string, string> = {
  USER: 'gray',
  PARTNER: 'blue',
  ADMIN: 'orange',
  SUPER_ADMIN: 'red',
};

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleString('ko-KR');
}

async function handleUpdate() {
  if (!editForm.name || !editForm.slug) {
    toast.add({ title: '이름과 slug는 필수입니다.', color: 'red' });
    return;
  }

  isUpdating.value = true;
  try {
    await apiFetch(`/super-admin/tenants/${id}`, {
      method: 'PATCH',
      body: {
        name: editForm.name,
        slug: editForm.slug,
        domain: editForm.domain || null,
        isActive: editForm.isActive,
      },
    });
    toast.add({ title: '테넌트가 수정되었습니다.', color: 'green' });
    refresh();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '수정 실패', color: 'red' });
  } finally {
    isUpdating.value = false;
  }
}

async function handleDeactivate() {
  if (!confirm('이 테넌트를 비활성화하시겠습니까?')) return;

  try {
    await apiFetch(`/super-admin/tenants/${id}`, { method: 'DELETE' });
    toast.add({ title: '테넌트가 비활성화되었습니다.', color: 'green' });
    navigateTo('/super-admin/tenants');
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '비활성화 실패', color: 'red' });
  }
}

const userColumns = [
  { key: 'name', label: '이름' },
  { key: 'email', label: '이메일' },
  { key: 'role', label: '테넌트 역할' },
  { key: 'joinedAt', label: '가입일' },
];
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <UButton to="/super-admin/tenants" variant="ghost" color="gray" icon="i-heroicons-arrow-left" />
        <h1 class="text-2xl font-bold text-gray-900">테넌트 상세</h1>
      </div>
      <UButton
        v-if="tenant?.isActive"
        color="red"
        variant="outline"
        icon="i-heroicons-trash"
        label="비활성화"
        @click="handleDeactivate"
      />
    </div>

    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

    <template v-else-if="tenant">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 테넌트 정보 -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-semibold text-gray-900">테넌트 정보</h2>
              <UBadge :color="tenant.isActive ? 'green' : 'red'" variant="subtle">
                {{ tenant.isActive ? '활성' : '비활성' }}
              </UBadge>
            </div>
            <dl class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt class="text-gray-500">ID</dt>
                <dd class="font-mono text-xs">{{ tenant.id }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">Slug</dt>
                <dd><code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{{ tenant.slug }}</code></dd>
              </div>
              <div>
                <dt class="text-gray-500">도메인</dt>
                <dd>{{ tenant.domain || '-' }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">생성일</dt>
                <dd>{{ formatDate(tenant.createdAt) }}</dd>
              </div>
            </dl>
          </div>

          <!-- 소속 사용자 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="px-6 py-4 border-b border-gray-100">
              <h2 class="font-semibold text-gray-900">소속 사용자 ({{ tenant.users?.length || 0 }}명)</h2>
            </div>
            <UTable :columns="userColumns" :rows="tenant.users || []">
              <template #name-data="{ row }">
                <span class="text-sm font-medium">{{ row.user?.name }}</span>
              </template>
              <template #email-data="{ row }">
                <span class="text-sm text-gray-500">{{ row.user?.email }}</span>
              </template>
              <template #role-data="{ row }">
                <UBadge :color="roleColors[row.role] || 'gray'" variant="subtle" size="xs">
                  {{ roleLabels[row.role] || row.role }}
                </UBadge>
              </template>
              <template #joinedAt-data="{ row }">
                <span class="text-sm text-gray-500">{{ formatDate(row.joinedAt) }}</span>
              </template>
            </UTable>
            <div v-if="!tenant.users?.length" class="px-6 py-8 text-center text-sm text-gray-400">
              소속 사용자가 없습니다
            </div>
          </div>
        </div>

        <!-- 수정 폼 -->
        <div class="space-y-6">
          <form class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4" @submit.prevent="handleUpdate">
            <h2 class="font-semibold text-gray-900">테넌트 수정</h2>

            <UFormGroup label="이름">
              <UInput v-model="editForm.name" />
            </UFormGroup>

            <UFormGroup label="Slug">
              <UInput v-model="editForm.slug" />
            </UFormGroup>

            <UFormGroup label="도메인">
              <UInput v-model="editForm.domain" placeholder="선택사항" />
            </UFormGroup>

            <UFormGroup label="활성 상태">
              <UToggle v-model="editForm.isActive" />
              <span class="ml-2 text-sm text-gray-600">
                {{ editForm.isActive ? '활성' : '비활성' }}
              </span>
            </UFormGroup>

            <UButton type="submit" label="저장" block :loading="isUpdating" />
          </form>
        </div>
      </div>
    </template>
  </div>
</template>
