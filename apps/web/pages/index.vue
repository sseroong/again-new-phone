<script setup lang="ts">
import { DEVICE_CATEGORIES } from '@phone-marketplace/shared';

definePageMeta({
  layout: 'default',
});

useHead({
  title: '홈',
});

const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;

// 카테고리 목록
const categories = Object.entries(DEVICE_CATEGORIES).map(([key, value]) => ({
  key,
  ...value,
}));

// 인기 상품 API 연동
const { data: popularProducts } = await useAsyncData('popular-products', () =>
  $fetch<any[]>(`${apiBase}/products/popular`)
);

// 최근 리뷰 API 연동
const { data: recentReviews } = await useAsyncData('recent-reviews', () =>
  $fetch<any>(`${apiBase}/reviews`, { params: { limit: 3 } })
);

// 오늘의 시세 API 연동
const { data: todayPrices } = await useAsyncData('today-prices', () =>
  $fetch<any[]>(`${apiBase}/prices/today`)
);

// 통계 데이터
const stats = {
  totalQuotes: '100만+',
  satisfaction: '4.5',
  activeListings: '1,363',
};
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 class="text-3xl md:text-4xl font-bold mb-4">
              빠르고 편하게<br />
              최고가로 내 폰 팔기
            </h1>
            <p class="text-primary-100 mb-6">
              중고폰, 태블릿, 노트북, 스마트워치까지<br />
              안전하게 거래하세요.
            </p>

            <!-- 통계 -->
            <div class="flex gap-6">
              <div>
                <p class="text-2xl font-bold">{{ stats.totalQuotes }}</p>
                <p class="text-sm text-primary-200">누적 견적</p>
              </div>
              <div>
                <p class="text-2xl font-bold">{{ stats.satisfaction }}</p>
                <p class="text-sm text-primary-200">고객 만족도</p>
              </div>
              <div>
                <p class="text-2xl font-bold">{{ stats.activeListings }}</p>
                <p class="text-sm text-primary-200">대 매입 중</p>
              </div>
            </div>
          </div>

          <!-- 판매 접수 CTA -->
          <div class="bg-white rounded-2xl p-6 text-gray-900">
            <h2 class="text-xl font-bold mb-4">중고기기 판매하기</h2>
            <p class="text-sm text-gray-600 mb-4">
              판매하실 기기 종류를 선택해주세요.
            </p>

            <div class="grid grid-cols-5 gap-2">
              <NuxtLink
                v-for="category in categories"
                :key="category.key"
                :to="`/sell?category=${category.key}`"
                class="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <UIcon :name="category.icon" class="w-8 h-8 text-primary-600" />
                <span class="text-xs text-gray-600">{{ category.label }}</span>
              </NuxtLink>
            </div>

            <UButton
              to="/sell"
              block
              size="lg"
              class="mt-4"
            >
              판매 접수하기
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <!-- 오늘의 시세 -->
    <section class="py-12 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold">오늘의 시세</h2>
          <NuxtLink to="/price" class="text-sm text-primary-600 hover:underline">
            전체보기 →
          </NuxtLink>
        </div>

        <div v-if="todayPrices?.length" class="grid md:grid-cols-2 gap-4">
          <div
            v-for="price in todayPrices.slice(0, 2)"
            :key="price.id || price.model"
            class="bg-gray-50 rounded-xl p-6"
          >
            <div class="flex items-center gap-4 mb-4">
              <div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-device-phone-mobile" class="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p class="text-sm text-gray-500">{{ price.brand || '브랜드' }}</p>
                <p class="font-bold">{{ price.modelName || price.model }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="gradePrice in (price.grades || []).slice(0, 4)"
                :key="gradePrice.grade"
                class="flex justify-between items-center p-3 bg-white rounded-lg"
              >
                <span class="text-sm font-medium">{{ gradePrice.grade }}등급</span>
                <span class="font-bold text-primary-600">{{ gradePrice.price?.toLocaleString() }}원</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 시세 데이터 없을 때 -->
        <div v-else class="bg-gray-50 rounded-xl p-6">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 bg-gray-200 rounded-lg" />
            <div>
              <p class="text-sm text-gray-500">애플</p>
              <p class="font-bold">아이폰 15 프로 256GB</p>
              <p class="text-xs text-gray-400">출시일: 2023-09-22</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex justify-between items-center p-3 bg-white rounded-lg">
              <span class="text-sm font-medium">A등급</span>
              <span class="font-bold text-primary-600">850,000원</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-white rounded-lg">
              <span class="text-sm font-medium">B등급</span>
              <span class="font-bold text-primary-600">750,000원</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-white rounded-lg">
              <span class="text-sm font-medium">C등급</span>
              <span class="font-bold text-primary-600">600,000원</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-white rounded-lg">
              <span class="text-sm font-medium">D등급</span>
              <span class="font-bold text-primary-600">450,000원</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 구매하기 섹션 -->
    <section class="py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold">인기 상품</h2>
          <NuxtLink to="/buy" class="text-sm text-primary-600 hover:underline">
            전체보기 →
          </NuxtLink>
        </div>

        <!-- API 데이터 있을 때 -->
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <NuxtLink
            v-for="product in (popularProducts || []).slice(0, 5)"
            :key="product.id"
            :to="`/buy/${product.id}`"
            class="product-card p-4"
          >
            <div class="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
              <UIcon name="i-heroicons-device-phone-mobile" class="w-12 h-12 text-gray-300" />
            </div>
            <div class="space-y-1">
              <div class="flex gap-1">
                <span class="trust-badge trust-badge-quality">품질보증</span>
                <span class="trust-badge trust-badge-verified">실물인증</span>
              </div>
              <p class="text-sm font-medium">{{ product.model?.name }}</p>
              <p class="text-xs text-gray-500">{{ product.variant?.color }}</p>
              <div class="flex items-baseline gap-2">
                <span class="price-tag">{{ product.sellingPrice?.toLocaleString() }}원</span>
              </div>
            </div>
          </NuxtLink>

          <!-- API 데이터 없을 때 폴백 -->
          <template v-if="!popularProducts?.length">
            <div
              v-for="i in 5"
              :key="i"
              class="product-card p-4"
            >
              <div class="aspect-square bg-gray-100 rounded-lg mb-3" />
              <div class="space-y-1">
                <div class="flex gap-1">
                  <span class="trust-badge trust-badge-quality">품질보증</span>
                  <span class="trust-badge trust-badge-verified">실물인증</span>
                </div>
                <p class="text-sm font-medium">갤럭시 S24 울트라 256GB</p>
                <p class="text-xs text-gray-500">티타늄 블랙</p>
                <div class="flex items-baseline gap-2">
                  <span class="price-tag">1,122,000원</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- 신뢰 요소 -->
    <section class="py-12 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div class="text-center">
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UIcon name="i-heroicons-shield-check" class="w-6 h-6 text-primary-600" />
            </div>
            <p class="font-medium">최대 180일</p>
            <p class="text-sm text-gray-500">무상보증 교환</p>
          </div>
          <div class="text-center">
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UIcon name="i-heroicons-check-badge" class="w-6 h-6 text-primary-600" />
            </div>
            <p class="font-medium">전문가 검수제품</p>
            <p class="text-sm text-gray-500">정상 제품만 출고</p>
          </div>
          <div class="text-center">
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UIcon name="i-heroicons-lock-closed" class="w-6 h-6 text-primary-600" />
            </div>
            <p class="font-medium">개인정보 안전삭제</p>
            <p class="text-sm text-gray-500">새 폰같은 리셋 상품</p>
          </div>
          <div class="text-center">
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UIcon name="i-heroicons-wrench-screwdriver" class="w-6 h-6 text-primary-600" />
            </div>
            <p class="font-medium">제조사 A/S 가능</p>
            <p class="text-sm text-gray-500">정품 인증제품</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 실거래 리뷰 -->
    <section class="py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold">실거래 리뷰</h2>
          <NuxtLink to="/reviews" class="text-sm text-primary-600 hover:underline">
            전체보기 →
          </NuxtLink>
        </div>

        <div class="grid md:grid-cols-3 gap-4">
          <template v-if="recentReviews?.data?.length">
            <div
              v-for="review in recentReviews.data.slice(0, 3)"
              :key="review.id"
              class="bg-white rounded-xl p-5 border border-gray-100"
            >
              <div class="flex items-center gap-2 mb-2">
                <span
                  class="px-2 py-0.5 text-xs font-medium rounded"
                  :class="review.type === 'SELL' ? 'bg-primary-100 text-primary-700' : 'bg-blue-100 text-blue-700'"
                >
                  {{ review.type === 'SELL' ? '판매' : '구매' }}
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
          </template>

          <!-- 폴백 -->
          <template v-else>
            <div
              v-for="i in 3"
              :key="i"
              class="bg-white rounded-xl p-5 border border-gray-100"
            >
              <div class="flex items-center gap-2 mb-2">
                <span class="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                  판매
                </span>
                <span class="text-sm text-gray-600">아이폰 14 Pro 256GB</span>
              </div>
              <p class="font-medium mb-2">"빠르고 편한 거래였어요"</p>
              <p class="text-sm text-gray-500 line-clamp-2">
                견적부터 입금까지 정말 빠르게 진행됐습니다. 다음에도 이용할게요!
              </p>
              <div class="flex items-center justify-between mt-4 text-xs text-gray-400">
                <span>2024.01.15</span>
                <span>김**</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </section>
  </div>
</template>
