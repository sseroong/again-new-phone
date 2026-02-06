<script setup lang="ts">
definePageMeta({
  layout: 'default',
});

useHead({ title: '결제 실패' });

const route = useRoute();
const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;
const authStore = useAuthStore();

const errorCode = route.query.code as string;
const errorMessage = route.query.message as string;
const orderId = route.query.orderId as string;

// 결제 실패 시 주문 자동 취소 (상품 AVAILABLE 복원)
const cancelAttempted = ref(false);

onMounted(async () => {
  if (orderId && authStore.tokens?.accessToken) {
    try {
      await $fetch(`${apiBase}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authStore.tokens.accessToken}`,
        },
      });
    } catch {
      // 취소 실패는 무시 (이미 취소되었거나 권한 없음)
    } finally {
      cancelAttempted.value = true;
    }
  }
});
</script>

<template>
  <div class="bg-gray-50 min-h-screen flex items-center justify-center">
    <div class="text-center py-20 max-w-md mx-auto px-4">
      <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-10 h-10 text-red-600" />
      </div>
      <h1 class="text-2xl font-bold mb-2">결제에 실패했습니다</h1>
      <p class="text-gray-500 mb-2">{{ errorMessage || '결제 처리 중 문제가 발생했습니다.' }}</p>
      <p v-if="errorCode" class="text-xs text-gray-400 mb-8">오류 코드: {{ errorCode }}</p>
      <p v-else class="mb-8" />

      <div class="flex flex-col gap-3">
        <UButton to="/buy" block size="lg">
          구매 목록으로 돌아가기
        </UButton>
        <UButton to="/mypage/orders" variant="outline" block size="lg">
          거래내역 확인
        </UButton>
      </div>
    </div>
  </div>
</template>
