<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'admin-auth',
});

useHead({ title: '관리자 로그인' });

const authStore = useAuthStore();
const toast = useToast();

const form = reactive({
  email: '',
  password: '',
});
const isSubmitting = ref(false);

async function handleLogin() {
  if (!form.email || !form.password) {
    toast.add({ title: '이메일과 비밀번호를 입력해주세요.', color: 'red' });
    return;
  }

  isSubmitting.value = true;
  try {
    await authStore.login(form.email, form.password);
    toast.add({ title: '로그인 성공', color: 'green' });
    await navigateTo('/');
  } catch (error: any) {
    const message = error?.message || error?.data?.message || '로그인에 실패했습니다.';
    toast.add({ title: message, color: 'red' });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="w-full max-w-sm">
    <div class="bg-white rounded-xl shadow-lg p-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-heroicons-cog-6-tooth" class="w-7 h-7 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900">폰마켓 관리자</h1>
        <p class="text-sm text-gray-500 mt-1">관리자 계정으로 로그인하세요</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <UFormGroup label="이메일">
          <UInput
            v-model="form.email"
            type="email"
            placeholder="admin@phonegabi.com"
            icon="i-heroicons-envelope"
            size="lg"
          />
        </UFormGroup>

        <UFormGroup label="비밀번호">
          <UInput
            v-model="form.password"
            type="password"
            placeholder="비밀번호 입력"
            icon="i-heroicons-lock-closed"
            size="lg"
          />
        </UFormGroup>

        <UButton
          type="submit"
          block
          size="lg"
          :loading="isSubmitting"
          label="로그인"
        />
      </form>
    </div>
  </div>
</template>
