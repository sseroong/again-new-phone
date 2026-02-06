<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

useHead({
  title: '판매 접수 완료',
});
</script>

<template>
  <div class="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
    <div class="text-center max-w-md">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <UIcon name="i-heroicons-check" class="w-8 h-8 text-green-600" />
      </div>

      <h1 class="text-2xl font-bold mb-2">판매 접수 완료!</h1>
      <p class="text-gray-500 mb-8">
        판매 접수가 정상적으로 완료되었습니다.<br />
        파트너 사업자의 견적이 도착하면 알려드리겠습니다.
      </p>

      <div class="flex gap-3 justify-center">
        <UButton to="/my/transactions" variant="outline" size="lg">
          거래내역 확인
        </UButton>
        <UButton to="/" size="lg">
          홈으로 가기
        </UButton>
      </div>
    </div>
  </div>
</template>
