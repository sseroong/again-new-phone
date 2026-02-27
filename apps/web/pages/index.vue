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

// 상품 통계 API
const { data: stats } = await useAsyncData('product-stats', () =>
  $fetch<any>(`${apiBase}/products/stats`).catch(() => null)
);
</script>

<template>
  <div>
    <!-- 1. 프로모션 배너 -->
    <HomePromotionBanner />

    <!-- 2. Hero 섹션 (구매 중심) -->
    <section class="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 class="text-3xl md:text-4xl font-bold mb-4">
              딱! 내게 맞는<br />
              검증된 중고폰
            </h1>
            <p class="text-primary-100 mb-6">
              전문 엔지니어 72시간 검수, 최대 180일 보증
            </p>

            <!-- 통계 -->
            <div class="flex gap-6">
              <div>
                <p class="text-2xl font-bold">
                  {{ stats?.availableCount ? `${stats.availableCount}대` : '-' }}
                </p>
                <p class="text-sm text-primary-200">검수 완료 상품</p>
              </div>
              <div>
                <p class="text-2xl font-bold">
                  {{ stats?.averageRating ? `${stats.averageRating}점` : '-' }}
                </p>
                <p class="text-sm text-primary-200">구매 만족도</p>
              </div>
              <div>
                <p class="text-2xl font-bold">30일</p>
                <p class="text-sm text-primary-200">딱보증</p>
              </div>
            </div>
          </div>

          <!-- 구매 CTA -->
          <div class="bg-white rounded-2xl p-6 text-gray-900">
            <h2 class="text-xl font-bold mb-4">지금 바로 구매하기</h2>
            <p class="text-sm text-gray-600 mb-4">
              원하시는 기기 종류를 선택해주세요.
            </p>

            <div class="grid grid-cols-5 gap-2">
              <NuxtLink
                v-for="category in categories"
                :key="category.key"
                :to="`/buy?category=${category.key}`"
                class="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <UIcon :name="category.icon" class="w-8 h-8 text-primary-600" />
                <span class="text-xs text-gray-600">{{ category.label }}</span>
              </NuxtLink>
            </div>

            <UButton
              to="/buy"
              block
              size="lg"
              class="mt-4"
            >
              상품 둘러보기
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. 카테고리별 추천 상품 -->
    <HomeCategoryProductTabs />

    <!-- 4. 신뢰 배지 (딱검수/딱보증) -->
    <HomeBuyerTrustBadges />

    <!-- 5. 구매 후기 -->
    <HomeBuyReviews />

    <!-- 6. 판매 접수 CTA (하단 축소 배치) -->
    <section class="py-10 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 class="text-lg font-bold mb-1">중고기기 판매도 간편하게</h3>
            <p class="text-sm text-gray-500">
              사용하지 않는 기기를 간편하게 판매하세요. 빠른 견적, 안전한 거래를 약속합니다.
            </p>
          </div>
          <UButton
            to="/sell"
            size="lg"
            variant="outline"
            class="whitespace-nowrap"
          >
            판매 접수하기
          </UButton>
        </div>
      </div>
    </section>
  </div>
</template>
