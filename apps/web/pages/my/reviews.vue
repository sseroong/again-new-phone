<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

useHead({
  title: '나의 리뷰',
});

const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;
const authStore = useAuthStore();
const toast = useToast();

const page = ref(1);
const limit = 10;

const authHeaders = computed(() => ({
  Authorization: `Bearer ${authStore.tokens?.accessToken}`,
}));

const queryParams = computed(() => ({
  page: page.value,
  limit,
}));

const { data: reviewsData, pending, refresh } = await useAsyncData(
  'my-reviews-list',
  () => $fetch<any>(`${apiBase}/reviews/my`, {
    headers: authHeaders.value,
    params: queryParams.value,
  }),
  { watch: [queryParams] },
);

const reviews = computed(() => reviewsData.value?.data || reviewsData.value || []);
const total = computed(() => reviewsData.value?.meta?.total || reviews.value?.length || 0);

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
};

const isDeleting = ref<string | null>(null);

async function deleteReview(reviewId: string) {
  if (!confirm('리뷰를 삭제하시겠습니까?')) return;

  isDeleting.value = reviewId;
  try {
    await $fetch(`${apiBase}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: authHeaders.value,
    });
    toast.add({ title: '리뷰가 삭제되었습니다.', color: 'green' });
    refresh();
  } catch (error: any) {
    toast.add({
      title: error?.data?.message || '리뷰 삭제에 실패했습니다.',
      color: 'red',
    });
  } finally {
    isDeleting.value = null;
  }
}
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Page Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold">나의 리뷰</h1>
        <nav class="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <NuxtLink to="/" class="hover:text-gray-700">HOME</NuxtLink>
          <span>></span>
          <span class="text-gray-900">나의 리뷰</span>
        </nav>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 로딩 -->
      <div v-if="pending" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="!reviews.length" class="text-center py-12">
        <UIcon name="i-heroicons-chat-bubble-bottom-center-text" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p class="text-gray-500">아직 작성한 리뷰가 없습니다.</p>
        <UButton to="/my/transactions" variant="outline" class="mt-4">거래내역 보기</UButton>
      </div>

      <!-- 리뷰 목록 -->
      <div v-else class="space-y-4">
        <div
          v-for="review in reviews"
          :key="review.id"
          class="bg-white rounded-xl p-6"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <UBadge
                  :color="review.type === 'BUY' ? 'blue' : 'green'"
                  variant="soft"
                  size="xs"
                >
                  {{ review.type === 'BUY' ? '구매' : '판매' }}
                </UBadge>
                <span class="text-xs text-gray-400">
                  {{ new Date(review.createdAt).toLocaleDateString('ko-KR') }}
                </span>
              </div>
              <div class="flex mt-1">
                <UIcon
                  v-for="(filled, i) in renderStars(review.rating)"
                  :key="i"
                  :name="filled ? 'i-heroicons-star-solid' : 'i-heroicons-star'"
                  class="w-4 h-4"
                  :class="filled ? 'text-yellow-400' : 'text-gray-200'"
                />
              </div>
            </div>
            <UButton
              icon="i-heroicons-trash"
              variant="ghost"
              color="red"
              size="xs"
              :loading="isDeleting === review.id"
              @click="deleteReview(review.id)"
            />
          </div>

          <div v-if="review.productModel" class="mb-2">
            <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              {{ review.productModel }}
            </span>
          </div>

          <h3 v-if="review.title" class="font-medium mb-1">{{ review.title }}</h3>
          <p class="text-sm text-gray-600 leading-relaxed">{{ review.content }}</p>

          <div v-if="review.images?.length" class="flex gap-2 mt-3">
            <div
              v-for="(img, i) in review.images.slice(0, 4)"
              :key="i"
              class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center"
            >
              <UIcon name="i-heroicons-photo" class="w-6 h-6 text-gray-300" />
            </div>
          </div>

          <div class="flex items-center justify-end mt-3 text-sm text-gray-400">
            <span>좋아요 {{ review.likes || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="total > limit" class="flex justify-center mt-8">
        <UPagination
          v-model="page"
          :total="total"
          :page-count="limit"
        />
      </div>
    </div>
  </div>
</template>
