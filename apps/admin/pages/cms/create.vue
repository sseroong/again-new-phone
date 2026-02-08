<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });
useHead({ title: '콘텐츠 등록' });

const toast = useToast();
const router = useRouter();
const apiFetch = useAdminFetch();

const form = reactive({
  type: 'NOTICE',
  title: '',
  content: '',
  answer: '',
  category: '',
  thumbnail: '',
  startDate: '',
  endDate: '',
  sortOrder: 0,
  isPinned: false,
  status: 'DRAFT',
});

const isSubmitting = ref(false);

const typeOptions = [
  { label: '공지사항', value: 'NOTICE' },
  { label: '이벤트', value: 'EVENT' },
  { label: 'FAQ', value: 'FAQ' },
  { label: '이용가이드', value: 'GUIDE' },
];

const statusOptions = [
  { label: '초안', value: 'DRAFT' },
  { label: '게시', value: 'PUBLISHED' },
];

const faqCategoryOptions = [
  { label: '선택하세요', value: '' },
  { label: '구매 관련', value: 'buy' },
  { label: '판매 관련', value: 'sell' },
  { label: '배송/수거', value: 'delivery' },
  { label: '결제/환불', value: 'payment' },
  { label: '기타', value: 'etc' },
];

const showContent = computed(() => ['NOTICE', 'EVENT', 'GUIDE'].includes(form.type));
const showAnswer = computed(() => form.type === 'FAQ');
const showCategory = computed(() => form.type === 'FAQ');
const showThumbnail = computed(() => form.type === 'EVENT');
const showDates = computed(() => form.type === 'EVENT');

async function handleSubmit() {
  if (!form.title.trim()) {
    toast.add({ title: '제목을 입력해주세요.', color: 'red' });
    return;
  }

  isSubmitting.value = true;
  try {
    await apiFetch('/admin/cms/contents', {
      method: 'POST',
      body: {
        type: form.type,
        title: form.title,
        content: showContent.value ? form.content || undefined : undefined,
        answer: showAnswer.value ? form.answer || undefined : undefined,
        category: showCategory.value ? form.category || undefined : undefined,
        thumbnail: showThumbnail.value ? form.thumbnail || undefined : undefined,
        startDate: showDates.value && form.startDate ? form.startDate : undefined,
        endDate: showDates.value && form.endDate ? form.endDate : undefined,
        sortOrder: form.sortOrder,
        isPinned: form.isPinned,
        status: form.status,
      },
    });
    toast.add({ title: '콘텐츠가 등록되었습니다.', color: 'green' });
    router.push('/cms');
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '등록에 실패했습니다.', color: 'red' });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <UButton to="/cms" variant="ghost" color="gray" icon="i-heroicons-arrow-left" />
      <h1 class="text-2xl font-bold text-gray-900">콘텐츠 등록</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 max-w-3xl">
      <!-- 유형 & 상태 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UFormGroup label="유형" required>
          <USelect v-model="form.type" :options="typeOptions" value-attribute="value" option-attribute="label" />
        </UFormGroup>
        <UFormGroup label="상태">
          <USelect v-model="form.status" :options="statusOptions" value-attribute="value" option-attribute="label" />
        </UFormGroup>
        <UFormGroup label="정렬 순서">
          <UInput v-model.number="form.sortOrder" type="number" min="0" />
        </UFormGroup>
      </div>

      <!-- 제목 -->
      <UFormGroup :label="form.type === 'FAQ' ? '질문' : '제목'" required>
        <UInput v-model="form.title" :placeholder="form.type === 'FAQ' ? '자주 묻는 질문을 입력하세요' : '제목을 입력하세요'" />
      </UFormGroup>

      <!-- 본문 (NOTICE, EVENT, GUIDE) -->
      <UFormGroup v-if="showContent" label="본문">
        <UTextarea v-model="form.content" rows="10" placeholder="본문 내용을 입력하세요" />
      </UFormGroup>

      <!-- FAQ 답변 -->
      <UFormGroup v-if="showAnswer" label="답변" required>
        <UTextarea v-model="form.answer" rows="6" placeholder="답변을 입력하세요" />
      </UFormGroup>

      <!-- FAQ 카테고리 -->
      <UFormGroup v-if="showCategory" label="카테고리">
        <USelect v-model="form.category" :options="faqCategoryOptions" value-attribute="value" option-attribute="label" />
      </UFormGroup>

      <!-- 이벤트 썸네일 -->
      <UFormGroup v-if="showThumbnail" label="썸네일 URL">
        <UInput v-model="form.thumbnail" placeholder="https://example.com/image.jpg" />
      </UFormGroup>

      <!-- 이벤트 기간 -->
      <div v-if="showDates" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UFormGroup label="시작일">
          <UInput v-model="form.startDate" type="date" />
        </UFormGroup>
        <UFormGroup label="종료일">
          <UInput v-model="form.endDate" type="date" />
        </UFormGroup>
      </div>

      <!-- 고정 여부 -->
      <div class="flex items-center gap-2">
        <input id="isPinned" v-model="form.isPinned" type="checkbox" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
        <label for="isPinned" class="text-sm text-gray-700">상단 고정</label>
      </div>

      <div class="flex gap-3 pt-4 border-t">
        <UButton type="submit" label="등록" :loading="isSubmitting" />
        <UButton to="/cms" variant="outline" color="gray" label="취소" />
      </div>
    </form>
  </div>
</template>
