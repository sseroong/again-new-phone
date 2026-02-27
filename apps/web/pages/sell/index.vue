<script setup lang="ts">
import {
  DEVICE_CATEGORIES,
  BRANDS,
  SELL_GRADES,
  TRADE_METHODS,
  type DeviceCategory,
  type Brand,
} from '@phone-marketplace/shared';

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

useHead({
  title: '판매하기',
});

const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;
const authStore = useAuthStore();

// 판매 단계
const currentStep = ref(1);
const totalSteps = 4;
const isSubmitting = ref(false);
const submitError = ref('');

// 선택 데이터
const selectedCategory = ref<DeviceCategory | null>(null);
const selectedBrand = ref<Brand | null>(null);
const selectedModel = ref<string | null>(null);
const selectedVariant = ref<string | null>(null);
const selectedGrade = ref<keyof typeof SELL_GRADES | null>(null);
const selectedTradeMethod = ref<keyof typeof TRADE_METHODS | null>(null);

// 카테고리 목록
const categories = Object.entries(DEVICE_CATEGORIES).map(([key, value]) => ({
  key: key as DeviceCategory,
  ...value,
}));

// 브랜드 목록
const brands = Object.entries(BRANDS).map(([key, value]) => ({
  key: key as Brand,
  ...value,
}));

// API - 모델 목록
const { data: modelsData } = await useAsyncData(
  'sell-models',
  () => {
    if (!selectedBrand.value || !selectedCategory.value) return Promise.resolve([]);
    return $fetch<any[]>(`${apiBase}/products/models`, {
      params: { category: selectedCategory.value, brand: selectedBrand.value },
    });
  },
  { watch: [selectedBrand, selectedCategory] }
);

const models = computed(() => {
  if (modelsData.value?.length) {
    return modelsData.value.map((m: any) => m.name || m.model || m);
  }
  // 폴백 데이터
  if (!selectedBrand.value) return [];
  const fallback: Record<Brand, string[]> = {
    APPLE: ['아이폰 15 Pro Max', '아이폰 15 Pro', '아이폰 15', '아이폰 14 Pro Max', '아이폰 14 Pro', '아이폰 14'],
    SAMSUNG: ['갤럭시 S24 울트라', '갤럭시 S24+', '갤럭시 S24', '갤럭시 Z플립6', '갤럭시 Z폴드6'],
    LG: ['LG 벨벳', 'LG V50', 'LG G8'],
    LENOVO: ['레노버 P11', '레노버 Tab M10'],
    OTHER: ['기타 모델'],
  };
  return fallback[selectedBrand.value] || [];
});

// 용량 옵션
const variants = ['64GB', '128GB', '256GB', '512GB', '1TB'];

// API - 예상 견적
const { data: estimateData } = await useAsyncData(
  'sell-estimate',
  () => {
    if (!selectedModel.value || !selectedGrade.value || !selectedVariant.value) return Promise.resolve(null);
    return $fetch<any>(`${apiBase}/sell-requests/estimate/price`, {
      params: {
        model: selectedModel.value,
        grade: selectedGrade.value,
        variant: selectedVariant.value,
      },
    }).catch(() => null);
  },
  { watch: [selectedModel, selectedGrade, selectedVariant] }
);

const estimatedPrice = computed(() => {
  if (estimateData.value?.price) return estimateData.value.price;
  // 폴백 계산
  if (!selectedModel.value || !selectedGrade.value) return null;
  const basePrices: Record<string, number> = {
    '아이폰 15 Pro Max': 1200000,
    '아이폰 15 Pro': 1000000,
    '아이폰 15': 800000,
    '갤럭시 S24 울트라': 1100000,
    '갤럭시 S24+': 900000,
    '갤럭시 S24': 700000,
  };
  const gradeMultipliers: Record<string, number> = {
    A: 1, B: 0.85, C: 0.7, D: 0.5, E: 0.3,
  };
  const basePrice = basePrices[selectedModel.value] || 500000;
  const multiplier = gradeMultipliers[selectedGrade.value] || 0.5;
  return Math.round(basePrice * multiplier);
});

// 단계 이동
const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

// 다음 단계 가능 여부
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1: return selectedCategory.value !== null;
    case 2: return selectedBrand.value !== null && selectedModel.value !== null && selectedVariant.value !== null;
    case 3: return selectedGrade.value !== null;
    case 4: return selectedTradeMethod.value !== null;
    default: return false;
  }
});

// 판매 접수
const handleSubmit = async () => {
  if (!canProceed.value) return;

  isSubmitting.value = true;
  submitError.value = '';

  try {
    await $fetch(`${apiBase}/sell-requests`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.tokens?.accessToken}`,
      },
      body: {
        category: selectedCategory.value,
        brand: selectedBrand.value,
        modelName: selectedModel.value,
        storage: selectedVariant.value,
        selfGrade: selectedGrade.value,
        tradeMethod: selectedTradeMethod.value,
        estimatedPrice: estimatedPrice.value,
        deviceCondition: {
          powerOn: true,
          screenCondition: selectedGrade.value ? SELL_GRADES[selectedGrade.value].screenCondition : '',
          bodyCondition: selectedGrade.value ? SELL_GRADES[selectedGrade.value].bodyCondition : '',
          buttonsWorking: true,
        },
      },
    });

    navigateTo('/sell/complete');
  } catch (e: any) {
    submitError.value = e?.data?.message || '판매 접수에 실패했습니다.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Page Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold">판매하기</h1>
        <nav class="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <NuxtLink to="/" class="hover:text-gray-700">HOME</NuxtLink>
          <span>></span>
          <span class="text-gray-900">판매하기</span>
        </nav>
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 진행 상태 -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-500">{{ currentStep }} / {{ totalSteps }}</span>
        </div>
        <UProgress :value="(currentStep / totalSteps) * 100" />
      </div>

      <!-- 에러 메시지 -->
      <UAlert
        v-if="submitError"
        color="red"
        variant="soft"
        :title="submitError"
        icon="i-heroicons-exclamation-triangle"
        class="mb-4"
      />

      <!-- Step 1: 카테고리 선택 -->
      <div v-if="currentStep === 1" class="bg-white rounded-xl p-6">
        <h2 class="text-lg font-bold mb-4">판매할 기기 종류를 선택해주세요</h2>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <button
            v-for="category in categories"
            :key="category.key"
            class="flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all"
            :class="[
              selectedCategory === category.key
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            ]"
            @click="selectedCategory = category.key"
          >
            <UIcon :name="category.icon" class="w-10 h-10 text-primary-600" />
            <span class="font-medium">{{ category.label }}</span>
          </button>
        </div>
      </div>

      <!-- Step 2: 모델 선택 -->
      <div v-else-if="currentStep === 2" class="bg-white rounded-xl p-6 space-y-6">
        <h2 class="text-lg font-bold mb-4">기기 정보를 선택해주세요</h2>

        <!-- 브랜드 선택 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">브랜드</label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="brand in brands"
              :key="brand.key"
              class="px-4 py-2 rounded-lg border text-sm transition-all"
              :class="[
                selectedBrand === brand.key
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              ]"
              @click="selectedBrand = brand.key; selectedModel = null"
            >
              {{ brand.label }}
            </button>
          </div>
        </div>

        <!-- 모델 선택 -->
        <div v-if="selectedBrand">
          <label class="block text-sm font-medium text-gray-700 mb-2">모델</label>
          <USelectMenu
            v-model="selectedModel"
            :options="models"
            placeholder="모델을 선택하세요"
          />
        </div>

        <!-- 용량 선택 -->
        <div v-if="selectedModel">
          <label class="block text-sm font-medium text-gray-700 mb-2">저장 용량</label>
          <div class="grid grid-cols-5 gap-2">
            <button
              v-for="variant in variants"
              :key="variant"
              class="px-4 py-2 rounded-lg border text-sm transition-all"
              :class="[
                selectedVariant === variant
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              ]"
              @click="selectedVariant = variant"
            >
              {{ variant }}
            </button>
          </div>
        </div>
      </div>

      <!-- Step 3: 상태 선택 -->
      <div v-else-if="currentStep === 3" class="bg-white rounded-xl p-6">
        <h2 class="text-lg font-bold mb-4">기기 상태를 선택해주세요</h2>

        <div class="space-y-3">
          <button
            v-for="(grade, key) in SELL_GRADES"
            :key="key"
            class="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all"
            :class="[
              selectedGrade === key
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            ]"
            @click="selectedGrade = key as keyof typeof SELL_GRADES"
          >
            <span class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-lg">
              {{ key }}
            </span>
            <div class="flex-1">
              <p class="font-medium">{{ grade.label }}</p>
              <p class="text-sm text-gray-500">
                {{ grade.screenCondition }}, {{ grade.bodyCondition }}
              </p>
            </div>
            <UIcon
              v-if="selectedGrade === key"
              name="i-heroicons-check-circle-solid"
              class="w-6 h-6 text-primary-600"
            />
          </button>
        </div>

        <!-- 예상 견적 -->
        <div v-if="estimatedPrice" class="mt-6 p-4 bg-primary-50 rounded-xl">
          <p class="text-sm text-primary-700 mb-1">예상 견적</p>
          <p class="text-2xl font-bold text-primary-600">
            {{ estimatedPrice.toLocaleString() }}원
          </p>
          <p class="text-xs text-primary-600 mt-1">
            * 실제 견적은 검수 후 확정됩니다
          </p>
        </div>
      </div>

      <!-- Step 4: 거래 방식 선택 -->
      <div v-else-if="currentStep === 4" class="bg-white rounded-xl p-6">
        <h2 class="text-lg font-bold mb-4">거래 방식을 선택해주세요</h2>

        <div class="space-y-3">
          <button
            v-for="(method, key) in TRADE_METHODS"
            :key="key"
            class="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all"
            :class="[
              selectedTradeMethod === key
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            ]"
            @click="selectedTradeMethod = key as keyof typeof TRADE_METHODS"
          >
            <UIcon
              :name="key === 'COURIER' ? 'i-heroicons-truck' : key === 'PICKUP' ? 'i-heroicons-home' : 'i-heroicons-building-storefront'"
              class="w-8 h-8 text-primary-600"
            />
            <div class="flex-1">
              <p class="font-medium">{{ method.label }}</p>
              <p class="text-sm text-gray-500">{{ method.description }}</p>
            </div>
            <UIcon
              v-if="selectedTradeMethod === key"
              name="i-heroicons-check-circle-solid"
              class="w-6 h-6 text-primary-600"
            />
          </button>
        </div>

        <!-- 요약 정보 -->
        <div class="mt-6 p-4 bg-gray-50 rounded-xl space-y-2">
          <p class="font-medium">판매 접수 정보</p>
          <div class="text-sm text-gray-600 space-y-1">
            <p>기기: {{ selectedModel }} {{ selectedVariant }}</p>
            <p>상태: {{ selectedGrade ? SELL_GRADES[selectedGrade].label : '-' }}</p>
            <p>예상 견적: {{ estimatedPrice?.toLocaleString() }}원</p>
          </div>
        </div>
      </div>

      <!-- 버튼 -->
      <div class="flex gap-3 mt-6">
        <UButton
          v-if="currentStep > 1"
          variant="outline"
          size="lg"
          @click="prevStep"
        >
          이전
        </UButton>
        <UButton
          v-if="currentStep < totalSteps"
          size="lg"
          class="flex-1"
          :disabled="!canProceed"
          @click="nextStep"
        >
          다음
        </UButton>
        <UButton
          v-else
          size="lg"
          class="flex-1"
          :disabled="!canProceed"
          :loading="isSubmitting"
          @click="handleSubmit"
        >
          판매 접수하기
        </UButton>
      </div>
    </div>
  </div>
</template>
