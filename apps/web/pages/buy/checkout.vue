<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

useHead({
  title: '주문서 작성',
  script: [
    { src: 'https://js.tosspayments.com/v2/standard' },
  ],
});

const route = useRoute();
const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;
const tossClientKey = config.public.tossClientKey as string;
const authStore = useAuthStore();

const productId = route.query.productId as string;

if (!productId) {
  navigateTo('/buy');
}

const authHeaders = computed(() => ({
  Authorization: `Bearer ${authStore.tokens?.accessToken}`,
}));

// 상품 정보 조회
const { data: product } = await useAsyncData(
  `checkout-product-${productId}`,
  () => $fetch<any>(`${apiBase}/products/${productId}`),
);

// 배송지 목록 조회
const { data: addresses } = await useAsyncData(
  'my-addresses',
  () => $fetch<any[]>(`${apiBase}/users/me/addresses`, { headers: authHeaders.value }),
);

// 배송 정보 폼
const shippingForm = reactive({
  shippingName: '',
  shippingPhone: '',
  shippingZipCode: '',
  shippingAddress: '',
  shippingDetail: '',
  shippingMemo: '',
});

// 기본 배송지 자동 선택
const savedAddresses = computed(() => addresses.value || []);

const selectAddress = (address: any) => {
  shippingForm.shippingName = address.name;
  shippingForm.shippingPhone = address.phone;
  shippingForm.shippingZipCode = address.zipCode;
  shippingForm.shippingAddress = address.address;
  shippingForm.shippingDetail = address.detail || '';
};

// 기본 배송지 자동 적용
watchEffect(() => {
  const defaultAddr = savedAddresses.value.find((a: any) => a.isDefault);
  if (defaultAddr && !shippingForm.shippingName) {
    selectAddress(defaultAddr);
  }
});

// 주문 & 결제
const isProcessing = ref(false);
const errorMessage = ref('');

const handlePayment = async () => {
  // 폼 검증
  if (!shippingForm.shippingName || !shippingForm.shippingPhone ||
      !shippingForm.shippingZipCode || !shippingForm.shippingAddress ||
      !shippingForm.shippingDetail) {
    errorMessage.value = '배송 정보를 모두 입력해주세요.';
    return;
  }

  // 결제 모듈 사전 확인 (주문 생성 전에 체크)
  const tossPayments = (window as any).TossPayments;
  if (!tossPayments) {
    errorMessage.value = '결제 모듈을 불러올 수 없습니다. 페이지를 새로고침해주세요.';
    return;
  }

  isProcessing.value = true;
  errorMessage.value = '';

  let createdOrderId = '';

  try {
    // 1. 주문 생성
    const body: Record<string, any> = {
      items: [{ productId, quantity: 1 }],
      shippingName: shippingForm.shippingName,
      shippingPhone: shippingForm.shippingPhone,
      shippingZipCode: shippingForm.shippingZipCode,
      shippingAddress: shippingForm.shippingAddress,
      shippingDetail: shippingForm.shippingDetail,
    };
    if (shippingForm.shippingMemo) {
      body.shippingMemo = shippingForm.shippingMemo;
    }

    const order = await $fetch<any>(`${apiBase}/orders`, {
      method: 'POST',
      headers: authHeaders.value,
      body,
    });

    createdOrderId = order.id;

    // 2. Toss Payment Widget 호출
    const payment = tossPayments(tossClientKey);
    const widget = payment.widgets({ customerKey: authStore.user?.id || 'ANONYMOUS' });

    await widget.setAmount({ currency: 'KRW', value: order.totalAmount });

    await widget.requestPayment({
      orderId: order.orderNumber,
      orderName: product.value?.model?.name
        ? `${product.value.model.name} ${product.value.variant?.storage || ''}`
        : '상품 구매',
      successUrl: `${window.location.origin}/buy/payment/success`,
      failUrl: `${window.location.origin}/buy/payment/fail?orderId=${order.orderNumber}`,
      customerEmail: authStore.user?.email,
      customerName: shippingForm.shippingName,
      customerMobilePhone: shippingForm.shippingPhone.replace(/-/g, ''),
    });
  } catch (e: any) {
    // 결제 실패 시 생성된 주문 취소 (상품 상태 AVAILABLE 복원)
    if (createdOrderId) {
      try {
        await $fetch(`${apiBase}/orders/${createdOrderId}`, {
          method: 'DELETE',
          headers: authHeaders.value,
        });
      } catch {
        // 취소 실패는 무시
      }
    }

    if (e?.code === 'USER_CANCEL') {
      errorMessage.value = '';
    } else {
      const msg = e?.data?.message;
      errorMessage.value = Array.isArray(msg) ? msg.join(', ') : (msg || e?.message || '주문 처리 중 오류가 발생했습니다.');
    }
  } finally {
    isProcessing.value = false;
  }
};
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Page Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold">주문서 작성</h1>
        <nav class="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <NuxtLink to="/" class="hover:text-gray-700">HOME</NuxtLink>
          <span>›</span>
          <NuxtLink to="/buy" class="hover:text-gray-700">구매하기</NuxtLink>
          <span>›</span>
          <span class="text-gray-900">주문서 작성</span>
        </nav>
      </div>
    </div>

    <div v-if="!product" class="max-w-4xl mx-auto px-4 py-12 text-center">
      <p class="text-gray-500">상품 정보를 불러올 수 없습니다.</p>
      <UButton to="/buy" variant="outline" class="mt-4">구매 목록으로</UButton>
    </div>

    <div v-else class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- 에러 메시지 -->
      <UAlert
        v-if="errorMessage"
        color="red"
        variant="soft"
        :title="errorMessage"
        icon="i-heroicons-exclamation-triangle"
      />

      <!-- 주문 상품 정보 -->
      <div class="bg-white rounded-xl p-6">
        <h2 class="text-lg font-bold mb-4">주문 상품</h2>
        <div class="flex items-center gap-4">
          <div class="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <UIcon name="i-heroicons-device-phone-mobile" class="w-10 h-10 text-gray-300" />
          </div>
          <div class="flex-1">
            <p class="font-medium">{{ product.model?.name }} {{ product.variant?.storage }}</p>
            <p class="text-sm text-gray-500">{{ product.variant?.color }}</p>
            <div class="flex items-center gap-2 mt-1">
              <span v-if="product.grade" class="text-xs bg-gray-100 px-2 py-0.5 rounded">
                {{ product.grade }}등급
              </span>
              <span v-if="product.batteryHealth" class="text-xs text-gray-500">
                배터리 {{ product.batteryHealth }}%
              </span>
            </div>
          </div>
          <p class="text-xl font-bold text-primary-600">
            {{ product.sellingPrice?.toLocaleString() }}원
          </p>
        </div>
      </div>

      <!-- 배송지 정보 -->
      <div class="bg-white rounded-xl p-6">
        <h2 class="text-lg font-bold mb-4">배송 정보</h2>

        <!-- 저장된 배송지 -->
        <div v-if="savedAddresses.length" class="mb-6">
          <p class="text-sm text-gray-600 mb-2">저장된 배송지</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="addr in savedAddresses"
              :key="addr.id"
              class="px-3 py-2 border rounded-lg text-sm hover:border-primary-500 transition-colors"
              :class="shippingForm.shippingAddress === addr.address ? 'border-primary-500 bg-primary-50' : 'border-gray-200'"
              @click="selectAddress(addr)"
            >
              {{ addr.name }} - {{ addr.address }}
              <span v-if="addr.isDefault" class="ml-1 text-xs text-primary-600">(기본)</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <UFormGroup label="수령인" required>
            <UInput v-model="shippingForm.shippingName" placeholder="이름" />
          </UFormGroup>
          <UFormGroup label="연락처" required>
            <UInput v-model="shippingForm.shippingPhone" placeholder="010-0000-0000" />
          </UFormGroup>
          <UFormGroup label="우편번호" required>
            <UInput v-model="shippingForm.shippingZipCode" placeholder="우편번호" />
          </UFormGroup>
          <div />
          <UFormGroup label="주소" required class="col-span-2">
            <UInput v-model="shippingForm.shippingAddress" placeholder="기본 주소" />
          </UFormGroup>
          <UFormGroup label="상세 주소" required class="col-span-2">
            <UInput v-model="shippingForm.shippingDetail" placeholder="상세 주소" />
          </UFormGroup>
          <UFormGroup label="배송 메모" class="col-span-2">
            <UInput v-model="shippingForm.shippingMemo" placeholder="배송 시 요청사항 (선택)" />
          </UFormGroup>
        </div>
      </div>

      <!-- 결제 요약 -->
      <div class="bg-white rounded-xl p-6">
        <h2 class="text-lg font-bold mb-4">결제 금액</h2>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-gray-600">상품 금액</span>
            <span>{{ product.sellingPrice?.toLocaleString() }}원</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">배송비</span>
            <span class="text-primary-600">무료</span>
          </div>
          <div class="border-t pt-3 flex justify-between">
            <span class="font-bold text-lg">총 결제금액</span>
            <span class="font-bold text-xl text-primary-600">
              {{ product.sellingPrice?.toLocaleString() }}원
            </span>
          </div>
        </div>
      </div>

      <!-- 결제 버튼 -->
      <UButton
        block
        size="xl"
        :loading="isProcessing"
        @click="handlePayment"
      >
        {{ product.sellingPrice?.toLocaleString() }}원 결제하기
      </UButton>
    </div>
  </div>
</template>
