<script setup lang="ts">
import { PRODUCT_GRADES, type ProductGrade } from '@phone-marketplace/shared';

definePageMeta({
  layout: 'default',
});

const route = useRoute();
const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;
const authStore = useAuthStore();
const cartStore = useCartStore();

const productId = route.params.id as string;

// API - 상품 상세
const { data: product, error } = await useAsyncData(
  `product-${productId}`,
  () => $fetch<any>(`${apiBase}/products/${productId}`)
);

// API - 유사 상품
const { data: similarProducts } = await useAsyncData(
  `similar-${productId}`,
  () => $fetch<any[]>(`${apiBase}/products/${productId}/similar`)
);

useHead({
  title: product.value ? `${product.value.model?.name}` : '상품 상세',
});

// 이미지 갤러리
const selectedImageIndex = ref(0);

const productImages = computed(() => {
  return product.value?.images?.length ? product.value.images : [];
});

const hasImages = computed(() => productImages.value.length > 0);

function getImageUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${apiBase}${path}`;
}

function getSimilarImageUrl(similar: any): string | null {
  if (similar.images?.length) {
    return getImageUrl(similar.images[0]);
  }
  return null;
}

// 구매하기 → 체크아웃 페이지로 이동
const orderError = ref('');

const handleOrder = () => {
  if (!authStore.isAuthenticated) {
    return navigateTo(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`);
  }
  navigateTo(`/buy/checkout?productId=${productId}`);
};

// 장바구니 담기
const handleAddToCart = () => {
  if (!authStore.isAuthenticated) {
    return navigateTo(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`);
  }
  cartStore.addItem(productId);
};

const gradeInfo = computed(() => {
  if (!product.value?.grade) return null;
  return PRODUCT_GRADES[product.value.grade as ProductGrade];
});
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- 에러 -->
    <div v-if="error" class="max-w-7xl mx-auto px-4 py-12 text-center">
      <UIcon name="i-heroicons-exclamation-circle" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h1 class="text-xl font-bold mb-2">상품을 찾을 수 없습니다</h1>
      <p class="text-gray-500 mb-4">요청하신 상품이 존재하지 않거나 삭제되었습니다.</p>
      <UButton to="/buy" variant="outline">구매 목록으로 돌아가기</UButton>
    </div>

    <template v-else-if="product">
      <!-- 브레드크럼 -->
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav class="flex items-center gap-2 text-sm text-gray-500">
            <NuxtLink to="/" class="hover:text-gray-700">HOME</NuxtLink>
            <span>></span>
            <NuxtLink to="/buy" class="hover:text-gray-700">구매하기</NuxtLink>
            <span>></span>
            <span class="text-gray-900">{{ product.model?.name }}</span>
          </nav>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- 에러 메시지 -->
        <UAlert
          v-if="orderError"
          color="red"
          variant="soft"
          :title="orderError"
          icon="i-heroicons-exclamation-triangle"
          class="mb-6"
        />

        <div class="grid lg:grid-cols-2 gap-8">
          <!-- 상품 이미지 -->
          <div class="bg-white rounded-xl p-8">
            <!-- 메인 이미지 -->
            <div class="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              <img
                v-if="hasImages"
                :src="getImageUrl(productImages[selectedImageIndex])"
                :alt="`${product.model?.name} 이미지`"
                class="w-full h-full object-contain"
              />
              <UIcon v-else name="i-heroicons-device-phone-mobile" class="w-32 h-32 text-gray-300" />
            </div>

            <!-- 썸네일 목록 -->
            <div v-if="hasImages && productImages.length > 1" class="flex gap-2 mt-4">
              <button
                v-for="(img, i) in productImages"
                :key="i"
                class="w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors"
                :class="selectedImageIndex === i ? 'border-primary-600' : 'border-gray-200 hover:border-gray-300'"
                @click="selectedImageIndex = i"
              >
                <img
                  :src="getImageUrl(img)"
                  :alt="`썸네일 ${i + 1}`"
                  class="w-full h-full object-cover"
                />
              </button>
            </div>
            <div v-else-if="!hasImages" class="flex gap-2 mt-4">
              <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-primary-600">
                <UIcon name="i-heroicons-device-phone-mobile" class="w-8 h-8 text-gray-300" />
              </div>
            </div>
          </div>

          <!-- 상품 정보 -->
          <div class="space-y-6">
            <div>
              <!-- 배지 -->
              <div class="flex gap-2 mb-3">
                <span class="trust-badge trust-badge-quality">품질보증</span>
                <span class="trust-badge trust-badge-verified">실물인증</span>
                <ProductGradeBadge
                  v-if="product.grade"
                  :grade="product.grade"
                  :linkable="true"
                />
              </div>

              <h1 class="text-2xl font-bold">
                {{ product.model?.name }} {{ product.variant?.storage }}
              </h1>
              <p class="text-gray-500 mt-1">{{ product.variant?.color }}</p>
            </div>

            <!-- 가격 -->
            <div class="bg-gray-50 rounded-xl p-6">
              <div v-if="product.variant?.originalMsrp && product.discountRate" class="flex items-baseline gap-3 mb-1">
                <span class="text-red-500 text-lg font-bold">{{ product.discountRate }}%</span>
                <span class="text-gray-400 line-through">
                  {{ product.variant.originalMsrp?.toLocaleString() }}원
                </span>
              </div>
              <p class="text-3xl font-bold text-primary-600">
                {{ product.sellingPrice?.toLocaleString() }}원
              </p>
            </div>

            <!-- 상세 스펙 -->
            <div class="bg-white rounded-xl border border-gray-200 divide-y">
              <div v-if="product.batteryHealth" class="flex justify-between px-4 py-3">
                <span class="text-sm text-gray-500">배터리 효율</span>
                <span class="text-sm font-medium">{{ product.batteryHealth }}%</span>
              </div>
              <div v-if="product.grade" class="flex justify-between items-center px-4 py-3">
                <span class="text-sm text-gray-500">등급</span>
                <ProductGradeBadge :grade="product.grade" :linkable="true" />
              </div>
              <div v-if="product.warrantyExpiry" class="flex justify-between px-4 py-3">
                <span class="text-sm text-gray-500">보증 만료</span>
                <span class="text-sm font-medium">
                  {{ new Date(product.warrantyExpiry).toLocaleDateString('ko-KR') }}
                </span>
              </div>
              <div v-if="product.manufactureDate" class="flex justify-between px-4 py-3">
                <span class="text-sm text-gray-500">제조연월</span>
                <span class="text-sm font-medium">
                  {{ new Date(product.manufactureDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }) }}
                </span>
              </div>
              <div class="flex justify-between px-4 py-3">
                <span class="text-sm text-gray-500">용량</span>
                <span class="text-sm font-medium">{{ product.variant?.storage }}</span>
              </div>
              <div class="flex justify-between px-4 py-3">
                <span class="text-sm text-gray-500">색상</span>
                <span class="text-sm font-medium">{{ product.variant?.color }}</span>
              </div>
            </div>

            <!-- 구매 버튼 -->
            <div class="flex gap-3">
              <UButton
                size="lg"
                variant="outline"
                class="flex-1"
                :disabled="product.status !== 'AVAILABLE' || cartStore.hasProduct(productId)"
                @click="handleAddToCart"
              >
                {{ cartStore.hasProduct(productId) ? '장바구니에 담김' : '장바구니 담기' }}
              </UButton>
              <UButton
                size="lg"
                class="flex-1"
                :disabled="product.status !== 'AVAILABLE'"
                @click="handleOrder"
              >
                {{ product.status === 'AVAILABLE' ? '바로 구매' : '판매 완료' }}
              </UButton>
            </div>
          </div>
        </div>

        <!-- 상품 설명 -->
        <div v-if="product.description" class="mt-8 bg-white rounded-xl p-6">
          <h2 class="text-lg font-bold mb-4">상품 설명</h2>
          <p class="text-gray-600 whitespace-pre-line">{{ product.description }}</p>
        </div>

        <!-- 유사 상품 -->
        <div v-if="similarProducts?.length" class="mt-8">
          <h2 class="text-lg font-bold mb-4">유사 상품</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NuxtLink
              v-for="similar in similarProducts"
              :key="similar.id"
              :to="`/buy/${similar.id}`"
              class="product-card group"
            >
              <div class="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                <img
                  v-if="getSimilarImageUrl(similar)"
                  :src="getSimilarImageUrl(similar)!"
                  :alt="similar.model?.name"
                  class="w-full h-full object-cover"
                />
                <UIcon v-else name="i-heroicons-device-phone-mobile" class="w-12 h-12 text-gray-300" />
              </div>
              <div class="p-3 space-y-1">
                <p class="font-medium text-sm group-hover:text-primary-600">
                  {{ similar.model?.name }}
                </p>
                <p class="text-xs text-gray-500">{{ similar.variant?.storage }} · {{ similar.variant?.color }}</p>
                <p class="price-tag">{{ similar.sellingPrice?.toLocaleString() }}원</p>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
