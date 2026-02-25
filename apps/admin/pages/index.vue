<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });
useHead({ title: '대시보드' });

const startDate = ref('');
const endDate = ref('');

const queryString = computed(() => {
  const params = new URLSearchParams();
  if (startDate.value) params.set('startDate', startDate.value);
  if (endDate.value) params.set('endDate', endDate.value);
  const qs = params.toString();
  return `/admin/dashboard${qs ? '?' + qs : ''}`;
});

const { data: stats, pending, refresh } = useAdminApi<any>(queryString);

function clearDateFilter() {
  startDate.value = '';
  endDate.value = '';
}

const orderStatusColor: Record<string, string> = {
  PENDING_PAYMENT: 'gray',
  PAID: 'blue',
  PREPARING: 'yellow',
  SHIPPING: 'orange',
  DELIVERED: 'green',
  COMPLETED: 'emerald',
  CANCELLED: 'red',
  REFUNDED: 'purple',
};

const sellStatusColor: Record<string, string> = {
  PENDING: 'gray',
  QUOTED: 'blue',
  ACCEPTED: 'yellow',
  SHIPPING: 'orange',
  INSPECTING: 'purple',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

const orderStatusLabel: Record<string, string> = {
  PENDING_PAYMENT: '결제 대기',
  PAID: '결제 완료',
  PREPARING: '상품 준비중',
  SHIPPING: '배송중',
  DELIVERED: '배송 완료',
  COMPLETED: '거래 완료',
  CANCELLED: '취소',
  REFUNDED: '환불',
};

const sellStatusLabel: Record<string, string> = {
  PENDING: '접수 대기',
  QUOTED: '견적 제안됨',
  ACCEPTED: '견적 수락',
  SHIPPING: '배송중',
  INSPECTING: '검수중',
  COMPLETED: '완료',
  CANCELLED: '취소',
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ko-KR');
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">대시보드</h1>
      <!-- 날짜 필터 -->
      <div class="flex items-center gap-2">
        <UInput v-model="startDate" type="date" size="sm" class="w-40" placeholder="시작일" />
        <span class="text-gray-400">~</span>
        <UInput v-model="endDate" type="date" size="sm" class="w-40" placeholder="종료일" />
        <UButton
          v-if="startDate || endDate"
          variant="ghost"
          color="gray"
          icon="i-heroicons-x-mark"
          size="xs"
          @click="clearDateFilter"
        />
      </div>
    </div>

    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

    <template v-else-if="stats">
      <!-- 통계 카드 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="stat-card">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-shopping-bag" class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">총 주문</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.stats?.totalOrders?.toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">총 매출</p>
              <p class="text-2xl font-bold text-gray-900">{{ formatPrice(stats.stats?.totalRevenue || 0) }}</p>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-users" class="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">활성 회원</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.stats?.activeUsers?.toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">대기 판매접수</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.stats?.pendingSellRequests?.toLocaleString() }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 최근 주문 / 최근 판매접수 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 최근 주문 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 class="font-semibold text-gray-900">최근 주문</h2>
            <NuxtLink to="/orders" class="text-sm text-primary-600 hover:underline">전체 보기</NuxtLink>
          </div>
          <div class="divide-y divide-gray-50">
            <NuxtLink
              v-for="order in stats.recentOrders"
              :key="order.id"
              :to="`/orders/${order.id}`"
              class="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              <div>
                <p class="text-sm font-medium text-gray-900">{{ order.orderNumber }}</p>
                <p class="text-xs text-gray-500">{{ order.user?.name }} &middot; {{ formatDate(order.createdAt) }}</p>
              </div>
              <div class="text-right">
                <UBadge :color="orderStatusColor[order.status] || 'gray'" variant="subtle" size="xs">
                  {{ orderStatusLabel[order.status] || order.status }}
                </UBadge>
                <p class="text-sm font-medium text-gray-900 mt-1">{{ formatPrice(order.totalAmount) }}</p>
              </div>
            </NuxtLink>
            <div v-if="!stats.recentOrders?.length" class="px-6 py-8 text-center text-sm text-gray-400">
              최근 주문이 없습니다
            </div>
          </div>
        </div>

        <!-- 최근 판매접수 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 class="font-semibold text-gray-900">최근 판매접수</h2>
            <NuxtLink to="/sell-requests" class="text-sm text-primary-600 hover:underline">전체 보기</NuxtLink>
          </div>
          <div class="divide-y divide-gray-50">
            <NuxtLink
              v-for="sr in stats.recentSellRequests"
              :key="sr.id"
              :to="`/sell-requests/${sr.id}`"
              class="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              <div>
                <p class="text-sm font-medium text-gray-900">{{ sr.modelName || '기기' }}</p>
                <p class="text-xs text-gray-500">{{ sr.user?.name }} &middot; {{ formatDate(sr.createdAt) }}</p>
              </div>
              <UBadge :color="sellStatusColor[sr.status] || 'gray'" variant="subtle" size="xs">
                {{ sellStatusLabel[sr.status] || sr.status }}
              </UBadge>
            </NuxtLink>
            <div v-if="!stats.recentSellRequests?.length" class="px-6 py-8 text-center text-sm text-gray-400">
              최근 판매접수가 없습니다
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
