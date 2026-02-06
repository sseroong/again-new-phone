<script setup lang="ts">
import {
  DEVICE_CATEGORIES,
  BRANDS,
  PRODUCT_GRADES,
  STORAGE_OPTIONS,
  PRICE_RANGES,
  type DeviceCategory,
  type Brand,
  type ProductGrade,
} from '@phone-marketplace/shared';

definePageMeta({
  layout: 'default',
});

useHead({
  title: '구매하기',
});

// 필터 상태
const selectedCategory = ref<DeviceCategory | null>(null);
const selectedBrands = ref<Brand[]>([]);
const selectedGrades = ref<ProductGrade[]>([]);
const selectedStorage = ref<string[]>([]);
const priceRange = ref<{ min: number; max: number } | null>(null);
const sortBy = ref<'price_asc' | 'price_desc' | 'newest' | 'popular'>('newest');

// 페이지네이션
const page = ref(1);
const pageSize = ref(24);
const totalItems = ref(312);

// 임시 상품 데이터
const products = computed(() => {
  return Array.from({ length: pageSize.value }, (_, i) => ({
    id: `product-${page.value}-${i}`,
    model: ['갤럭시 S24 울트라', '아이폰 15 프로', '갤럭시 Z플립6', '아이폰 14'][i % 4],
    variant: ['256GB', '512GB', '128GB'][i % 3],
    color: ['티타늄 블랙', '내추럴 티타늄', '퍼플', '블루'][i % 4],
    grade: (['S_PLUS', 'S', 'A', 'B'] as const)[i % 4],
    originalPrice: 1500000 + i * 50000,
    sellingPrice: 1200000 + i * 30000,
    discountRate: 20 + (i % 10),
    batteryHealth: 85 + (i % 15),
    rating: 4.5 + (i % 5) * 0.1,
  }));
});

// 카테고리 목록
const categories = [
  { key: null, label: '전체', icon: 'ALL' },
  ...Object.entries(DEVICE_CATEGORIES).map(([key, value]) => ({
    key: key as DeviceCategory,
    ...value,
  })),
];

// 정렬 옵션
const sortOptions = [
  { value: 'newest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'price_asc', label: '낮은가격순' },
  { value: 'price_desc', label: '높은가격순' },
];

// 필터 초기화
const resetFilters = () => {
  selectedCategory.value = null;
  selectedBrands.value = [];
  selectedGrades.value = [];
  selectedStorage.value = [];
  priceRange.value = null;
};
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Page Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold">구매하기</h1>
        <nav class="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <NuxtLink to="/" class="hover:text-gray-700">HOME</NuxtLink>
          <span>›</span>
          <span class="text-gray-900">구매하기</span>
        </nav>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- 카테고리 탭 -->
      <div class="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button
          v-for="cat in categories"
          :key="cat.key ?? 'all'"
          class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg whitespace-nowrap transition-colors"
          :class="[
            selectedCategory === cat.key
              ? 'bg-primary-100 text-primary-700'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          ]"
          @click="selectedCategory = cat.key"
        >
          <template v-if="cat.icon === 'ALL'">
            <span class="text-lg font-bold">ALL</span>
          </template>
          <template v-else>
            <UIcon :name="cat.icon" class="w-6 h-6" />
          </template>
          <span class="text-xs">{{ cat.label }}</span>
        </button>
      </div>

      <div class="flex gap-6">
        <!-- 사이드바 필터 -->
        <aside class="hidden lg:block w-64 flex-shrink-0">
          <div class="bg-white rounded-xl p-4 sticky top-24 space-y-6">
            <!-- 필터 헤더 -->
            <div class="flex items-center justify-between">
              <h3 class="font-medium">필터</h3>
              <button
                class="text-sm text-gray-500 hover:text-gray-700"
                @click="resetFilters"
              >
                초기화
              </button>
            </div>

            <!-- 제조사 필터 -->
            <div>
              <h4 class="text-sm font-medium mb-2">제조사</h4>
              <div class="space-y-2">
                <label
                  v-for="(brand, key) in BRANDS"
                  :key="key"
                  class="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    v-model="selectedBrands"
                    type="checkbox"
                    :value="key"
                    class="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-600">{{ brand.label }}</span>
                </label>
              </div>
            </div>

            <!-- 등급 필터 -->
            <div>
              <h4 class="text-sm font-medium mb-2">등급</h4>
              <div class="space-y-2">
                <label
                  v-for="(grade, key) in PRODUCT_GRADES"
                  :key="key"
                  class="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    v-model="selectedGrades"
                    type="checkbox"
                    :value="key"
                    class="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-600">{{ grade.label }}</span>
                </label>
              </div>
            </div>

            <!-- 저장공간 필터 -->
            <div>
              <h4 class="text-sm font-medium mb-2">저장공간</h4>
              <div class="space-y-2">
                <label
                  v-for="storage in STORAGE_OPTIONS"
                  :key="storage"
                  class="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    v-model="selectedStorage"
                    type="checkbox"
                    :value="storage"
                    class="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-600">{{ storage }}</span>
                </label>
              </div>
            </div>

            <!-- 가격대 필터 -->
            <div>
              <h4 class="text-sm font-medium mb-2">가격대</h4>
              <div class="space-y-2">
                <label
                  v-for="range in PRICE_RANGES"
                  :key="range.label"
                  class="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="priceRange"
                    :value="range"
                    :checked="priceRange?.min === range.min"
                    class="text-primary-600 focus:ring-primary-500"
                    @change="priceRange = { min: range.min, max: range.max }"
                  />
                  <span class="text-sm text-gray-600">{{ range.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        <!-- 상품 목록 -->
        <main class="flex-1">
          <!-- 정렬 및 개수 -->
          <div class="flex items-center justify-between mb-4">
            <p class="text-sm text-gray-600">
              총 <strong>{{ totalItems }}</strong>개
            </p>
            <USelectMenu
              v-model="sortBy"
              :options="sortOptions"
              option-attribute="label"
              value-attribute="value"
              size="sm"
            />
          </div>

          <!-- 상품 그리드 -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <NuxtLink
              v-for="product in products"
              :key="product.id"
              :to="`/buy/${product.id}`"
              class="product-card group"
            >
              <!-- 상품 이미지 -->
              <div class="aspect-square bg-gray-100 relative overflow-hidden">
                <div class="absolute top-2 left-2 flex flex-wrap gap-1">
                  <span class="trust-badge trust-badge-quality">품질보증</span>
                  <span class="trust-badge trust-badge-verified">실물인증</span>
                </div>
              </div>

              <!-- 상품 정보 -->
              <div class="p-3 space-y-1">
                <div class="flex items-center gap-1">
                  <span
                    class="grade-badge"
                    :class="`bg-${PRODUCT_GRADES[product.grade].color}-100 text-${PRODUCT_GRADES[product.grade].color}-700`"
                  >
                    {{ PRODUCT_GRADES[product.grade].label }}
                  </span>
                  <span class="text-xs text-gray-500">{{ product.variant }}</span>
                </div>

                <p class="font-medium text-sm group-hover:text-primary-600 transition-colors">
                  {{ product.model }}
                </p>

                <p class="text-xs text-gray-500">{{ product.color }}</p>

                <div class="flex items-baseline gap-2 pt-1">
                  <span class="discount-rate">{{ product.discountRate }}%</span>
                  <span class="price-original">
                    {{ product.originalPrice.toLocaleString() }}원
                  </span>
                </div>
                <p class="price-tag">
                  {{ product.sellingPrice.toLocaleString() }}원
                </p>

                <div class="flex items-center gap-2 text-xs text-gray-500 pt-1">
                  <span>배터리 {{ product.batteryHealth }}%</span>
                  <span>·</span>
                  <span>{{ product.rating.toFixed(1) }}</span>
                </div>
              </div>
            </NuxtLink>
          </div>

          <!-- 페이지네이션 -->
          <div class="flex justify-center mt-8">
            <UPagination
              v-model="page"
              :total="totalItems"
              :page-count="pageSize"
            />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
