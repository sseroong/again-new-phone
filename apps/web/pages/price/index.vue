<script setup lang="ts">
import {
  DEVICE_CATEGORIES,
  BRANDS,
  PRODUCT_GRADES,
  type DeviceCategory,
  type Brand,
  type ProductGrade,
} from '@phone-marketplace/shared';

definePageMeta({
  layout: 'default',
});

useHead({
  title: '중고폰 시세',
});

const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;

// 필터 상태
const selectedCategory = ref<string | null>(null);
const selectedBrand = ref<string | null>(null);
const searchKeyword = ref('');

// 검색 debounce
const debouncedKeyword = ref('');
let searchTimer: ReturnType<typeof setTimeout>;
watch(searchKeyword, (val) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    debouncedKeyword.value = val;
  }, 300);
});

// 오늘의 시세 API
const { data: todayPrices, pending: todayPending } = await useAsyncData(
  'today-prices',
  () => {
    const params: Record<string, string> = {};
    if (selectedCategory.value) params.category = selectedCategory.value;
    if (selectedBrand.value) params.brand = selectedBrand.value;
    return $fetch<any>(`${apiBase}/prices/today`, { params });
  },
  { watch: [selectedCategory, selectedBrand] },
);

// 인기 모델 API
const { data: popularModels } = await useAsyncData(
  'popular-models',
  () => $fetch<any>(`${apiBase}/prices/popular`, { params: { limit: 10 } }),
);

// 검색 결과 API
const { data: searchResults, pending: searchPending } = await useAsyncData(
  'price-search',
  () => {
    if (!debouncedKeyword.value || debouncedKeyword.value.length < 2) return null;
    return $fetch<any>(`${apiBase}/prices/search`, {
      params: { keyword: debouncedKeyword.value },
    });
  },
  { watch: [debouncedKeyword] },
);

const isSearching = computed(() => debouncedKeyword.value.length >= 2);

// 카테고리 탭
const categoryTabs = [
  { key: null, label: '전체' },
  ...Object.entries(DEVICE_CATEGORIES).map(([key, value]) => ({
    key,
    label: value.label,
    icon: value.icon,
  })),
];

// 등급 표시
const gradeColumns: ProductGrade[] = ['S', 'A', 'B', 'C'] as ProductGrade[];

const getGradePrice = (priceGuides: any[], storage: string, grade: string) => {
  const found = priceGuides?.find(
    (p: any) => p.storage === storage && p.grade === grade,
  );
  return found?.price;
};

const trendIcon = (trend: string) => {
  if (trend === 'UP') return { icon: 'i-heroicons-arrow-trending-up', color: 'text-red-500' };
  if (trend === 'DOWN') return { icon: 'i-heroicons-arrow-trending-down', color: 'text-blue-500' };
  return { icon: 'i-heroicons-minus', color: 'text-gray-400' };
};
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Page Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold">중고폰 시세</h1>
        <nav class="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <NuxtLink to="/" class="hover:text-gray-700">HOME</NuxtLink>
          <span>></span>
          <span class="text-gray-900">시세표</span>
        </nav>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 검색 -->
      <div class="bg-white rounded-xl p-6 mb-6">
        <div class="max-w-xl mx-auto">
          <UInput
            v-model="searchKeyword"
            placeholder="모델명을 검색하세요 (예: iPhone 15, Galaxy S24)"
            icon="i-heroicons-magnifying-glass"
            size="lg"
          />
        </div>
      </div>

      <!-- 검색 결과 -->
      <div v-if="isSearching" class="mb-8">
        <h2 class="text-lg font-bold mb-4">"{{ debouncedKeyword }}" 검색 결과</h2>
        <div v-if="searchPending" class="flex justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
        </div>
        <div v-else-if="!searchResults?.length" class="text-center py-8">
          <UIcon name="i-heroicons-magnifying-glass" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p class="text-gray-500">검색 결과가 없습니다.</p>
        </div>
        <div v-else class="space-y-4">
          <NuxtLink
            v-for="model in searchResults"
            :key="model.id"
            :to="`/price/${model.id}`"
            class="block bg-white rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">{{ model.name }}</p>
                <p class="text-sm text-gray-500">{{ model.brand }} · {{ model.category?.name }}</p>
              </div>
              <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-gray-400" />
            </div>
            <div v-if="model.priceGuides?.length" class="mt-3 flex gap-3 flex-wrap">
              <span
                v-for="pg in model.priceGuides.slice(0, 4)"
                :key="`${pg.storage}-${pg.grade}`"
                class="text-sm bg-gray-50 px-3 py-1 rounded"
              >
                {{ pg.storage }} {{ pg.grade }}등급
                <strong class="text-primary-600">{{ pg.price?.toLocaleString() }}원</strong>
              </span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- 카테고리 탭 + 시세표 -->
      <template v-if="!isSearching">
        <!-- 인기 모델 -->
        <div v-if="popularModels?.length" class="mb-8">
          <h2 class="text-lg font-bold mb-4">인기 모델 시세</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <NuxtLink
              v-for="item in popularModels"
              :key="item.id"
              :to="`/price/${item.id}`"
              class="bg-white rounded-xl p-4 hover:shadow-md transition-shadow text-center"
            >
              <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <UIcon name="i-heroicons-device-phone-mobile" class="w-6 h-6 text-gray-400" />
              </div>
              <p class="font-medium text-sm">{{ item.name }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ item.brand }}</p>
              <p v-if="item.representativePrice" class="text-primary-600 font-bold text-sm mt-2">
                {{ item.representativePrice?.toLocaleString() }}원~
              </p>
              <div v-if="item.trend" class="flex items-center justify-center gap-1 mt-1">
                <UIcon
                  :name="trendIcon(item.trend).icon"
                  class="w-4 h-4"
                  :class="trendIcon(item.trend).color"
                />
                <span class="text-xs" :class="trendIcon(item.trend).color">
                  {{ item.trend === 'UP' ? '상승' : item.trend === 'DOWN' ? '하락' : '보합' }}
                </span>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- 카테고리 탭 -->
        <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            v-for="tab in categoryTabs"
            :key="tab.key ?? 'all'"
            class="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
            :class="[
              selectedCategory === tab.key
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            ]"
            @click="selectedCategory = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- 브랜드 필터 -->
        <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            class="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors"
            :class="[
              !selectedBrand
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            ]"
            @click="selectedBrand = null"
          >
            전체 브랜드
          </button>
          <button
            v-for="(brand, key) in BRANDS"
            :key="key"
            class="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors"
            :class="[
              selectedBrand === key
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            ]"
            @click="selectedBrand = key as string"
          >
            {{ brand.label }}
          </button>
        </div>

        <!-- 시세 테이블 -->
        <div v-if="todayPending" class="flex justify-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
        </div>

        <div v-else-if="!todayPrices?.length" class="text-center py-12">
          <UIcon name="i-heroicons-chart-bar" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p class="text-gray-500">시세 데이터가 없습니다.</p>
        </div>

        <div v-else class="space-y-8">
          <div v-for="group in todayPrices" :key="group.category?.id" class="bg-white rounded-xl overflow-hidden">
            <div class="px-6 py-4 bg-gray-50 border-b">
              <h3 class="font-bold text-lg">{{ group.category?.name }}</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b text-sm text-gray-500">
                    <th class="px-4 py-3 text-left font-medium">모델명</th>
                    <th class="px-4 py-3 text-left font-medium">용량</th>
                    <th
                      v-for="grade in gradeColumns"
                      :key="grade"
                      class="px-4 py-3 text-right font-medium"
                    >
                      {{ PRODUCT_GRADES[grade]?.label || grade }}등급
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="model in group.models" :key="model.id">
                    <template v-if="model.priceGuides?.length">
                      <tr
                        v-for="(storage, idx) in [...new Set(model.priceGuides.map((p: any) => p.storage))]"
                        :key="`${model.id}-${storage}`"
                        class="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td v-if="idx === 0" class="px-4 py-3" :rowspan="[...new Set(model.priceGuides.map((p: any) => p.storage))].length">
                          <NuxtLink :to="`/price/${model.id}`" class="font-medium hover:text-primary-600">
                            {{ model.name }}
                          </NuxtLink>
                          <p class="text-xs text-gray-500">{{ model.brand }}</p>
                        </td>
                        <td class="px-4 py-3 text-sm">{{ storage }}</td>
                        <td
                          v-for="grade in gradeColumns"
                          :key="grade"
                          class="px-4 py-3 text-right text-sm"
                        >
                          <span v-if="getGradePrice(model.priceGuides, storage as string, grade)" class="font-medium">
                            {{ getGradePrice(model.priceGuides, storage as string, grade)?.toLocaleString() }}원
                          </span>
                          <span v-else class="text-gray-300">-</span>
                        </td>
                      </tr>
                    </template>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
