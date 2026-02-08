<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });
useHead({ title: '콘텐츠 수정' });

const route = useRoute();
const router = useRouter();
const toast = useToast();
const apiFetch = useAdminFetch();
const id = route.params.id as string;

const { data: content, pending } = useAdminApi<any>(`/admin/cms/contents/${id}`);

const form = reactive({
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
const isDeleting = ref(false);

const statusOptions = [
  { label: '초안', value: 'DRAFT' },
  { label: '게시', value: 'PUBLISHED' },
  { label: '보관', value: 'ARCHIVED' },
];

const faqCategoryOptions = [
  { label: '선택하세요', value: '' },
  { label: '구매 관련', value: 'buy' },
  { label: '판매 관련', value: 'sell' },
  { label: '배송/수거', value: 'delivery' },
  { label: '결제/환불', value: 'payment' },
  { label: '기타', value: 'etc' },
];

const typeLabels: Record<string, string> = {
  NOTICE: '공지사항',
  EVENT: '이벤트',
  FAQ: 'FAQ',
  GUIDE: '이용가이드',
};

const typeColors: Record<string, string> = {
  NOTICE: 'blue',
  EVENT: 'purple',
  FAQ: 'green',
  GUIDE: 'orange',
};

watch(content, (val) => {
  if (val) {
    Object.assign(form, {
      title: val.title || '',
      content: val.content || '',
      answer: val.answer || '',
      category: val.category || '',
      thumbnail: val.thumbnail || '',
      startDate: val.startDate ? val.startDate.split('T')[0] : '',
      endDate: val.endDate ? val.endDate.split('T')[0] : '',
      sortOrder: val.sortOrder ?? 0,
      isPinned: val.isPinned ?? false,
      status: val.status || 'DRAFT',
    });
  }
}, { immediate: true });

const showContent = computed(() => content.value && ['NOTICE', 'EVENT', 'GUIDE'].includes(content.value.type));
const showAnswer = computed(() => content.value?.type === 'FAQ');
const showCategory = computed(() => content.value?.type === 'FAQ');
const showThumbnail = computed(() => content.value?.type === 'EVENT');
const showDates = computed(() => content.value?.type === 'EVENT');

async function handleUpdate() {
  isSubmitting.value = true;
  try {
    const body: Record<string, any> = {
      title: form.title,
      status: form.status,
      sortOrder: form.sortOrder,
      isPinned: form.isPinned,
    };

    if (showContent.value) body.content = form.content;
    if (showAnswer.value) body.answer = form.answer;
    if (showCategory.value) body.category = form.category;
    if (showThumbnail.value) body.thumbnail = form.thumbnail;
    if (showDates.value) {
      if (form.startDate) body.startDate = form.startDate;
      if (form.endDate) body.endDate = form.endDate;
    }

    await apiFetch(`/admin/cms/contents/${id}`, {
      method: 'PATCH',
      body,
    });
    toast.add({ title: '콘텐츠가 수정되었습니다.', color: 'green' });
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '수정에 실패했습니다.', color: 'red' });
  } finally {
    isSubmitting.value = false;
  }
}

async function handleDelete() {
  if (!confirm('이 콘텐츠를 보관 처리하시겠습니까?')) return;
  isDeleting.value = true;
  try {
    await apiFetch(`/admin/cms/contents/${id}`, { method: 'DELETE' });
    toast.add({ title: '콘텐츠가 보관 처리되었습니다.', color: 'green' });
    router.push('/cms');
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '처리에 실패했습니다.', color: 'red' });
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <UButton to="/cms" variant="ghost" color="gray" icon="i-heroicons-arrow-left" />
        <h1 class="text-2xl font-bold text-gray-900">콘텐츠 수정</h1>
      </div>
      <UButton
        color="red"
        variant="outline"
        icon="i-heroicons-archive-box"
        label="보관 처리"
        :loading="isDeleting"
        @click="handleDelete"
      />
    </div>

    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

    <template v-else-if="content">
      <!-- 콘텐츠 유형 (읽기 전용) -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 max-w-3xl">
        <dl class="grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt class="text-gray-500">유형</dt>
            <dd>
              <UBadge :color="typeColors[content.type] || 'gray'" variant="subtle">
                {{ typeLabels[content.type] || content.type }}
              </UBadge>
            </dd>
          </div>
          <div>
            <dt class="text-gray-500">작성자</dt>
            <dd class="font-medium">{{ content.author?.name || '-' }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">조회수</dt>
            <dd>{{ content.viewCount ?? 0 }}</dd>
          </div>
        </dl>
      </div>

      <!-- 수정 폼 -->
      <form @submit.prevent="handleUpdate" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 max-w-3xl">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UFormGroup label="상태">
            <USelect v-model="form.status" :options="statusOptions" value-attribute="value" option-attribute="label" />
          </UFormGroup>
          <UFormGroup label="정렬 순서">
            <UInput v-model.number="form.sortOrder" type="number" min="0" />
          </UFormGroup>
          <div class="flex items-end pb-1">
            <div class="flex items-center gap-2">
              <input id="isPinned" v-model="form.isPinned" type="checkbox" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <label for="isPinned" class="text-sm text-gray-700">상단 고정</label>
            </div>
          </div>
        </div>

        <UFormGroup :label="content.type === 'FAQ' ? '질문' : '제목'" required>
          <UInput v-model="form.title" />
        </UFormGroup>

        <UFormGroup v-if="showContent" label="본문">
          <UTextarea v-model="form.content" rows="10" />
        </UFormGroup>

        <UFormGroup v-if="showAnswer" label="답변">
          <UTextarea v-model="form.answer" rows="6" />
        </UFormGroup>

        <UFormGroup v-if="showCategory" label="카테고리">
          <USelect v-model="form.category" :options="faqCategoryOptions" value-attribute="value" option-attribute="label" />
        </UFormGroup>

        <UFormGroup v-if="showThumbnail" label="썸네일 URL">
          <UInput v-model="form.thumbnail" placeholder="https://example.com/image.jpg" />
        </UFormGroup>

        <div v-if="showDates" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormGroup label="시작일">
            <UInput v-model="form.startDate" type="date" />
          </UFormGroup>
          <UFormGroup label="종료일">
            <UInput v-model="form.endDate" type="date" />
          </UFormGroup>
        </div>

        <div class="flex gap-3 pt-4 border-t">
          <UButton type="submit" label="저장" :loading="isSubmitting" />
          <UButton to="/cms" variant="outline" color="gray" label="취소" />
        </div>
      </form>
    </template>
  </div>
</template>
