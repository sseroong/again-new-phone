<script setup lang="ts">
definePageMeta({
  middleware: ['guest'],
});

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const form = reactive({
  email: '',
  password: '',
});

const error = ref('');

const handleLogin = async () => {
  error.value = '';

  if (!form.email || !form.password) {
    error.value = '이메일과 비밀번호를 입력해주세요.';
    return;
  }

  try {
    await authStore.login(form.email, form.password);
    const redirect = route.query.redirect as string;
    router.push(redirect || '/');
  } catch (e: any) {
    error.value = e?.data?.message || '로그인에 실패했습니다.';
  }
};
</script>

<template>
  <div class="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-900">로그인</h1>
        <p class="mt-2 text-sm text-gray-600">
          계정이 없으신가요?
          <NuxtLink to="/auth/register" class="text-primary-600 hover:text-primary-500 font-medium">
            회원가입
          </NuxtLink>
        </p>
      </div>

      <UCard>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <UAlert
            v-if="error"
            color="red"
            variant="soft"
            :title="error"
            icon="i-heroicons-exclamation-triangle"
          />

          <UFormGroup label="이메일" required>
            <UInput
              v-model="form.email"
              type="email"
              placeholder="이메일을 입력하세요"
              icon="i-heroicons-envelope"
              size="lg"
              autocomplete="email"
            />
          </UFormGroup>

          <UFormGroup label="비밀번호" required>
            <UInput
              v-model="form.password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              icon="i-heroicons-lock-closed"
              size="lg"
              autocomplete="current-password"
            />
          </UFormGroup>

          <UButton
            type="submit"
            block
            size="lg"
            :loading="authStore.isLoading"
          >
            로그인
          </UButton>
        </form>
      </UCard>
    </div>
  </div>
</template>
