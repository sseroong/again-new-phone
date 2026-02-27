<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });

const route = useRoute();
const toast = useToast();
const apiFetch = useAdminFetch();
const id = route.params.id as string;

const { data: shipping, pending, refresh } = useAdminApi<any>(`/admin/orders/${id}/shipping`);

useHead({ title: computed(() => shipping.value ? `배송 ${shipping.value.orderNumber}` : '배송 상세') });

const statusLabels: Record<string, string> = {
  PAID: '결제 완료',
  PREPARING: '상품 준비중',
  SHIPPING: '배송중',
  DELIVERED: '배송 완료',
  COMPLETED: '거래 완료',
  CANCELLED: '취소',
  REFUNDED: '환불',
};

const statusColors: Record<string, string> = {
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

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleString('ko-KR');
}

const statusFlow = ['PAID', 'PREPARING', 'SHIPPING', 'DELIVERED', 'COMPLETED'];

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
      <UButton to="/shipping" variant="ghost" color="gray" icon="i-heroicons-arrow-left" />
      <h1 class="text-2xl font-bold text-gray-900">배송 상세</h1>
    </div>

    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

    <template v-else-if="shipping">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 메인 정보 -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 주문 정보 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-semibold text-gray-900">주문 정보</h2>
              <UBadge :color="statusColors[shipping.status]" variant="subtle">
                {{ statusLabels[shipping.status] }}
              </UBadge>
            </div>
            <dl class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt class="text-gray-500">주문번호</dt>
                <dd class="font-medium">{{ shipping.orderNumber }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">주문자</dt>
                <dd class="font-medium">
                  {{ shipping.user?.name || '-' }}
                  <span v-if="shipping.user?.email" class="text-gray-400">({{ shipping.user.email }})</span>
                </dd>
              </div>
              <div>
                <dt class="text-gray-500">주문일시</dt>
                <dd>{{ formatDate(shipping.createdAt) }}</dd>
              </div>
              <div v-if="shipping.user?.phone">
                <dt class="text-gray-500">주문자 연락처</dt>
                <dd>{{ shipping.user.phone }}</dd>
              </div>
            </dl>
          </div>

          <!-- 배송지 정보 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="font-semibold text-gray-900 mb-4">배송지 정보</h2>
            <dl class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt class="text-gray-500">수취인</dt>
                <dd class="font-medium text-lg">{{ shipping.shippingName || '-' }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">연락처</dt>
                <dd class="font-medium text-lg">{{ shipping.shippingPhone || '-' }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-gray-500">배송 주소</dt>
                <dd class="font-medium">
                  <template v-if="shipping.shippingAddress">
                    ({{ shipping.shippingZipCode }}) {{ shipping.shippingAddress }} {{ shipping.shippingDetail }}
                  </template>
                  <template v-else>-</template>
                </dd>
              </div>
              <div v-if="shipping.shippingMemo" class="col-span-2">
                <dt class="text-gray-500">배송 메모</dt>
                <dd class="bg-gray-50 rounded-lg p-3 text-gray-700">{{ shipping.shippingMemo }}</dd>
              </div>
            </dl>
          </div>

          <!-- 송장 정보 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="font-semibold text-gray-900 mb-4">송장 정보</h2>
            <dl class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt class="text-gray-500">택배사</dt>
                <dd class="font-medium">{{ shipping.trackingCompany || '-' }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">송장번호</dt>
                <dd class="font-medium">{{ shipping.trackingNumber || '-' }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">출고일시</dt>
                <dd>{{ formatDate(shipping.shippedAt) }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">배송 완료일시</dt>
                <dd>{{ formatDate(shipping.deliveredAt) }}</dd>
              </div>
              <div v-if="shipping.completedAt">
                <dt class="text-gray-500">거래 완료일시</dt>
                <dd>{{ formatDate(shipping.completedAt) }}</dd>
              </div>
            </dl>
          </div>

          <!-- 주문 상품 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="font-semibold text-gray-900 mb-4">주문 상품</h2>
            <div class="divide-y divide-gray-100">
              <div v-for="item in shipping.items" :key="item.id" class="flex items-center justify-between py-3">
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {{ item.product?.model?.name || '' }} {{ item.product?.variant?.storage || '' }} {{ item.product?.variant?.color || '' }}
                  </p>
                  <p class="text-xs text-gray-500">수량: {{ item.quantity }}</p>
                </div>
                <p class="text-sm font-medium">{{ new Intl.NumberFormat('ko-KR').format(item.price) }}원</p>
              </div>
              <div v-if="!shipping.items?.length" class="py-4 text-center text-sm text-gray-400">
                주문 상품이 없습니다.
              </div>
            </div>
          </div>
        </div>

        <!-- 사이드바 -->
        <div class="space-y-6">
          <!-- 상태 변경 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="font-semibold text-gray-900 mb-4">상태 변경</h2>
            <div v-if="nextStatus(shipping.status)" class="space-y-3">
              <p class="text-sm text-gray-500">
                {{ statusLabels[shipping.status] }} → {{ statusLabels[nextStatus(shipping.status)!] }}
              </p>
              <UButton
                :label="`${statusLabels[nextStatus(shipping.status)!]}으로 변경`"
                block
                :loading="isUpdating"
                @click="updateStatus(nextStatus(shipping.status)!)"
              />
            </div>
            <p v-else class="text-sm text-gray-400">변경 가능한 상태가 없습니다.</p>
          </div>

          <!-- 송장번호 등록 -->
          <div
            v-if="shipping.status === 'PREPARING' || shipping.status === 'SHIPPING'"
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

          <!-- 관련 링크 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="font-semibold text-gray-900 mb-4">관련 페이지</h2>
            <div class="space-y-2">
              <UButton
                :to="`/orders/${id}`"
                variant="outline"
                color="gray"
                icon="i-heroicons-shopping-bag"
                label="주문 상세"
                block
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
