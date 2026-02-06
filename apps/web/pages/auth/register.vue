<script setup lang="ts">
definePageMeta({
  middleware: ['guest'],
});

const authStore = useAuthStore();
const router = useRouter();

const form = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirm: '',
  agreeTerms: false,
});

const error = ref('');

const handleRegister = async () => {
  error.value = '';

  if (!form.name || !form.email || !form.password) {
    error.value = '필수 항목을 모두 입력해주세요.';
    return;
  }

  if (form.password.length < 8) {
    error.value = '비밀번호는 8자 이상이어야 합니다.';
    return;
  }

  if (form.password !== form.passwordConfirm) {
    error.value = '비밀번호가 일치하지 않습니다.';
    return;
  }

  if (!form.agreeTerms) {
    error.value = '이용약관에 동의해주세요.';
    return;
  }

  try {
    await authStore.register({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
    });
    router.push('/');
  } catch (e: any) {
    error.value = e?.data?.message || '회원가입에 실패했습니다.';
  }
};
</script>

<template>
  <div class="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-900">회원가입</h1>
        <p class="mt-2 text-sm text-gray-600">
          이미 계정이 있으신가요?
          <NuxtLink to="/auth/login" class="text-primary-600 hover:text-primary-500 font-medium">
            로그인
          </NuxtLink>
        </p>
      </div>

      <UCard>
        <form @submit.prevent="handleRegister" class="space-y-4">
          <UAlert
            v-if="error"
            color="red"
            variant="soft"
            :title="error"
            icon="i-heroicons-exclamation-triangle"
          />

          <UFormGroup label="이름" required>
            <UInput
              v-model="form.name"
              placeholder="이름을 입력하세요"
              icon="i-heroicons-user"
              size="lg"
              autocomplete="name"
            />
          </UFormGroup>

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

          <UFormGroup label="전화번호">
            <UInput
              v-model="form.phone"
              type="tel"
              placeholder="010-0000-0000"
              icon="i-heroicons-phone"
              size="lg"
              autocomplete="tel"
            />
          </UFormGroup>

          <UFormGroup label="비밀번호" required hint="8자 이상">
            <UInput
              v-model="form.password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              icon="i-heroicons-lock-closed"
              size="lg"
              autocomplete="new-password"
            />
          </UFormGroup>

          <UFormGroup label="비밀번호 확인" required>
            <UInput
              v-model="form.passwordConfirm"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              icon="i-heroicons-lock-closed"
              size="lg"
              autocomplete="new-password"
            />
          </UFormGroup>

          <div class="flex items-start gap-2">
            <UCheckbox v-model="form.agreeTerms" />
            <span class="text-sm text-gray-600">
              <NuxtLink to="/terms" class="text-primary-600 hover:underline">이용약관</NuxtLink>
              및
              <NuxtLink to="/privacy" class="text-primary-600 hover:underline">개인정보 처리방침</NuxtLink>에
              동의합니다.
            </span>
          </div>

          <UButton
            type="submit"
            block
            size="lg"
            :loading="authStore.isLoading"
          >
            회원가입
          </UButton>
        </form>
      </UCard>
    </div>
  </div>
</template>
