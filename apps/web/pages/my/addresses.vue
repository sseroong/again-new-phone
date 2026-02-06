<script setup lang="ts">
definePageMeta({ middleware: ['auth'] });
useHead({ title: '배송지 관리' });

const authStore = useAuthStore();
const toast = useToast();
const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;

const authHeaders = computed(() => ({
  Authorization: `Bearer ${authStore.tokens?.accessToken}`,
}));

// 배송지 목록
const { data: addressesData, refresh } = await useAsyncData(
  'my-addresses',
  () => $fetch<any[]>(`${apiBase}/users/me/addresses`, { headers: authHeaders.value }),
);

const addresses = computed(() => addressesData.value || []);

// 추가/수정 모달
const showModal = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({
  name: '',
  phone: '',
  zipCode: '',
  address: '',
  addressDetail: '',
  isDefault: false,
});
const isSubmitting = ref(false);

function openAdd() {
  editingId.value = null;
  Object.assign(form, { name: '', phone: '', zipCode: '', address: '', addressDetail: '', isDefault: false });
  showModal.value = true;
}

function openEdit(addr: any) {
  editingId.value = addr.id;
  Object.assign(form, {
    name: addr.name || '',
    phone: addr.phone || '',
    zipCode: addr.zipCode || '',
    address: addr.address || '',
    addressDetail: addr.addressDetail || '',
    isDefault: addr.isDefault || false,
  });
  showModal.value = true;
}

async function handleSubmit() {
  if (!form.name || !form.phone || !form.address) {
    toast.add({ title: '필수 항목을 입력해주세요.', color: 'red' });
    return;
  }
  isSubmitting.value = true;
  try {
    if (editingId.value) {
      await $fetch(`${apiBase}/users/me/addresses/${editingId.value}`, {
        method: 'PATCH',
        headers: authHeaders.value,
        body: form,
      });
      toast.add({ title: '배송지가 수정되었습니다.', color: 'green' });
    } else {
      await $fetch(`${apiBase}/users/me/addresses`, {
        method: 'POST',
        headers: authHeaders.value,
        body: form,
      });
      toast.add({ title: '배송지가 추가되었습니다.', color: 'green' });
    }
    showModal.value = false;
    refresh();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '저장에 실패했습니다.', color: 'red' });
  } finally {
    isSubmitting.value = false;
  }
}

async function handleDelete(addressId: string) {
  if (!confirm('배송지를 삭제하시겠습니까?')) return;
  try {
    await $fetch(`${apiBase}/users/me/addresses/${addressId}`, {
      method: 'DELETE',
      headers: authHeaders.value,
    });
    toast.add({ title: '배송지가 삭제되었습니다.', color: 'green' });
    refresh();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '삭제에 실패했습니다.', color: 'red' });
  }
}

async function setDefault(addressId: string) {
  try {
    await $fetch(`${apiBase}/users/me/addresses/${addressId}/default`, {
      method: 'POST',
      headers: authHeaders.value,
    });
    toast.add({ title: '기본 배송지가 설정되었습니다.', color: 'green' });
    refresh();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '설정에 실패했습니다.', color: 'red' });
  }
}
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold">배송지 관리</h1>
        <nav class="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <NuxtLink to="/" class="hover:text-gray-700">HOME</NuxtLink>
          <span>></span>
          <span class="text-gray-900">배송지 관리</span>
        </nav>
      </div>
    </div>

    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex items-center justify-between mb-6">
        <p class="text-sm text-gray-500">총 {{ addresses.length }}개</p>
        <UButton icon="i-heroicons-plus" label="배송지 추가" @click="openAdd" />
      </div>

      <!-- 배송지 목록 -->
      <div v-if="!addresses.length" class="text-center py-12 bg-white rounded-xl border border-gray-100">
        <UIcon name="i-heroicons-map-pin" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p class="text-gray-500">등록된 배송지가 없습니다.</p>
        <UButton variant="outline" label="배송지 추가" class="mt-4" @click="openAdd" />
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="addr in addresses"
          :key="addr.id"
          class="bg-white rounded-xl p-5 border border-gray-100"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-medium">{{ addr.name }}</span>
                <UBadge v-if="addr.isDefault" color="primary" variant="subtle" size="xs">기본</UBadge>
              </div>
              <p class="text-sm text-gray-600">{{ addr.phone }}</p>
              <p class="text-sm text-gray-600 mt-1">
                <span v-if="addr.zipCode">({{ addr.zipCode }}) </span>
                {{ addr.address }}
                <span v-if="addr.addressDetail"> {{ addr.addressDetail }}</span>
              </p>
            </div>

            <div class="flex gap-1 ml-4">
              <UButton v-if="!addr.isDefault" variant="ghost" color="gray" size="xs" label="기본" @click="setDefault(addr.id)" />
              <UButton variant="ghost" color="gray" icon="i-heroicons-pencil" size="xs" @click="openEdit(addr)" />
              <UButton variant="ghost" color="red" icon="i-heroicons-trash" size="xs" @click="handleDelete(addr.id)" />
            </div>
          </div>
        </div>
      </div>

      <!-- 추가/수정 모달 -->
      <UModal v-model="showModal">
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4">
            {{ editingId ? '배송지 수정' : '배송지 추가' }}
          </h3>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <UFormGroup label="수령인" required>
              <UInput v-model="form.name" placeholder="수령인 이름" />
            </UFormGroup>
            <UFormGroup label="연락처" required>
              <UInput v-model="form.phone" placeholder="010-1234-5678" />
            </UFormGroup>
            <UFormGroup label="우편번호">
              <UInput v-model="form.zipCode" placeholder="12345" />
            </UFormGroup>
            <UFormGroup label="주소" required>
              <UInput v-model="form.address" placeholder="주소" />
            </UFormGroup>
            <UFormGroup label="상세주소">
              <UInput v-model="form.addressDetail" placeholder="상세주소" />
            </UFormGroup>
            <div class="flex items-center gap-2">
              <UToggle v-model="form.isDefault" />
              <span class="text-sm text-gray-600">기본 배송지로 설정</span>
            </div>
            <div class="flex gap-3 pt-4 border-t">
              <UButton type="submit" :label="editingId ? '수정' : '추가'" :loading="isSubmitting" />
              <UButton variant="outline" color="gray" label="취소" @click="showModal = false" />
            </div>
          </form>
        </div>
      </UModal>
    </div>
  </div>
</template>
