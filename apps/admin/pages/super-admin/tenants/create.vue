<script setup lang="ts">
definePageMeta({ middleware: ['admin-auth', 'super-admin'] });
useHead({ title: '테넌트 생성' });

const toast = useToast();
const apiFetch = useAdminFetch();
const isSubmitting = ref(false);

const form = reactive({
  name: '',
  slug: '',
  domain: '',
});

function generateSlug() {
  form.slug = form.name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[가-힣]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function handleSubmit() {
  if (!form.name || !form.slug) {
    toast.add({ title: '이름과 slug는 필수입니다.', color: 'red' });
    return;
  }

  if (!/^[a-z0-9-]+$/.test(form.slug)) {
    toast.add({ title: 'slug는 소문자, 숫자, 하이픈만 사용할 수 있습니다.', color: 'red' });
    return;
  }

  isSubmitting.value = true;
  try {
    const body: any = { name: form.name, slug: form.slug };
    if (form.domain) body.domain = form.domain;

    await apiFetch('/super-admin/tenants', {
      method: 'POST',
      body,
    });

    toast.add({ title: '테넌트가 생성되었습니다.', color: 'green' });
    navigateTo('/super-admin/tenants');
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '테넌트 생성 실패', color: 'red' });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <UButton to="/super-admin/tenants" variant="ghost" color="gray" icon="i-heroicons-arrow-left" />
      <h1 class="text-2xl font-bold text-gray-900">테넌트 생성</h1>
    </div>

    <form class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl space-y-6" @submit.prevent="handleSubmit">
      <UFormGroup label="테넌트 이름" required>
        <UInput v-model="form.name" placeholder="예: 폰마켓 부산점" @blur="!form.slug && generateSlug()" />
      </UFormGroup>

      <UFormGroup label="Slug (URL 식별자)" required hint="소문자, 숫자, 하이픈만 사용">
        <UInput v-model="form.slug" placeholder="예: phonmarket-busan" />
      </UFormGroup>

      <UFormGroup label="도메인 (선택)" hint="커스텀 도메인이 있으면 입력">
        <UInput v-model="form.domain" placeholder="예: busan.phonmarket.com" />
      </UFormGroup>

      <div class="flex gap-3 pt-4 border-t border-gray-100">
        <UButton type="submit" label="생성" :loading="isSubmitting" />
        <UButton to="/super-admin/tenants" variant="outline" label="취소" />
      </div>
    </form>
  </div>
</template>
