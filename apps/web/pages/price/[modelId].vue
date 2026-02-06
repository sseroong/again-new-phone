<script setup lang="ts">
import { PRODUCT_GRADES, type ProductGrade } from '@phone-marketplace/shared';

definePageMeta({
  layout: 'default',
});

const route = useRoute();
const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;
const modelId = route.params.modelId as string;

// 모델별 시세 조회
const { data: modelData, error } = await useAsyncData(
  `model-prices-${modelId}`,
  () => $fetch<any>(`${apiBase}/prices/models/${modelId}`),
);

useHead({
  title: modelData.value?.model
    ? `${modelData.value.model.name} 시세`
    : '시세 상세',
});

// 선택된 용량/등급 (시세 이력용)
const selectedStorage = ref('');
const selectedGrade = ref<ProductGrade>('A' as ProductGrade);

// 용량 목록
const storages = computed(() => {
  if (!modelData.value?.pricesByStorage) return [];
  return modelData.value.pricesByStorage.map((group: any) => group.storage);
});

// 첫 용량 자동 선택
watch(storages, (val) => {
  if (val.length && !selectedStorage.value) {
    selectedStorage.value = val[0];
  }
}, { immediate: true });

// 시세 변동 이력 조회
const { data: priceHistory } = await useAsyncData(
  `price-history-${modelId}`,
  () => {
    if (!selectedStorage.value) return null;
    return $fetch<any>(`${apiBase}/prices/history/${modelId}`, {
      params: {
        storage: selectedStorage.value,
        grade: selectedGrade.value,
        days: 30,
      },
    });
  },
  { watch: [selectedStorage, selectedGrade] },
);

// 등급별 색상
const gradeColor = (grade: string): string => {
  const colors: Record<string, string> = {
    S_PLUS: 'bg-blue-100 text-blue-700',
    S: 'bg-sky-100 text-sky-700',
    A: 'bg-indigo-100 text-indigo-700',
    B_PLUS: 'bg-violet-100 text-violet-700',
    B: 'bg-purple-100 text-purple-700',
    C: 'bg-yellow-100 text-yellow-700',
    D: 'bg-orange-100 text-orange-700',
  };
  return colors[grade] || 'bg-gray-100 text-gray-700';
};

const gradeOptions: ProductGrade[] = ['S', 'A', 'B', 'C'] as ProductGrade[];
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- 에러 -->
    <div v-if="error" class="max-w-7xl mx-auto px-4 py-12 text-center">
      <UIcon name="i-heroicons-exclamation-circle" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h1 class="text-xl font-bold mb-2">모델을 찾을 수 없습니다</h1>
      <p class="text-gray-500 mb-4">요청하신 모델의 시세 정보가 없습니다.</p>
      <UButton to="/price" variant="outline">시세표로 돌아가기</UButton>
    </div>

    <template v-else-if="modelData">
      <!-- 브레드크럼 -->
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav class="flex items-center gap-2 text-sm text-gray-500">
            <NuxtLink to="/" class="hover:text-gray-700">HOME</NuxtLink>
            <span>></span>
            <NuxtLink to="/price" class="hover:text-gray-700">시세표</NuxtLink>
            <span>></span>
            <span class="text-gray-900">{{ modelData.model?.name }}</span>
          </nav>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- 모델 정보 -->
        <div class="bg-white rounded-xl p-6 mb-6">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <UIcon name="i-heroicons-device-phone-mobile" class="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h1 class="text-2xl font-bold">{{ modelData.model?.name }}</h1>
              <p class="text-gray-500">
                {{ modelData.model?.brand }}
                <span v-if="modelData.model?.series"> · {{ modelData.model.series }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- 등급별 / 용량별 가격 테이블 -->
        <div class="bg-white rounded-xl overflow-hidden mb-6">
          <div class="px-6 py-4 border-b">
            <h2 class="font-bold text-lg">등급별 시세</h2>
          </div>

          <div v-if="!modelData.pricesByStorage?.length" class="p-8 text-center text-gray-500">
            시세 데이터가 없습니다.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b text-sm text-gray-500">
                  <th class="px-4 py-3 text-left font-medium">용량</th>
                  <th class="px-4 py-3 text-left font-medium">등급</th>
                  <th class="px-4 py-3 text-right font-medium">시세</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="storageGroup in modelData.pricesByStorage" :key="storageGroup.storage">
                  <tr
                    v-for="(price, idx) in storageGroup.prices"
                    :key="`${storageGroup.storage}-${price.grade}`"
                    class="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td
                      v-if="idx === 0"
                      class="px-4 py-3 font-medium"
                      :rowspan="storageGroup.prices.length"
                    >
                      {{ storageGroup.storage }}
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="text-xs font-medium px-2 py-0.5 rounded"
                        :class="gradeColor(price.grade)"
                      >
                        {{ PRODUCT_GRADES[price.grade as ProductGrade]?.label || price.grade }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right font-bold text-primary-600">
                      {{ price.price?.toLocaleString() }}원
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 시세 변동 이력 -->
        <div class="bg-white rounded-xl overflow-hidden">
          <div class="px-6 py-4 border-b flex items-center justify-between flex-wrap gap-4">
            <h2 class="font-bold text-lg">최근 30일 시세 변동</h2>
            <div class="flex gap-2">
              <USelectMenu
                v-if="storages.length"
                v-model="selectedStorage"
                :options="storages"
                size="sm"
                placeholder="용량"
              />
              <USelectMenu
                v-model="selectedGrade"
                :options="gradeOptions.map((g) => ({ label: PRODUCT_GRADES[g]?.label || g, value: g }))"
                option-attribute="label"
                value-attribute="value"
                size="sm"
                placeholder="등급"
              />
            </div>
          </div>

          <div v-if="!priceHistory?.length" class="p-8 text-center text-gray-500">
            해당 조건의 시세 변동 데이터가 없습니다.
          </div>

          <div v-else class="divide-y">
            <div
              v-for="record in priceHistory"
              :key="record.id"
              class="px-6 py-3 flex items-center justify-between"
            >
              <span class="text-sm text-gray-500">
                {{ new Date(record.recordedAt).toLocaleDateString('ko-KR') }}
              </span>
              <span class="font-medium">{{ record.price?.toLocaleString() }}원</span>
            </div>
          </div>
        </div>

        <!-- 구매 안내 -->
        <div class="mt-6 bg-primary-50 rounded-xl p-6 text-center">
          <p class="text-primary-800 font-medium mb-2">이 모델의 중고 매물을 찾고 계신가요?</p>
          <UButton to="/buy" variant="soft" color="primary">
            구매 목록 보기
          </UButton>
        </div>
      </div>
    </template>
  </div>
</template>
