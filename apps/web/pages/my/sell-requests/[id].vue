<script setup lang="ts">
definePageMeta({ middleware: ['auth'] });

const route = useRoute();
const toast = useToast();
const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;
const authStore = useAuthStore();
const id = route.params.id as string;

const authHeaders = computed(() => ({
  Authorization: `Bearer ${authStore.tokens?.accessToken}`,
}));

const { data: sr, pending, refresh } = await useAsyncData(
  `sell-request-${id}`,
  () => $fetch<any>(`${apiBase}/sell-requests/${id}`, { headers: authHeaders.value }),
);

useHead({ title: computed(() => sr.value ? `판매접수 #${sr.value.id?.slice(0, 8)}` : '판매접수 상세') });

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: '접수 대기', color: 'yellow' },
  QUOTED: { label: '견적 제안됨', color: 'blue' },
  ACCEPTED: { label: '견적 수락', color: 'blue' },
  SHIPPING: { label: '배송중', color: 'indigo' },
  INSPECTING: { label: '검수중', color: 'purple' },
  COMPLETED: { label: '완료', color: 'green' },
  CANCELLED: { label: '취소', color: 'red' },
};

// 상태 타임라인
const statusFlow = ['PENDING', 'QUOTED', 'ACCEPTED', 'SHIPPING', 'INSPECTING', 'COMPLETED'];

function currentStepIndex(status: string) {
  const idx = statusFlow.indexOf(status);
  return idx >= 0 ? idx : 0;
}

// 송장 등록
const trackingForm = reactive({
  trackingNumber: '',
  trackingCompany: '',
});
const isSubmitting = ref(false);

async function acceptQuote(quoteId: string) {
  if (!confirm('이 견적을 수락하시겠습니까?')) return;
  isSubmitting.value = true;
  try {
    await $fetch(`${apiBase}/sell-requests/${id}/quotes/${quoteId}/accept`, {
      method: 'POST',
      headers: authHeaders.value,
    });
    toast.add({ title: '견적을 수락했습니다.', color: 'green' });
    refresh();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '견적 수락에 실패했습니다.', color: 'red' });
  } finally {
    isSubmitting.value = false;
  }
}

async function submitTracking() {
  if (!trackingForm.trackingNumber) {
    toast.add({ title: '송장번호를 입력해주세요.', color: 'red' });
    return;
  }
  isSubmitting.value = true;
  try {
    await $fetch(`${apiBase}/sell-requests/${id}/tracking`, {
      method: 'POST',
      headers: authHeaders.value,
      body: trackingForm,
    });
    toast.add({ title: '송장번호가 등록되었습니다.', color: 'green' });
    refresh();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '송장 등록에 실패했습니다.', color: 'red' });
  } finally {
    isSubmitting.value = false;
  }
}

function formatPrice(price: number | null) {
  if (!price) return '-';
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
}

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ko-KR');
}
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center gap-3">
          <NuxtLink to="/my/transactions" class="text-gray-400 hover:text-gray-600">
            <UIcon name="i-heroicons-arrow-left" class="w-5 h-5" />
          </NuxtLink>
          <h1 class="text-2xl font-bold">판매접수 상세</h1>
        </div>
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="pending" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
      </div>

      <template v-else-if="sr">
        <!-- 상태 타임라인 -->
        <div class="bg-white rounded-xl p-6 border border-gray-100 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold">진행 상태</h2>
            <UBadge
              :color="(statusLabels[sr.status]?.color || 'gray') as any"
              variant="soft"
            >
              {{ statusLabels[sr.status]?.label || sr.status }}
            </UBadge>
          </div>

          <div class="flex items-center justify-between">
            <div
              v-for="(step, i) in statusFlow"
              :key="step"
              class="flex items-center"
              :class="i < statusFlow.length - 1 ? 'flex-1' : ''"
            >
              <div class="flex flex-col items-center">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                  :class="i <= currentStepIndex(sr.status) ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'"
                >
                  {{ i + 1 }}
                </div>
                <span class="text-xs text-gray-500 mt-1 whitespace-nowrap">
                  {{ statusLabels[step]?.label }}
                </span>
              </div>
              <div
                v-if="i < statusFlow.length - 1"
                class="flex-1 h-0.5 mx-2"
                :class="i < currentStepIndex(sr.status) ? 'bg-primary-600' : 'bg-gray-200'"
              />
            </div>
          </div>
        </div>

        <!-- 기기 정보 -->
        <div class="bg-white rounded-xl p-6 border border-gray-100 mb-6">
          <h2 class="font-semibold mb-4">기기 정보</h2>
          <dl class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt class="text-gray-500">기기명</dt>
              <dd class="font-medium">{{ sr.modelName || sr.deviceName || '-' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">용량</dt>
              <dd>{{ sr.storage || '-' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">자가진단 등급</dt>
              <dd>{{ sr.selfGrade || '-' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">거래 방식</dt>
              <dd>{{ sr.tradeMethod === 'COURIER' ? '택배' : sr.tradeMethod === 'PICKUP' ? '픽업' : sr.tradeMethod === 'VISIT' ? '방문' : sr.tradeMethod || '-' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">예상 견적</dt>
              <dd class="font-medium">{{ formatPrice(sr.estimatedPrice) }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">최종 가격</dt>
              <dd class="font-bold text-primary-600">{{ formatPrice(sr.finalPrice) }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">접수일</dt>
              <dd>{{ formatDate(sr.createdAt) }}</dd>
            </div>
          </dl>
        </div>

        <!-- 견적 목록 (QUOTED 상태) -->
        <div v-if="sr.quotes?.length" class="bg-white rounded-xl p-6 border border-gray-100 mb-6">
          <h2 class="font-semibold mb-4">받은 견적</h2>
          <div class="space-y-3">
            <div
              v-for="quote in sr.quotes"
              :key="quote.id"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <p class="font-bold text-lg">{{ formatPrice(quote.offeredPrice) }}</p>
                <p v-if="quote.notes" class="text-sm text-gray-500 mt-1">{{ quote.notes }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ formatDate(quote.createdAt) }}</p>
              </div>
              <div>
                <UBadge
                  v-if="quote.status === 'ACCEPTED'"
                  color="green"
                  variant="soft"
                >
                  수락됨
                </UBadge>
                <UButton
                  v-else-if="sr.status === 'QUOTED'"
                  label="수락"
                  size="sm"
                  :loading="isSubmitting"
                  @click="acceptQuote(quote.id)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 송장 등록 (ACCEPTED 상태) -->
        <div v-if="sr.status === 'ACCEPTED'" class="bg-white rounded-xl p-6 border border-gray-100 mb-6">
          <h2 class="font-semibold mb-4">송장 등록</h2>
          <p class="text-sm text-gray-500 mb-4">견적을 수락하셨습니다. 기기를 택배로 보내주세요.</p>
          <form @submit.prevent="submitTracking" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="택배사">
                <UInput v-model="trackingForm.trackingCompany" placeholder="CJ대한통운" />
              </UFormGroup>
              <UFormGroup label="송장번호" required>
                <UInput v-model="trackingForm.trackingNumber" placeholder="123456789012" />
              </UFormGroup>
            </div>
            <UButton type="submit" label="송장 등록" :loading="isSubmitting" />
          </form>
        </div>

        <!-- 검수 결과 (INSPECTING/COMPLETED) -->
        <div v-if="sr.inspectionGrade || sr.inspectionNotes" class="bg-white rounded-xl p-6 border border-gray-100">
          <h2 class="font-semibold mb-4">검수 결과</h2>
          <dl class="grid grid-cols-2 gap-4 text-sm">
            <div v-if="sr.inspectionGrade">
              <dt class="text-gray-500">검수 등급</dt>
              <dd class="font-medium">{{ sr.inspectionGrade }}</dd>
            </div>
            <div v-if="sr.finalPrice">
              <dt class="text-gray-500">최종 금액</dt>
              <dd class="font-bold text-primary-600">{{ formatPrice(sr.finalPrice) }}</dd>
            </div>
          </dl>
          <p v-if="sr.inspectionNotes" class="text-sm text-gray-600 mt-4 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
            {{ sr.inspectionNotes }}
          </p>
        </div>
      </template>
    </div>
  </div>
</template>
