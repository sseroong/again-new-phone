<script setup lang="ts">
const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;

const { data: reviewData } = await useAsyncData('buy-reviews', () =>
  $fetch<any>(`${apiBase}/reviews`, {
    params: { type: 'BUY', limit: 3 },
  }).catch(() => ({ data: [] }))
);

const reviews = computed(() => reviewData.value?.data || []);

const fallbackReviews = [
  {
    id: 'fallback-1',
    type: 'BUY',
    productModel: '아이폰 15 Pro 256GB',
    title: '검수 상태가 정말 꼼꼼하네요',
    content: '72시간 전문 검수라더니 정말 새 폰 같아요. 보증도 있어서 안심하고 구매했습니다. 다음에도 이용할게요!',
    createdAt: '2025-12-15',
    userName: '김**',
    rating: 5,
  },
  {
    id: 'fallback-2',
    type: 'BUY',
    productModel: '갤럭시 S24 울트라 512GB',
    title: '가격 대비 상태 최고',
    content: '다른 곳보다 저렴하면서도 상태가 훨씬 좋았어요. 딱보증 180일이라 부담 없이 샀습니다.',
    createdAt: '2026-01-08',
    userName: '이**',
    rating: 5,
  },
  {
    id: 'fallback-3',
    type: 'BUY',
    productModel: '아이패드 에어 5세대 64GB',
    title: '배송도 빠르고 만족합니다',
    content: '주문 후 이틀 만에 받았어요. 개인정보도 완전 삭제 상태라 바로 사용 가능했습니다. 강력 추천!',
    createdAt: '2026-02-03',
    userName: '박**',
    rating: 4,
  },
];

const displayReviews = computed(() =>
  reviews.value.length ? reviews.value.slice(0, 3) : fallbackReviews
);
</script>

<template>
  <section class="py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold">구매 후기</h2>
        <NuxtLink to="/reviews" class="text-sm text-primary-600 hover:underline">
          전체보기 →
        </NuxtLink>
      </div>

      <div class="grid md:grid-cols-3 gap-4">
        <div
          v-for="review in displayReviews"
          :key="review.id"
          class="bg-white rounded-xl p-5 border border-gray-100"
        >
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
              구매
            </span>
            <span class="text-sm text-gray-600">{{ review.productModel }}</span>
          </div>
          <p class="font-medium mb-2">"{{ review.title }}"</p>
          <p class="text-sm text-gray-500 line-clamp-2">
            {{ review.content }}
          </p>
          <div class="flex items-center justify-between mt-4 text-xs text-gray-400">
            <span>{{ new Date(review.createdAt).toLocaleDateString('ko-KR') }}</span>
            <span>{{ review.userName }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
