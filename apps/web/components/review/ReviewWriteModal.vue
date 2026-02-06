<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  type: 'BUY' | 'SELL';
  orderId?: string;
  sellRequestId?: string;
  productModel: string;
  quotesReceived?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'review-created'): void;
}>();

const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;
const authStore = useAuthStore();
const toast = useToast();

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
});

const rating = ref(5);
const title = ref('');
const content = ref('');
const imageUrl = ref('');
const images = ref<string[]>([]);
const isSubmitting = ref(false);

const isValid = computed(() => {
  return rating.value >= 1 && rating.value <= 5
    && title.value.trim().length >= 2
    && content.value.trim().length >= 10;
});

function addImage() {
  const url = imageUrl.value.trim();
  if (url) {
    images.value.push(url);
    imageUrl.value = '';
  }
}

function removeImage(index: number) {
  images.value.splice(index, 1);
}

function resetForm() {
  rating.value = 5;
  title.value = '';
  content.value = '';
  imageUrl.value = '';
  images.value = [];
}

async function handleSubmit() {
  if (!isValid.value) return;

  isSubmitting.value = true;
  try {
    await $fetch(`${apiBase}/reviews`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.tokens?.accessToken}`,
      },
      body: {
        type: props.type,
        orderId: props.type === 'BUY' ? props.orderId : undefined,
        sellRequestId: props.type === 'SELL' ? props.sellRequestId : undefined,
        productModel: props.productModel,
        title: title.value.trim(),
        content: content.value.trim(),
        rating: rating.value,
        images: images.value.length ? images.value : undefined,
        quotesReceived: props.type === 'SELL' ? props.quotesReceived : undefined,
      },
    });

    toast.add({ title: '리뷰가 작성되었습니다.', color: 'green' });
    resetForm();
    isOpen.value = false;
    emit('review-created');
  } catch (error: any) {
    toast.add({
      title: error?.data?.message || '리뷰 작성에 실패했습니다.',
      color: 'red',
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal v-model="isOpen">
    <div class="p-6">
      <h3 class="text-lg font-bold mb-1">리뷰 작성</h3>
      <p class="text-sm text-gray-500 mb-6">
        <UBadge :color="type === 'BUY' ? 'blue' : 'green'" variant="soft" size="xs">
          {{ type === 'BUY' ? '구매' : '판매' }}
        </UBadge>
        <span class="ml-2">{{ productModel }}</span>
      </p>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- 별점 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">별점</label>
          <ReviewStarRating v-model="rating" size="lg" />
        </div>

        <!-- 제목 -->
        <UFormGroup label="제목" required :error="title.length > 0 && title.trim().length < 2 ? '2자 이상 입력해주세요.' : undefined">
          <UInput v-model="title" placeholder="리뷰 제목을 입력하세요" />
        </UFormGroup>

        <!-- 내용 -->
        <UFormGroup label="내용" required :error="content.length > 0 && content.trim().length < 10 ? '10자 이상 입력해주세요.' : undefined">
          <UTextarea v-model="content" :rows="4" placeholder="거래 경험을 공유해주세요" />
        </UFormGroup>

        <!-- 이미지 URL -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">이미지 (선택)</label>
          <div class="flex gap-2 mb-2">
            <UInput
              v-model="imageUrl"
              placeholder="https://..."
              class="flex-1"
              @keyup.enter.prevent="addImage"
            />
            <UButton type="button" label="추가" variant="outline" size="sm" @click="addImage" />
          </div>
          <div v-if="images.length" class="flex flex-wrap gap-2">
            <div
              v-for="(img, i) in images"
              :key="i"
              class="flex items-center gap-1 bg-gray-100 rounded px-2 py-1 text-xs"
            >
              <span class="max-w-[150px] truncate">{{ img }}</span>
              <UButton
                type="button"
                icon="i-heroicons-x-mark"
                size="2xs"
                variant="ghost"
                color="red"
                @click="removeImage(i)"
              />
            </div>
          </div>
        </div>

        <!-- 버튼 -->
        <div class="flex gap-3 pt-4 border-t">
          <UButton type="submit" label="작성하기" :loading="isSubmitting" :disabled="!isValid" />
          <UButton type="button" label="취소" variant="outline" color="gray" @click="isOpen = false" />
        </div>
      </form>
    </div>
  </UModal>
</template>
