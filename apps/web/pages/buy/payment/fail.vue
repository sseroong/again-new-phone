<script setup lang="ts">
definePageMeta({
  layout: 'default',
});

useHead({ title: '결제 실패' });

const route = useRoute();

const errorCode = route.query.code as string;
const errorMessage = route.query.message as string;
const orderId = route.query.orderId as string;
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
        <UButton
          v-if="orderId"
          :to="`/buy/checkout?productId=${orderId}`"
          block
          size="lg"
        >
          다시 결제하기
        </UButton>
        <UButton to="/buy" variant="outline" block size="lg">
          구매 목록으로 돌아가기
        </UButton>
      </div>
    </div>
  </div>
</template>
