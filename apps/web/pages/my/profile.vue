<script setup lang="ts">
definePageMeta({ middleware: ['auth'] });
useHead({ title: '프로필 수정' });

const authStore = useAuthStore();
const toast = useToast();
const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;

const authHeaders = computed(() => ({
  Authorization: `Bearer ${authStore.tokens?.accessToken}`,
}));

// 프로필 폼
const profileForm = reactive({
  name: authStore.user?.name || '',
  phone: authStore.user?.phone || '',
});
const isProfileSubmitting = ref(false);

// 비밀번호 폼
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const isPasswordSubmitting = ref(false);

// 유저 정보 동기화
watch(() => authStore.user, (user) => {
  if (user) {
    profileForm.name = user.name || '';
    profileForm.phone = (user as any).phone || '';
  }
}, { immediate: true });

async function handleProfileUpdate() {
  if (!profileForm.name) {
    toast.add({ title: '이름을 입력해주세요.', color: 'red' });
    return;
  }
  isProfileSubmitting.value = true;
  try {
    const updated = await $fetch<any>(`${apiBase}/users/me`, {
      method: 'PATCH',
      headers: authHeaders.value,
      body: profileForm,
    });
    authStore.setUser(updated);
    toast.add({ title: '프로필이 수정되었습니다.', color: 'green' });
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '수정에 실패했습니다.', color: 'red' });
  } finally {
    isProfileSubmitting.value = false;
  }
}

async function handlePasswordChange() {
  if (!passwordForm.currentPassword || !passwordForm.newPassword) {
    toast.add({ title: '현재 비밀번호와 새 비밀번호를 입력해주세요.', color: 'red' });
    return;
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toast.add({ title: '새 비밀번호가 일치하지 않습니다.', color: 'red' });
    return;
  }
  if (passwordForm.newPassword.length < 8) {
    toast.add({ title: '비밀번호는 8자 이상이어야 합니다.', color: 'red' });
    return;
  }

  isPasswordSubmitting.value = true;
  try {
    await $fetch(`${apiBase}/users/me/password`, {
      method: 'POST',
      headers: authHeaders.value,
      body: {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      },
    });
    toast.add({ title: '비밀번호가 변경되었습니다.', color: 'green' });
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '비밀번호 변경에 실패했습니다.', color: 'red' });
  } finally {
    isPasswordSubmitting.value = false;
  }
}
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold">프로필 수정</h1>
        <nav class="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <NuxtLink to="/" class="hover:text-gray-700">HOME</NuxtLink>
          <span>></span>
          <span class="text-gray-900">프로필 수정</span>
        </nav>
      </div>
    </div>

    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <!-- 프로필 수정 -->
      <div class="bg-white rounded-xl p-6 border border-gray-100">
        <h2 class="text-lg font-semibold mb-4">기본 정보</h2>
        <form @submit.prevent="handleProfileUpdate" class="space-y-4">
          <UFormGroup label="이메일">
            <UInput :model-value="authStore.user?.email" disabled />
          </UFormGroup>

          <UFormGroup label="이름" required>
            <UInput v-model="profileForm.name" placeholder="이름" />
          </UFormGroup>

          <UFormGroup label="전화번호">
            <UInput v-model="profileForm.phone" placeholder="010-1234-5678" />
          </UFormGroup>

          <div class="pt-2">
            <UButton type="submit" label="저장" :loading="isProfileSubmitting" />
          </div>
        </form>
      </div>

      <!-- 비밀번호 변경 -->
      <div class="bg-white rounded-xl p-6 border border-gray-100">
        <h2 class="text-lg font-semibold mb-4">비밀번호 변경</h2>
        <form @submit.prevent="handlePasswordChange" class="space-y-4">
          <UFormGroup label="현재 비밀번호" required>
            <UInput v-model="passwordForm.currentPassword" type="password" placeholder="현재 비밀번호" />
          </UFormGroup>

          <UFormGroup label="새 비밀번호" required>
            <UInput v-model="passwordForm.newPassword" type="password" placeholder="새 비밀번호 (8자 이상)" />
          </UFormGroup>

          <UFormGroup label="새 비밀번호 확인" required>
            <UInput v-model="passwordForm.confirmPassword" type="password" placeholder="새 비밀번호 확인" />
          </UFormGroup>

          <div class="pt-2">
            <UButton type="submit" label="비밀번호 변경" color="gray" :loading="isPasswordSubmitting" />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
