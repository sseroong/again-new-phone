<script setup lang="ts">
import { PRODUCT_GRADES, type ProductGrade } from '@phone-marketplace/shared';

definePageMeta({
  layout: 'default',
});

useHead({
  title: '딱검수 등급 안내',
});

// 검수 프로세스 단계
const inspectionSteps = [
  {
    icon: 'i-heroicons-magnifying-glass',
    title: '72시간 전문 검수',
    description: '전문 검수사가 외관, 액정, 기능, 배터리를 꼼꼼히 검사합니다.',
  },
  {
    icon: 'i-heroicons-clipboard-document-check',
    title: '등급 판정',
    description: '검수 결과에 따라 10단계 등급을 부여합니다.',
  },
  {
    icon: 'i-heroicons-shield-check',
    title: '딱보증 부여',
    description: '등급에 맞는 품질보증과 실물인증을 부여합니다.',
  },
];

// 등급별 상세 검수 기준
const gradeDetails: Record<string, {
  appearance: string;
  screen: string;
  battery: string;
}> = {
  NEW: {
    appearance: '미개봉 완전 새제품',
    screen: '흠집 없음',
    battery: '100%',
  },
  UNOPENED: {
    appearance: '개봉만 한 새제품급',
    screen: '흠집 없음',
    battery: '98% 이상',
  },
  S_PLUS: {
    appearance: '사용감 거의 없음, 외관 무흠',
    screen: '무흠',
    battery: '95% 이상',
  },
  S: {
    appearance: '미세 사용감, 외관 미세흠',
    screen: '깨끗',
    battery: '90% 이상',
  },
  A: {
    appearance: '외관 깨끗',
    screen: '깨끗',
    battery: '85% 이상',
  },
  B_PLUS: {
    appearance: '약간의 사용감, 외관 미세흠',
    screen: '깨끗',
    battery: '80% 이상',
  },
  B: {
    appearance: '외관 미세흠집',
    screen: '깨끗',
    battery: '75% 이상',
  },
  C: {
    appearance: '외관 흠집/찍힘',
    screen: '흠집',
    battery: '기능 정상',
  },
  D: {
    appearance: '기능불량 또는 외관파손',
    screen: '흠집/파손',
    battery: '기능 정상',
  },
  E: {
    appearance: '심각한 파손/불량',
    screen: '심각한 파손/불량',
    battery: '불량 가능',
  },
};

const gradeKeys = Object.keys(PRODUCT_GRADES) as ProductGrade[];
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- 브레드크럼 -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav class="flex items-center gap-2 text-sm text-gray-500">
          <NuxtLink to="/" class="hover:text-gray-700">HOME</NuxtLink>
          <span>›</span>
          <span class="text-gray-900">딱검수 등급 안내</span>
        </nav>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 페이지 헤더 -->
      <div class="text-center mb-12">
        <h1 class="text-3xl font-bold mb-3">딱검수 등급 안내</h1>
        <p class="text-gray-500 text-lg">
          전문 검수사의 꼼꼼한 검수를 거친 등급별 품질 기준을 확인하세요.
        </p>
      </div>

      <!-- 검수 프로세스 -->
      <div class="bg-white rounded-xl p-8 mb-10">
        <h2 class="text-xl font-bold text-center mb-8">딱검수 프로세스</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div
            v-for="(step, index) in inspectionSteps"
            :key="index"
            class="text-center"
          >
            <div class="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <UIcon :name="step.icon" class="w-8 h-8 text-primary-600" />
            </div>
            <div class="flex items-center justify-center gap-2 mb-2">
              <span class="w-6 h-6 bg-primary-600 text-white rounded-full text-sm font-bold flex items-center justify-center">
                {{ index + 1 }}
              </span>
              <h3 class="font-bold">{{ step.title }}</h3>
            </div>
            <p class="text-sm text-gray-500">{{ step.description }}</p>
          </div>
        </div>
      </div>

      <!-- 등급표 -->
      <h2 class="text-xl font-bold mb-6">전체 등급 기준표</h2>
      <div class="space-y-4 mb-10">
        <div
          v-for="gradeKey in gradeKeys"
          :key="gradeKey"
          class="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div class="flex items-start gap-4 p-5">
            <!-- 등급 배지 -->
            <div class="flex-shrink-0 pt-0.5">
              <ProductGradeBadge :grade="gradeKey" size="md" />
            </div>

            <!-- 등급 정보 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-bold">{{ PRODUCT_GRADES[gradeKey].label }} 등급</h3>
                <span class="text-sm text-gray-500">{{ PRODUCT_GRADES[gradeKey].description }}</span>
              </div>

              <!-- 검수 기준 상세 -->
              <div v-if="gradeDetails[gradeKey]" class="grid grid-cols-3 gap-4 mt-3">
                <div class="bg-gray-50 rounded-lg px-3 py-2">
                  <p class="text-xs text-gray-400 mb-0.5">외관</p>
                  <p class="text-sm font-medium">{{ gradeDetails[gradeKey].appearance }}</p>
                </div>
                <div class="bg-gray-50 rounded-lg px-3 py-2">
                  <p class="text-xs text-gray-400 mb-0.5">액정</p>
                  <p class="text-sm font-medium">{{ gradeDetails[gradeKey].screen }}</p>
                </div>
                <div class="bg-gray-50 rounded-lg px-3 py-2">
                  <p class="text-xs text-gray-400 mb-0.5">배터리</p>
                  <p class="text-sm font-medium">{{ gradeDetails[gradeKey].battery }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 하단 CTA -->
      <div class="bg-primary-50 rounded-xl p-8 text-center">
        <h3 class="text-lg font-bold mb-2">검수 완료 상품을 확인해보세요</h3>
        <p class="text-gray-600 text-sm mb-4">
          전문 검수를 통과한 안심 상품만 판매합니다.
        </p>
        <UButton to="/buy" size="lg">
          검수 완료 상품 둘러보기
        </UButton>
      </div>
    </div>
  </div>
</template>
