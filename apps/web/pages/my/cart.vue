<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

useHead({
  title: '장바구니',
});

const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;
const cartStore = useCartStore();

// 장바구니 상품 정보
const cartItems = ref<any[]>([]);
const isLoading = ref(true);
const selectedItems = ref<Set<string>>(new Set());

// 장바구니 불러오기
const loadCart = async () => {
  isLoading.value = true;
  try {
    cartItems.value = await cartStore.fetchCartWithProducts();
    // AVAILABLE 상품만 기본 선택
    selectedItems.value = new Set(
      cartItems.value
        .filter(item => item.product.status === 'AVAILABLE')
        .map(item => item.productId),
    );
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadCart();
});

// 이미지 URL
function getImageUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${apiBase}${path}`;
}

// 전체 선택
const availableItems = computed(() =>
  cartItems.value.filter(item => item.product.status === 'AVAILABLE'),
);

const allSelected = computed(() =>
  availableItems.value.length > 0 &&
  availableItems.value.every(item => selectedItems.value.has(item.productId)),
);

const toggleAllSelection = () => {
  if (allSelected.value) {
    selectedItems.value.clear();
  } else {
    selectedItems.value = new Set(availableItems.value.map(item => item.productId));
  }
};

const toggleItemSelection = (productId: string) => {
  if (selectedItems.value.has(productId)) {
    selectedItems.value.delete(productId);
  } else {
    selectedItems.value.add(productId);
  }
};

// 상품 삭제
const removeFromCart = (productId: string) => {
  cartStore.removeItem(productId);
  selectedItems.value.delete(productId);
  cartItems.value = cartItems.value.filter(item => item.productId !== productId);
};

const removeSelectedItems = () => {
  if (selectedItems.value.size === 0) {
    const toast = useToast();
    toast.add({ title: '삭제할 상품을 선택해주세요', color: 'amber', icon: 'i-heroicons-information-circle' });
    return;
  }
  const ids = Array.from(selectedItems.value);
  cartStore.removeItems(ids);
  cartItems.value = cartItems.value.filter(item => !ids.includes(item.productId));
  selectedItems.value.clear();
};

// 총 금액
const totalAmount = computed(() =>
  cartItems.value
    .filter(item => selectedItems.value.has(item.productId))
    .reduce((sum, item) => sum + (item.product.sellingPrice || 0), 0),
);

const selectedCount = computed(() => selectedItems.value.size);

// 주문하기
const handleCheckout = () => {
  if (selectedItems.value.size === 0) {
    const toast = useToast();
    toast.add({ title: '주문할 상품을 선택해주세요', color: 'amber', icon: 'i-heroicons-information-circle' });
    return;
  }
  const productIds = Array.from(selectedItems.value).join(',');
  navigateTo(`/buy/checkout?productIds=${productIds}`);
};

// 상태 뱃지
const statusBadges: Record<string, { label: string; color: string }> = {
  AVAILABLE: { label: '구매 가능', color: 'green' },
  RESERVED: { label: '예약됨', color: 'amber' },
  SOLD: { label: '판매 완료', color: 'gray' },
  UNAVAILABLE: { label: '판매 불가', color: 'red' },
};
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Page Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold">장바구니</h1>
        <nav class="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <NuxtLink to="/" class="hover:text-gray-700">HOME</NuxtLink>
          <span>&rsaquo;</span>
          <span class="text-gray-900">장바구니</span>
        </nav>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 로딩 -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
        <span class="ml-2 text-gray-500">장바구니를 불러오는 중...</span>
      </div>

      <!-- 빈 장바구니 -->
      <div v-else-if="cartItems.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-shopping-cart" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 class="text-xl font-bold mb-2">장바구니가 비어있습니다</h2>
        <p class="text-gray-500 mb-6">원하시는 상품을 장바구니에 담아보세요</p>
        <UButton to="/buy" size="lg">구매하기</UButton>
      </div>

      <!-- 장바구니 목록 -->
      <template v-else>
        <div class="grid lg:grid-cols-3 gap-6">
          <!-- 왼쪽: 상품 목록 -->
          <div class="lg:col-span-2 space-y-4">
            <!-- 전체 선택 & 선택 삭제 -->
            <div class="bg-white rounded-xl p-4 flex items-center justify-between">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="allSelected"
                  class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  @change="toggleAllSelection"
                />
                <span class="text-sm font-medium">전체 선택 ({{ cartItems.length }})</span>
              </label>
              <UButton variant="ghost" color="red" size="sm" @click="removeSelectedItems">
                선택 삭제
              </UButton>
            </div>

            <!-- 상품 카드 -->
            <div
              v-for="item in cartItems"
              :key="item.productId"
              class="bg-white rounded-xl p-6"
            >
              <div class="flex gap-4">
                <!-- 체크박스 -->
                <div class="flex items-start pt-1">
                  <input
                    type="checkbox"
                    :checked="selectedItems.has(item.productId)"
                    :disabled="item.product.status !== 'AVAILABLE'"
                    class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                    @change="toggleItemSelection(item.productId)"
                  />
                </div>

                <!-- 상품 이미지 -->
                <NuxtLink
                  :to="`/buy/${item.productId}`"
                  class="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                >
                  <img
                    v-if="item.product.images?.length"
                    :src="getImageUrl(item.product.images[0])"
                    :alt="item.product.model?.name"
                    class="w-full h-full object-cover"
                  />
                  <UIcon v-else name="i-heroicons-device-phone-mobile" class="w-12 h-12 text-gray-300" />
                </NuxtLink>

                <!-- 상품 정보 -->
                <div class="flex-1 min-w-0">
                  <NuxtLink
                    :to="`/buy/${item.productId}`"
                    class="font-medium hover:text-primary-600 line-clamp-2"
                  >
                    {{ item.product.model?.name }} {{ item.product.variant?.storage }}
                  </NuxtLink>
                  <p class="text-sm text-gray-500 mt-1">{{ item.product.variant?.color }}</p>
                  <div class="flex items-center gap-2 mt-2">
                    <UBadge v-if="item.product.grade" size="xs" color="gray" variant="soft">
                      {{ item.product.grade }}등급
                    </UBadge>
                    <UBadge
                      size="xs"
                      :color="(statusBadges[item.product.status] || statusBadges.UNAVAILABLE).color"
                      variant="soft"
                    >
                      {{ (statusBadges[item.product.status] || statusBadges.UNAVAILABLE).label }}
                    </UBadge>
                  </div>
                </div>

                <!-- 가격 & 삭제 -->
                <div class="flex flex-col items-end justify-between">
                  <p class="text-xl font-bold text-primary-600">
                    {{ item.product.sellingPrice?.toLocaleString() }}원
                  </p>
                  <UButton
                    variant="ghost"
                    color="gray"
                    size="sm"
                    icon="i-heroicons-trash"
                    @click="removeFromCart(item.productId)"
                  >
                    삭제
                  </UButton>
                </div>
              </div>
            </div>
          </div>

          <!-- 오른쪽: 결제 정보 -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-xl p-6 sticky top-24">
              <h2 class="text-lg font-bold mb-4">결제 정보</h2>

              <div class="space-y-3 mb-6">
                <div class="flex justify-between">
                  <span class="text-gray-600">선택 상품 ({{ selectedCount }}개)</span>
                  <span class="font-medium">{{ totalAmount.toLocaleString() }}원</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">배송비</span>
                  <span class="text-primary-600 font-medium">무료</span>
                </div>
                <div class="border-t pt-3 flex justify-between">
                  <span class="font-bold text-lg">총 결제금액</span>
                  <span class="font-bold text-xl text-primary-600">
                    {{ totalAmount.toLocaleString() }}원
                  </span>
                </div>
              </div>

              <UButton
                block
                size="xl"
                :disabled="selectedCount === 0"
                @click="handleCheckout"
              >
                {{ selectedCount }}개 상품 주문하기
              </UButton>

              <div class="mt-4 space-y-2 text-xs text-gray-500">
                <p class="flex items-start gap-1">
                  <UIcon name="i-heroicons-information-circle" class="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>중고 상품은 재고가 1개씩만 존재합니다</span>
                </p>
                <p class="flex items-start gap-1">
                  <UIcon name="i-heroicons-information-circle" class="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>판매 완료된 상품은 자동으로 제거됩니다</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
