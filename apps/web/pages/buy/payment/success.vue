<script setup lang="ts">
definePageMeta({
  layout: 'default',
});

useHead({ title: '결제 완료' });

const route = useRoute();
const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;

const paymentKey = route.query.paymentKey as string;
const orderId = route.query.orderId as string;
const amount = Number(route.query.amount);

const isConfirming = ref(true);
const confirmError = ref('');
const orderData = ref<any>(null);

// 결제 승인 API 호출
const confirmPayment = async () => {
  if (!paymentKey || !orderId || !amount) {
    confirmError.value = '결제 정보가 올바르지 않습니다.';
    isConfirming.value = false;
    return;
  }

  try {
    const result = await $fetch<any>(`${apiBase}/orders/confirm`, {
      method: 'POST',
      body: { paymentKey, orderId, amount },
    });
    orderData.value = result;
  } catch (e: any) {
    confirmError.value = e?.data?.message || '결제 승인에 실패했습니다.';
  } finally {
    isConfirming.value = false;
  }
};

onMounted(() => {
  confirmPayment();
});
</script>

<template>
  <div class="bg-gray-50 min-h-screen flex items-center justify-center">
    <!-- 결제 확인 중 -->
    <div v-if="isConfirming" class="text-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
      <h1 class="text-xl font-bold mb-2">결제 확인 중...</h1>
      <p class="text-gray-500">잠시만 기다려주세요.</p>
    </div>

    <!-- 결제 성공 -->
    <div v-else-if="!confirmError" class="text-center py-20 max-w-md mx-auto px-4">
      <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <UIcon name="i-heroicons-check" class="w-10 h-10 text-green-600" />
      </div>
      <h1 class="text-2xl font-bold mb-2">결제가 완료되었습니다</h1>
      <p class="text-gray-500 mb-2">주문이 정상적으로 처리되었습니다.</p>
      <p class="text-sm text-gray-400 mb-8">주문번호: {{ orderId }}</p>

      <div class="flex flex-col gap-3">
        <UButton to="/my/transactions" block size="lg">
          주문 내역 확인하기
        </UButton>
        <UButton to="/buy" variant="outline" block size="lg">
          쇼핑 계속하기
        </UButton>
      </div>
    </div>

    <!-- 결제 실패 -->
    <div v-else class="text-center py-20 max-w-md mx-auto px-4">
      <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <UIcon name="i-heroicons-x-mark" class="w-10 h-10 text-red-600" />
      </div>
      <h1 class="text-2xl font-bold mb-2">결제 승인 실패</h1>
      <p class="text-gray-500 mb-8">{{ confirmError }}</p>

      <div class="flex flex-col gap-3">
        <UButton to="/buy" block size="lg">
          구매 목록으로 돌아가기
        </UButton>
      </div>
    </div>
  </div>
</template>
