<script setup lang="ts">
definePageMeta({ middleware: ['auth'] });
useHead({ title: '내 기기 관리' });

const authStore = useAuthStore();
const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;

const authHeaders = computed(() => ({
  Authorization: `Bearer ${authStore.tokens?.accessToken}`,
}));

const { data: sellData, pending } = await useAsyncData(
  'my-devices',
  () => $fetch<any>(`${apiBase}/sell-requests`, { headers: authHeaders.value }),
);

const devices = computed(() => {
  const data = sellData.value?.data || sellData.value || [];
  return Array.isArray(data) ? data : [];
});

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: '접수 대기', color: 'yellow' },
  QUOTED: { label: '견적 제안됨', color: 'blue' },
  ACCEPTED: { label: '견적 수락', color: 'blue' },
  SHIPPING: { label: '배송중', color: 'indigo' },
  INSPECTING: { label: '검수중', color: 'purple' },
  COMPLETED: { label: '완료', color: 'green' },
  CANCELLED: { label: '취소', color: 'red' },
};

function getStatus(status: string) {
  return statusLabels[status] || { label: status, color: 'gray' };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ko-KR');
}

function formatPrice(price: number | null) {
  if (!price) return '-';
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
}
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold">내 기기 관리</h1>
        <nav class="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <NuxtLink to="/" class="hover:text-gray-700">HOME</NuxtLink>
          <span>></span>
          <span class="text-gray-900">내 기기 관리</span>
        </nav>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="pending" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
      </div>

      <div v-else-if="!devices.length" class="text-center py-12 bg-white rounded-xl border border-gray-100">
        <UIcon name="i-heroicons-device-phone-mobile" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p class="text-gray-500">등록된 기기가 없습니다.</p>
        <p class="text-sm text-gray-400 mt-1">판매 접수를 하시면 기기 목록에 표시됩니다.</p>
        <UButton to="/sell" variant="outline" class="mt-4">판매하러 가기</UButton>
      </div>

      <div v-else class="space-y-4">
        <NuxtLink
          v-for="device in devices"
          :key="device.id"
          :to="`/my/sell-requests/${device.id}`"
          class="block bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <UIcon name="i-heroicons-device-phone-mobile" class="w-7 h-7 text-gray-400" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-medium text-gray-900 truncate">
                  {{ device.modelName || device.deviceName || '기기' }} {{ device.storage || '' }}
                </p>
                <UBadge
                  :color="getStatus(device.status).color as any"
                  variant="soft"
                  size="xs"
                >
                  {{ getStatus(device.status).label }}
                </UBadge>
              </div>
              <p class="text-sm text-gray-500 mt-1">
                {{ device.brand }} &middot; {{ device.selfGrade }}등급 &middot; {{ formatDate(device.createdAt) }}
              </p>
            </div>
            <div class="text-right flex-shrink-0">
              <p v-if="device.finalPrice" class="font-bold text-primary-600">{{ formatPrice(device.finalPrice) }}</p>
              <p v-else class="font-medium text-gray-600">{{ formatPrice(device.estimatedPrice) }}</p>
              <p v-if="!device.finalPrice" class="text-xs text-gray-400">예상 견적</p>
            </div>
            <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-gray-400 flex-shrink-0" />
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
