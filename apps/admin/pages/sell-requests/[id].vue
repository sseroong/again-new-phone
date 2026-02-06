<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });

const route = useRoute();
const toast = useToast();
const apiFetch = useAdminFetch();
const id = route.params.id as string;

const { data: sr, pending, refresh } = useAdminApi<any>(`/admin/sell-requests/${id}`);

useHead({ title: computed(() => sr.value ? `판매접수 #${sr.value.id}` : '판매접수 상세') });

const statusLabels: Record<string, string> = {
  PENDING: '접수 대기',
  QUOTED: '견적 제안됨',
  ACCEPTED: '견적 수락',
  SHIPPING: '배송중',
  INSPECTING: '검수중',
  COMPLETED: '완료',
  CANCELLED: '취소',
};

const statusColors: Record<string, string> = {
  PENDING: 'gray',
  QUOTED: 'blue',
  ACCEPTED: 'yellow',
  SHIPPING: 'orange',
  INSPECTING: 'purple',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

// 검수 폼
const inspectionForm = reactive({
  inspectionGrade: '',
  finalPrice: 0,
  inspectionNotes: '',
  status: '',
});

// 견적 폼
const quoteForm = reactive({
  offeredPrice: 0,
  notes: '',
});

const isUpdating = ref(false);

function formatPrice(price: number) {
  if (!price) return '-';
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
}

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleString('ko-KR');
}

async function handleUpdate() {
  isUpdating.value = true;
  try {
    const body: Record<string, any> = {};
    if (inspectionForm.inspectionGrade) body.inspectionGrade = inspectionForm.inspectionGrade;
    if (inspectionForm.finalPrice) body.finalPrice = inspectionForm.finalPrice;
    if (inspectionForm.inspectionNotes) body.inspectionNotes = inspectionForm.inspectionNotes;
    if (inspectionForm.status) body.status = inspectionForm.status;

    await apiFetch(`/admin/sell-requests/${id}`, {
      method: 'PATCH',
      body,
    });
    toast.add({ title: '판매접수가 수정되었습니다.', color: 'green' });
    refresh();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '수정 실패', color: 'red' });
  } finally {
    isUpdating.value = false;
  }
}

async function handleCreateQuote() {
  if (!quoteForm.offeredPrice) {
    toast.add({ title: '견적 가격을 입력해주세요.', color: 'red' });
    return;
  }
  isUpdating.value = true;
  try {
    await apiFetch(`/admin/sell-requests/${id}/quotes`, {
      method: 'POST',
      body: quoteForm,
    });
    toast.add({ title: '견적이 생성되었습니다.', color: 'green' });
    refresh();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '견적 생성 실패', color: 'red' });
  } finally {
    isUpdating.value = false;
  }
}

const gradeOptions = [
  { label: '선택', value: '' },
  { label: 'S+', value: 'S_PLUS' },
  { label: 'S', value: 'S' },
  { label: 'A', value: 'A' },
  { label: 'B+', value: 'B_PLUS' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
  { label: 'D', value: 'D' },
  { label: 'E', value: 'E' },
];

const statusChangeOptions = [
  { label: '상태 선택', value: '' },
  { label: '검수중', value: 'INSPECTING' },
  { label: '완료', value: 'COMPLETED' },
  { label: '취소', value: 'CANCELLED' },
];
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <UButton to="/sell-requests" variant="ghost" color="gray" icon="i-heroicons-arrow-left" />
      <h1 class="text-2xl font-bold text-gray-900">판매접수 상세</h1>
    </div>

    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

    <template v-else-if="sr">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 메인 정보 -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 기기 정보 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-semibold text-gray-900">기기 정보</h2>
              <UBadge :color="statusColors[sr.status]" variant="subtle">
                {{ statusLabels[sr.status] }}
              </UBadge>
            </div>
            <dl class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt class="text-gray-500">기기명</dt>
                <dd class="font-medium">{{ sr.deviceName || '-' }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">신청자</dt>
                <dd class="font-medium">{{ sr.user?.name }} ({{ sr.user?.email }})</dd>
              </div>
              <div>
                <dt class="text-gray-500">자가진단 등급</dt>
                <dd class="font-medium">{{ sr.selfGrade || '-' }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">검수 등급</dt>
                <dd class="font-medium">{{ sr.inspectionGrade || '-' }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">예상 가격</dt>
                <dd class="font-medium">{{ formatPrice(sr.estimatedPrice) }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">최종 가격</dt>
                <dd class="font-bold text-lg text-primary-600">{{ formatPrice(sr.finalPrice) }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">거래 방식</dt>
                <dd>{{ sr.tradeMethod || '-' }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">접수일</dt>
                <dd>{{ formatDate(sr.createdAt) }}</dd>
              </div>
            </dl>
          </div>

          <!-- 검수 메모 -->
          <div v-if="sr.inspectionNotes" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="font-semibold text-gray-900 mb-2">검수 메모</h2>
            <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ sr.inspectionNotes }}</p>
          </div>

          <!-- 견적 목록 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="font-semibold text-gray-900 mb-4">견적 목록</h2>
            <div v-if="sr.quotes?.length" class="divide-y divide-gray-100">
              <div v-for="quote in sr.quotes" :key="quote.id" class="py-3">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium">{{ formatPrice(quote.offeredPrice) }}</p>
                    <p v-if="quote.notes" class="text-xs text-gray-500 mt-1">{{ quote.notes }}</p>
                  </div>
                  <div class="text-right">
                    <UBadge
                      :color="quote.status === 'ACCEPTED' ? 'green' : quote.status === 'REJECTED' ? 'red' : 'gray'"
                      variant="subtle"
                      size="xs"
                    >
                      {{ quote.status === 'ACCEPTED' ? '수락됨' : quote.status === 'REJECTED' ? '거절됨' : '대기' }}
                    </UBadge>
                    <p class="text-xs text-gray-400 mt-1">{{ formatDate(quote.createdAt) }}</p>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">견적이 없습니다.</p>
          </div>
        </div>

        <!-- 사이드바 -->
        <div class="space-y-6">
          <!-- 견적 생성 (PENDING 상태일 때) -->
          <div v-if="sr.status === 'PENDING'" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="font-semibold text-gray-900 mb-4">견적 생성</h2>
            <div class="space-y-3">
              <UFormGroup label="견적 가격 (원)">
                <UInput v-model.number="quoteForm.offeredPrice" type="number" placeholder="0" />
              </UFormGroup>
              <UFormGroup label="비고">
                <UTextarea v-model="quoteForm.notes" rows="2" placeholder="견적 관련 메모" />
              </UFormGroup>
              <UButton label="견적 보내기" block :loading="isUpdating" @click="handleCreateQuote" />
            </div>
          </div>

          <!-- 검수/수정 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="font-semibold text-gray-900 mb-4">검수 및 상태 수정</h2>
            <div class="space-y-3">
              <UFormGroup label="검수 등급">
                <USelect v-model="inspectionForm.inspectionGrade" :options="gradeOptions" value-attribute="value" option-attribute="label" />
              </UFormGroup>
              <UFormGroup label="최종 가격 (원)">
                <UInput v-model.number="inspectionForm.finalPrice" type="number" placeholder="0" />
              </UFormGroup>
              <UFormGroup label="검수 메모">
                <UTextarea v-model="inspectionForm.inspectionNotes" rows="3" placeholder="검수 메모 입력" />
              </UFormGroup>
              <UFormGroup label="상태 변경">
                <USelect v-model="inspectionForm.status" :options="statusChangeOptions" value-attribute="value" option-attribute="label" />
              </UFormGroup>
              <UButton label="수정" block :loading="isUpdating" @click="handleUpdate" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
