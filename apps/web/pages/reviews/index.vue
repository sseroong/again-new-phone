<script setup lang="ts">
definePageMeta({
  layout: 'default',
});

useHead({
  title: '실거래 리뷰',
});

const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;

// 필터 상태
const activeType = ref<string | null>(null);
const sortBy = ref('latest');
const page = ref(1);
const limit = 12;

// 쿼리 파라미터
const queryParams = computed(() => {
  const params: Record<string, any> = {
    page: page.value,
    limit,
    sortBy: sortBy.value,
  };
  if (activeType.value) params.type = activeType.value;
  return params;
});

// 리뷰 통계 API
const { data: stats } = await useAsyncData(
  'review-stats',
  () => $fetch<any>(`${apiBase}/reviews/stats`),
);

// 리뷰 목록 API
const { data: reviewsData, pending } = await useAsyncData(
  'reviews-list',
  () => $fetch<any>(`${apiBase}/reviews`, { params: queryParams.value }),
  { watch: [queryParams] },
);

const reviews = computed(() => reviewsData.value?.data || reviewsData.value || []);
const total = computed(() => reviewsData.value?.meta?.total || reviews.value?.length || 0);

// 타입 탭
const typeTabs = [
  { key: null, label: '전체' },
  { key: 'BUY', label: '구매 리뷰' },
  { key: 'SELL', label: '판매 리뷰' },
];

// 정렬 옵션
const sortOptions = [
  { value: 'latest', label: '최신순' },
  { value: 'rating', label: '별점순' },
  { value: 'likes', label: '좋아요순' },
];

// 별점 렌더링
const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
};

// 좋아요
const likeReview = async (reviewId: string) => {
  try {
    await $fetch(`${apiBase}/reviews/${reviewId}/like`, { method: 'POST' });
    // 로컬에서 좋아요 수 증가
    const review = reviews.value?.find((r: any) => r.id === reviewId);
    if (review) review.likes = (review.likes || 0) + 1;
  } catch {
    // 무시
  }
};

// 타입 변경 시 페이지 리셋
watch(activeType, () => { page.value = 1; });
watch(sortBy, () => { page.value = 1; });
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Page Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold">실거래 리뷰</h1>
        <nav class="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <NuxtLink to="/" class="hover:text-gray-700">HOME</NuxtLink>
          <span>></span>
          <span class="text-gray-900">리뷰</span>
        </nav>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 통계 -->
      <div v-if="stats" class="bg-white rounded-xl p-6 mb-6 text-center">
        <div class="flex items-center justify-center gap-8">
          <div>
            <p class="text-3xl font-bold text-primary-600">{{ stats.totalReviews?.toLocaleString() || 0 }}</p>
            <p class="text-sm text-gray-500 mt-1">총 리뷰</p>
          </div>
          <div class="w-px h-12 bg-gray-200" />
          <div>
            <div class="flex items-center gap-1 justify-center">
              <UIcon name="i-heroicons-star-solid" class="w-6 h-6 text-yellow-400" />
              <span class="text-3xl font-bold">{{ Number(stats.avgRating || 0).toFixed(1) }}</span>
            </div>
            <p class="text-sm text-gray-500 mt-1">평균 별점</p>
          </div>
        </div>
      </div>

      <!-- 필터 바 -->
      <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
        <!-- 타입 탭 -->
        <div class="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            v-for="tab in typeTabs"
            :key="tab.key ?? 'all'"
            class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
            :class="[
              activeType === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            ]"
            @click="activeType = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- 정렬 -->
        <USelectMenu
          v-model="sortBy"
          :options="sortOptions"
          option-attribute="label"
          value-attribute="value"
          size="sm"
        />
      </div>

      <!-- 로딩 -->
      <div v-if="pending" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
      </div>

      <!-- 리뷰 없음 -->
      <div v-else-if="!reviews?.length" class="text-center py-12">
        <UIcon name="i-heroicons-chat-bubble-bottom-center-text" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p class="text-gray-500">아직 리뷰가 없습니다.</p>
      </div>

      <!-- 리뷰 목록 -->
      <div v-else class="space-y-4">
        <div
          v-for="review in reviews"
          :key="review.id"
          class="bg-white rounded-xl p-6"
        >
          <!-- 상단: 사용자 + 별점 + 타입 -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <UIcon name="i-heroicons-user" class="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p class="font-medium text-sm">
                  {{ review.user?.name || '익명' }}
                </p>
                <div class="flex items-center gap-2 mt-0.5">
                  <div class="flex">
                    <UIcon
                      v-for="(filled, i) in renderStars(review.rating)"
                      :key="i"
                      :name="filled ? 'i-heroicons-star-solid' : 'i-heroicons-star'"
                      class="w-4 h-4"
                      :class="filled ? 'text-yellow-400' : 'text-gray-200'"
                    />
                  </div>
                  <span class="text-xs text-gray-400">
                    {{ new Date(review.createdAt).toLocaleDateString('ko-KR') }}
                  </span>
                </div>
              </div>
            </div>
            <UBadge
              :color="review.type === 'BUY' ? 'blue' : 'green'"
              variant="soft"
              size="sm"
            >
              {{ review.type === 'BUY' ? '구매' : '판매' }}
            </UBadge>
          </div>

          <!-- 기기 정보 -->
          <div v-if="review.deviceName" class="mb-2">
            <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              {{ review.deviceName }}
            </span>
          </div>

          <!-- 리뷰 내용 -->
          <h3 v-if="review.title" class="font-medium mb-1">{{ review.title }}</h3>
          <p class="text-sm text-gray-600 leading-relaxed">{{ review.content }}</p>

          <!-- 이미지 -->
          <div v-if="review.images?.length" class="flex gap-2 mt-3">
            <div
              v-for="(img, i) in review.images.slice(0, 4)"
              :key="i"
              class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center"
            >
              <UIcon name="i-heroicons-photo" class="w-6 h-6 text-gray-300" />
            </div>
          </div>

          <!-- 좋아요 -->
          <div class="flex items-center justify-end mt-3">
            <button
              class="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 transition-colors"
              @click="likeReview(review.id)"
            >
              <UIcon name="i-heroicons-hand-thumb-up" class="w-4 h-4" />
              <span>{{ review.likes || 0 }}</span>
            </button>
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
