<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });

const route = useRoute();
const toast = useToast();
const apiFetch = useAdminFetch();
const id = route.params.id as string;

const { data: user, pending, refresh } = useAdminApi<any>(`/admin/users/${id}`);

useHead({ title: computed(() => user.value ? `${user.value.name} - 회원 상세` : '회원 상세') });

const editForm = reactive({
  role: '',
  isActive: true,
});

const isUpdating = ref(false);

watch(user, (val) => {
  if (val) {
    editForm.role = val.role || 'USER';
    editForm.isActive = val.isActive !== false;
  }
}, { immediate: true });

const roleOptions = [
  { label: '일반 회원', value: 'USER' },
  { label: '파트너', value: 'PARTNER' },
  { label: '관리자', value: 'ADMIN' },
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

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleString('ko-KR');
}

async function handleUpdate() {
  isUpdating.value = true;
  try {
    await apiFetch(`/admin/users/${id}`, {
      method: 'PATCH',
      body: editForm,
    });
    toast.add({ title: '회원 정보가 수정되었습니다.', color: 'green' });
    refresh();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '수정 실패', color: 'red' });
  } finally {
    isUpdating.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <UButton to="/users" variant="ghost" color="gray" icon="i-heroicons-arrow-left" />
      <h1 class="text-2xl font-bold text-gray-900">회원 상세</h1>
    </div>

    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

    <template v-else-if="user">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 회원 정보 -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-semibold text-gray-900">회원 정보</h2>
              <div class="flex gap-2">
                <UBadge :color="roleColors[user.role]" variant="subtle">
                  {{ roleLabels[user.role] }}
                </UBadge>
                <UBadge :color="user.isActive ? 'green' : 'red'" variant="subtle">
                  {{ user.isActive ? '활성' : '비활성' }}
                </UBadge>
              </div>
            </div>
            <dl class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt class="text-gray-500">이름</dt>
                <dd class="font-medium">{{ user.name }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">이메일</dt>
                <dd class="font-medium">{{ user.email }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">전화번호</dt>
                <dd>{{ user.phone || '-' }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">가입일</dt>
                <dd>{{ formatDate(user.createdAt) }}</dd>
              </div>
            </dl>
          </div>

          <!-- 거래 통계 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="font-semibold text-gray-900 mb-4">거래 통계</h2>
            <div class="grid grid-cols-3 gap-4">
              <div class="text-center p-4 bg-gray-50 rounded-lg">
                <p class="text-2xl font-bold text-gray-900">{{ user._count?.orders || 0 }}</p>
                <p class="text-sm text-gray-500">주문</p>
              </div>
              <div class="text-center p-4 bg-gray-50 rounded-lg">
                <p class="text-2xl font-bold text-gray-900">{{ user._count?.sellRequests || 0 }}</p>
                <p class="text-sm text-gray-500">판매접수</p>
              </div>
              <div class="text-center p-4 bg-gray-50 rounded-lg">
                <p class="text-2xl font-bold text-gray-900">{{ user._count?.reviews || 0 }}</p>
                <p class="text-sm text-gray-500">리뷰</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 역할/상태 관리 -->
        <div class="space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="font-semibold text-gray-900 mb-4">역할 및 상태 관리</h2>

            <div v-if="user.role === 'SUPER_ADMIN'" class="text-sm text-gray-400">
              최고관리자의 역할은 변경할 수 없습니다.
            </div>

            <div v-else class="space-y-4">
              <UFormGroup label="역할">
                <USelect v-model="editForm.role" :options="roleOptions" value-attribute="value" option-attribute="label" />
              </UFormGroup>

              <UFormGroup label="활성 상태">
                <UToggle v-model="editForm.isActive" />
                <span class="ml-2 text-sm text-gray-600">
                  {{ editForm.isActive ? '활성' : '비활성' }}
                </span>
              </UFormGroup>

              <UButton
                label="저장"
                block
                :loading="isUpdating"
                @click="handleUpdate"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
