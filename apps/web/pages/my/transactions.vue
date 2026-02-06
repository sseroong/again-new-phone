<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

useHead({
  title: '나의 거래내역',
});

const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;
const authStore = useAuthStore();

const activeTab = ref<'orders' | 'sell'>('orders');

const authHeaders = computed(() => ({
  Authorization: `Bearer ${authStore.tokens?.accessToken}`,
}));

// 구매 내역
const { data: ordersData, pending: ordersPending } = await useAsyncData(
  'my-orders',
  () => $fetch<any>(`${apiBase}/orders`, { headers: authHeaders.value }),
);

// 판매 내역
const { data: sellData, pending: sellPending } = await useAsyncData(
  'my-sells',
  () => $fetch<any>(`${apiBase}/sell-requests`, { headers: authHeaders.value }),
);

const orders = computed(() => ordersData.value?.data || ordersData.value || []);
const sellRequests = computed(() => sellData.value?.data || sellData.value || []);

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: '결제 대기', color: 'yellow' },
  PAID: { label: '결제 완료', color: 'blue' },
  PREPARING: { label: '배송 준비', color: 'blue' },
  SHIPPING: { label: '배송 중', color: 'indigo' },
  DELIVERED: { label: '배송 완료', color: 'green' },
  COMPLETED: { label: '거래 완료', color: 'green' },
  CANCELLED: { label: '취소됨', color: 'gray' },
  REFUNDED: { label: '환불됨', color: 'red' },
  PENDING: { label: '접수 대기', color: 'yellow' },
  QUOTED: { label: '견적 제안됨', color: 'blue' },
  ACCEPTED: { label: '견적 수락', color: 'blue' },
  INSPECTING: { label: '검수 중', color: 'indigo' },
};

const getStatus = (status: string) => statusLabels[status] || { label: status, color: 'gray' };
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Page Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold">나의 거래내역</h1>
        <nav class="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <NuxtLink to="/" class="hover:text-gray-700">HOME</NuxtLink>
          <span>></span>
          <span class="text-gray-900">나의 거래내역</span>
        </nav>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 탭 -->
      <div class="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          class="px-6 py-2 text-sm font-medium rounded-md transition-colors"
          :class="activeTab === 'orders' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'orders'"
        >
          구매 내역 ({{ Array.isArray(orders) ? orders.length : 0 }})
        </button>
        <button
          class="px-6 py-2 text-sm font-medium rounded-md transition-colors"
          :class="activeTab === 'sell' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'sell'"
        >
          판매 내역 ({{ Array.isArray(sellRequests) ? sellRequests.length : 0 }})
        </button>
      </div>

      <!-- 구매 내역 -->
      <div v-if="activeTab === 'orders'">
        <div v-if="ordersPending" class="flex justify-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
        </div>

        <div v-else-if="!orders.length" class="text-center py-12">
          <UIcon name="i-heroicons-shopping-bag" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p class="text-gray-500">구매 내역이 없습니다.</p>
          <UButton to="/buy" variant="outline" class="mt-4">구매하러 가기</UButton>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="order in orders"
            :key="order.id"
            class="bg-white rounded-xl p-6 border border-gray-100"
          >
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="text-sm text-gray-500">
                  {{ new Date(order.createdAt).toLocaleDateString('ko-KR') }}
                </p>
                <p class="text-xs text-gray-400">주문번호: {{ order.orderNumber || order.id.slice(0, 8) }}</p>
              </div>
              <UBadge
                :color="getStatus(order.status).color as any"
                variant="soft"
              >
                {{ getStatus(order.status).label }}
              </UBadge>
            </div>

            <div class="flex items-center gap-4">
              <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <UIcon name="i-heroicons-device-phone-mobile" class="w-8 h-8 text-gray-300" />
              </div>
              <div class="flex-1">
                <p class="font-medium">
                  {{ order.items?.[0]?.product?.model?.name }}
                  <span v-if="order.items?.length > 1" class="text-gray-500">
                    외 {{ order.items.length - 1 }}건
                  </span>
                </p>
                <p class="text-sm text-gray-500">{{ order.items?.[0]?.product?.variant?.storage }} · {{ order.items?.[0]?.product?.variant?.color }}</p>
              </div>
              <p class="font-bold text-lg">{{ order.totalAmount?.toLocaleString() }}원</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 판매 내역 -->
      <div v-if="activeTab === 'sell'">
        <div v-if="sellPending" class="flex justify-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
        </div>

        <div v-else-if="!sellRequests.length" class="text-center py-12">
          <UIcon name="i-heroicons-arrow-up-tray" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p class="text-gray-500">판매 내역이 없습니다.</p>
          <UButton to="/sell" variant="outline" class="mt-4">판매하러 가기</UButton>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="sell in sellRequests"
            :key="sell.id"
            class="bg-white rounded-xl p-6 border border-gray-100"
          >
            <div class="flex items-center justify-between mb-4">
              <p class="text-sm text-gray-500">
                {{ new Date(sell.createdAt).toLocaleDateString('ko-KR') }}
              </p>
              <UBadge
                :color="getStatus(sell.status).color as any"
                variant="soft"
              >
                {{ getStatus(sell.status).label }}
              </UBadge>
            </div>

            <div class="flex items-center gap-4">
              <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <UIcon name="i-heroicons-device-phone-mobile" class="w-8 h-8 text-gray-300" />
              </div>
              <div class="flex-1">
                <p class="font-medium">{{ sell.modelName }} {{ sell.storage }}</p>
                <p class="text-sm text-gray-500">{{ sell.brand }} · {{ sell.selfGrade }}등급</p>
              </div>
              <div class="text-right">
                <p v-if="sell.finalPrice" class="font-bold text-lg text-primary-600">
                  {{ sell.finalPrice.toLocaleString() }}원
                </p>
                <p v-else class="font-bold text-lg">
                  {{ sell.estimatedPrice?.toLocaleString() }}원
                </p>
                <p v-if="!sell.finalPrice" class="text-xs text-gray-400">예상 견적</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
