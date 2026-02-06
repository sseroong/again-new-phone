<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });

const route = useRoute();
const toast = useToast();
const apiFetch = useAdminFetch();
const id = route.params.id as string;

const { data: order, pending, refresh } = useAdminApi<any>(`/admin/orders/${id}`);

useHead({ title: computed(() => order.value ? `주문 ${order.value.orderNumber}` : '주문 상세') });

const statusFlow = ['PAID', 'PREPARING', 'SHIPPING', 'DELIVERED', 'COMPLETED'];
const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: '결제 대기',
  PAID: '결제 완료',
  PREPARING: '상품 준비중',
  SHIPPING: '배송중',
  DELIVERED: '배송 완료',
  COMPLETED: '거래 완료',
  CANCELLED: '취소',
  REFUNDED: '환불',
};
const statusColors: Record<string, string> = {
  PENDING_PAYMENT: 'gray',
  PAID: 'blue',
  PREPARING: 'yellow',
  SHIPPING: 'orange',
  DELIVERED: 'green',
  COMPLETED: 'emerald',
  CANCELLED: 'red',
  REFUNDED: 'purple',
};

const trackingNumber = ref('');
const trackingCompany = ref('');
const isUpdating = ref(false);

function formatPrice(price: number) {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
}

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleString('ko-KR');
}

function nextStatus(currentStatus: string): string | null {
  const idx = statusFlow.indexOf(currentStatus);
  return idx >= 0 && idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
}

async function updateStatus(newStatus: string) {
  isUpdating.value = true;
  try {
    await apiFetch(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: { status: newStatus },
    });
    toast.add({ title: `상태가 ${statusLabels[newStatus]}으로 변경되었습니다.`, color: 'green' });
    refresh();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '상태 변경 실패', color: 'red' });
  } finally {
    isUpdating.value = false;
  }
}

async function submitTracking() {
  if (!trackingNumber.value) {
    toast.add({ title: '송장번호를 입력해주세요.', color: 'red' });
    return;
  }
  isUpdating.value = true;
  try {
    await apiFetch(`/admin/orders/${id}/tracking`, {
      method: 'PATCH',
      body: {
        trackingNumber: trackingNumber.value,
        trackingCompany: trackingCompany.value || undefined,
      },
    });
    toast.add({ title: '송장번호가 등록되었습니다.', color: 'green' });
    refresh();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '송장 등록 실패', color: 'red' });
  } finally {
    isUpdating.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <UButton to="/orders" variant="ghost" color="gray" icon="i-heroicons-arrow-left" />
      <h1 class="text-2xl font-bold text-gray-900">주문 상세</h1>
    </div>

    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

    <template v-else-if="order">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 주문 정보 -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-semibold text-gray-900">주문 정보</h2>
              <UBadge :color="statusColors[order.status]" variant="subtle">
                {{ statusLabels[order.status] }}
              </UBadge>
            </div>
            <dl class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt class="text-gray-500">주문번호</dt>
                <dd class="font-medium">{{ order.orderNumber }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">주문자</dt>
                <dd class="font-medium">{{ order.user?.name }} ({{ order.user?.email }})</dd>
              </div>
              <div>
                <dt class="text-gray-500">총 금액</dt>
                <dd class="font-bold text-lg">{{ formatPrice(order.totalAmount) }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">주문일시</dt>
                <dd>{{ formatDate(order.createdAt) }}</dd>
              </div>
              <div v-if="order.trackingNumber">
                <dt class="text-gray-500">송장번호</dt>
                <dd class="font-medium">{{ order.trackingCompany }} {{ order.trackingNumber }}</dd>
              </div>
            </dl>
          </div>

          <!-- 주문 상품 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="font-semibold text-gray-900 mb-4">주문 상품</h2>
            <div class="divide-y divide-gray-100">
              <div v-for="item in order.items" :key="item.id" class="flex items-center justify-between py-3">
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ item.product?.title || '상품' }}</p>
                  <p class="text-xs text-gray-500">수량: {{ item.quantity }}</p>
                </div>
                <p class="text-sm font-medium">{{ formatPrice(item.price) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 사이드바: 상태 변경 + 송장 등록 -->
        <div class="space-y-6">
          <!-- 상태 변경 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="font-semibold text-gray-900 mb-4">상태 변경</h2>
            <div v-if="nextStatus(order.status)" class="space-y-3">
              <p class="text-sm text-gray-500">
                {{ statusLabels[order.status] }} → {{ statusLabels[nextStatus(order.status)!] }}
              </p>
              <UButton
                :label="`${statusLabels[nextStatus(order.status)!]}으로 변경`"
                block
                :loading="isUpdating"
                @click="updateStatus(nextStatus(order.status)!)"
              />
            </div>
            <p v-else class="text-sm text-gray-400">변경 가능한 상태가 없습니다.</p>
          </div>

          <!-- 송장번호 등록 -->
          <div
            v-if="order.status === 'PREPARING' || order.status === 'SHIPPING'"
            class="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <h2 class="font-semibold text-gray-900 mb-4">송장번호 등록</h2>
            <div class="space-y-3">
              <UFormGroup label="택배사">
                <UInput v-model="trackingCompany" placeholder="CJ대한통운" />
              </UFormGroup>
              <UFormGroup label="송장번호">
                <UInput v-model="trackingNumber" placeholder="123456789012" />
              </UFormGroup>
              <UButton
                label="송장 등록"
                block
                :loading="isUpdating"
                @click="submitTracking"
              />
            </div>
          </div>

          <!-- 타임라인 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="font-semibold text-gray-900 mb-4">타임라인</h2>
            <div class="space-y-3 text-sm">
              <div class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-gray-400" />
                <div>
                  <p class="text-gray-500">주문 생성</p>
                  <p class="text-xs text-gray-400">{{ formatDate(order.createdAt) }}</p>
                </div>
              </div>
              <div v-if="order.paidAt" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-blue-500" />
                <div>
                  <p class="text-gray-500">결제 완료</p>
                  <p class="text-xs text-gray-400">{{ formatDate(order.paidAt) }}</p>
                </div>
              </div>
              <div v-if="order.shippedAt" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-orange-500" />
                <div>
                  <p class="text-gray-500">배송 시작</p>
                  <p class="text-xs text-gray-400">{{ formatDate(order.shippedAt) }}</p>
                </div>
              </div>
              <div v-if="order.deliveredAt" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-green-500" />
                <div>
                  <p class="text-gray-500">배송 완료</p>
                  <p class="text-xs text-gray-400">{{ formatDate(order.deliveredAt) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
