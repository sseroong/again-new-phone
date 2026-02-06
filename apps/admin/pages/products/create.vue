<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });
useHead({ title: '상품 등록' });

const toast = useToast();
const router = useRouter();
const apiFetch = useAdminFetch();

// 카테고리/모델/바리언트 목록 로드
const { data: categories } = useAdminApi<any[]>('/products/categories');
const { data: allModels } = useAdminApi<any[]>('/products/models');

const selectedCategoryId = ref('');
const selectedModelId = ref('');
const selectedVariantId = ref('');

const filteredModels = computed(() => {
  const models = allModels.value || [];
  if (!selectedCategoryId.value) return models;
  return models.filter((m: any) => m.categoryId === selectedCategoryId.value);
});

const selectedModel = computed(() => {
  return (allModels.value || []).find((m: any) => m.id === selectedModelId.value);
});

const variants = computed(() => {
  return selectedModel.value?.variants || [];
});

watch(selectedCategoryId, () => {
  selectedModelId.value = '';
  selectedVariantId.value = '';
});

watch(selectedModelId, () => {
  selectedVariantId.value = '';
});

const form = reactive({
  grade: 'S',
  sellingPrice: 0,
  batteryHealth: 100,
  imei: '',
  serialNumber: '',
  description: '',
  images: [] as string[],
  discountRate: 0,
});

const imageUrl = ref('');
const isSubmitting = ref(false);

const gradeOptions = [
  { label: '새상품(NEW)', value: 'NEW' },
  { label: '미개봉', value: 'UNOPENED' },
  { label: 'S+', value: 'S_PLUS' },
  { label: 'S', value: 'S' },
  { label: 'A', value: 'A' },
  { label: 'B+', value: 'B_PLUS' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
  { label: 'D', value: 'D' },
  { label: 'E', value: 'E' },
];

function addImage() {
  if (imageUrl.value.trim()) {
    form.images.push(imageUrl.value.trim());
    imageUrl.value = '';
  }
}

function removeImage(index: number) {
  form.images.splice(index, 1);
}

async function handleSubmit() {
  if (!selectedCategoryId.value || !selectedModelId.value || !selectedVariantId.value) {
    toast.add({ title: '카테고리, 모델, 바리언트를 선택해주세요.', color: 'red' });
    return;
  }
  if (!form.sellingPrice) {
    toast.add({ title: '판매가를 입력해주세요.', color: 'red' });
    return;
  }

  isSubmitting.value = true;
  try {
    await apiFetch('/admin/products', {
      method: 'POST',
      body: {
        categoryId: selectedCategoryId.value,
        modelId: selectedModelId.value,
        variantId: selectedVariantId.value,
        grade: form.grade,
        sellingPrice: form.sellingPrice,
        batteryHealth: form.batteryHealth,
        imei: form.imei || undefined,
        serialNumber: form.serialNumber || undefined,
        description: form.description || undefined,
        images: form.images.length ? form.images : undefined,
        discountRate: form.discountRate || undefined,
      },
    });
    toast.add({ title: '상품이 등록되었습니다.', color: 'green' });
    router.push('/products');
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '등록에 실패했습니다.', color: 'red' });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <UButton to="/products" variant="ghost" color="gray" icon="i-heroicons-arrow-left" />
      <h1 class="text-2xl font-bold text-gray-900">상품 등록</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 max-w-3xl">
      <!-- 기기 선택 -->
      <div>
        <h2 class="text-lg font-semibold mb-4">기기 선택</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UFormGroup label="카테고리" required>
            <USelect
              v-model="selectedCategoryId"
              :options="[{ label: '선택하세요', value: '' }, ...(categories || []).map((c: any) => ({ label: c.name, value: c.id }))]"
              value-attribute="value"
              option-attribute="label"
            />
          </UFormGroup>

          <UFormGroup label="모델" required>
            <USelect
              v-model="selectedModelId"
              :disabled="!selectedCategoryId"
              :options="[{ label: '선택하세요', value: '' }, ...filteredModels.map((m: any) => ({ label: `${m.brand} ${m.name}`, value: m.id }))]"
              value-attribute="value"
              option-attribute="label"
            />
          </UFormGroup>

          <UFormGroup label="바리언트" required>
            <USelect
              v-model="selectedVariantId"
              :disabled="!selectedModelId"
              :options="[{ label: '선택하세요', value: '' }, ...variants.map((v: any) => ({ label: `${v.storage} ${v.color}`, value: v.id }))]"
              value-attribute="value"
              option-attribute="label"
            />
          </UFormGroup>
        </div>
      </div>

      <!-- 상품 정보 -->
      <div>
        <h2 class="text-lg font-semibold mb-4">상품 정보</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormGroup label="등급" required>
            <USelect v-model="form.grade" :options="gradeOptions" value-attribute="value" option-attribute="label" />
          </UFormGroup>

          <UFormGroup label="판매가 (원)" required>
            <UInput v-model.number="form.sellingPrice" type="number" placeholder="0" />
          </UFormGroup>

          <UFormGroup label="배터리 건강도 (%)">
            <UInput v-model.number="form.batteryHealth" type="number" min="0" max="100" />
          </UFormGroup>

          <UFormGroup label="할인율 (%)">
            <UInput v-model.number="form.discountRate" type="number" min="0" max="100" />
          </UFormGroup>

          <UFormGroup label="IMEI">
            <UInput v-model="form.imei" placeholder="IMEI 번호" />
          </UFormGroup>

          <UFormGroup label="시리얼 번호">
            <UInput v-model="form.serialNumber" placeholder="시리얼 번호" />
          </UFormGroup>

          <UFormGroup label="설명" class="md:col-span-2">
            <UTextarea v-model="form.description" rows="4" placeholder="상품 설명을 입력하세요" />
          </UFormGroup>
        </div>
      </div>

      <!-- 이미지 URL -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">이미지 URL</label>
        <div class="flex gap-2 mb-2">
          <UInput v-model="imageUrl" placeholder="https://..." class="flex-1" @keyup.enter.prevent="addImage" />
          <UButton type="button" label="추가" variant="outline" @click="addImage" />
        </div>
        <div v-if="form.images.length" class="flex flex-wrap gap-2">
          <div
            v-for="(img, i) in form.images"
            :key="i"
            class="flex items-center gap-1 bg-gray-100 rounded px-2 py-1 text-xs"
          >
            <span class="max-w-[200px] truncate">{{ img }}</span>
            <UButton type="button" icon="i-heroicons-x-mark" size="2xs" variant="ghost" color="red" @click="removeImage(i)" />
          </div>
        </div>
      </div>

      <div class="flex gap-3 pt-4 border-t">
        <UButton type="submit" label="등록" :loading="isSubmitting" />
        <UButton to="/products" variant="outline" color="gray" label="취소" />
      </div>
    </form>
  </div>
</template>
