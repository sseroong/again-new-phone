<script setup lang="ts">
const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;

function getImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${apiBase}${path}`;
}

const tabs = [
  { key: '', label: '전체' },
  { key: 'SMARTPHONE', label: '스마트폰' },
  { key: 'TABLET', label: '태블릿' },
  { key: 'LAPTOP', label: '노트북' },
  { key: 'WATCH', label: '워치' },
];

const activeTab = ref('');

const { data: products, refresh } = await useAsyncData(
  'recommended-products',
  () =>
    $fetch<any[]>(`${apiBase}/products/recommended`, {
      params: {
        ...(activeTab.value ? { category: activeTab.value } : {}),
        limit: 8,
      },
    }).catch(() => []),
  { watch: [activeTab] }
);

const productList = computed(() => products.value || []);

function selectTab(key: string) {
  activeTab.value = key;
}
</script>

<template>
  <section class="py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold">추천 상품</h2>
        <NuxtLink
          :to="activeTab ? `/buy?category=${activeTab}` : '/buy'"
          class="text-sm text-primary-600 hover:underline"
        >
          전체보기 →
        </NuxtLink>
      </div>

      <!-- 카테고리 탭 -->
      <div class="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
          :class="
            activeTab === tab.key
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          "
          @click="selectTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 상품 그리드 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NuxtLink
          v-for="product in productList.slice(0, 8)"
          :key="product.id"
          :to="`/buy/${product.id}`"
          class="product-card p-4"
        >
          <div class="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
            <img
              v-if="product.images?.length"
              :src="getImageUrl(product.images[0])"
              :alt="product.model?.name"
              class="w-full h-full object-cover rounded-lg"
            />
            <UIcon v-else name="i-heroicons-device-phone-mobile" class="w-12 h-12 text-gray-300" />
          </div>
          <div class="space-y-1">
            <div class="flex gap-1">
              <span class="trust-badge trust-badge-quality">품질보증</span>
              <span class="trust-badge trust-badge-verified">실물인증</span>
            </div>
            <p class="text-sm font-medium line-clamp-1">{{ product.model?.name }}</p>
            <p class="text-xs text-gray-500">{{ product.variant?.storage }} · {{ product.variant?.color }}</p>
            <div class="flex items-baseline gap-2">
              <span class="price-tag">{{ product.sellingPrice?.toLocaleString() }}원</span>
            </div>
          </div>
        </NuxtLink>

        <!-- 데이터 없을 때 폴백 -->
        <template v-if="!productList.length">
          <div
            v-for="i in 8"
            :key="i"
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
              <p class="text-sm font-medium">상품 준비중</p>
              <p class="text-xs text-gray-500">곧 만나보실 수 있습니다</p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>
