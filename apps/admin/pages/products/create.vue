<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });
useHead({ title: '상품 등록' });

const toast = useToast();
const router = useRouter();
const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;
const apiFetch = useAdminFetch();
const authStore = useAuthStore();

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

const isSubmitting = ref(false);
const isUploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

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

function getImageUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${apiBase}${path}`;
}

function triggerFileInput() {
  fileInput.value?.click();
}

async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  if (!files?.length) return;

  const remaining = 10 - form.images.length;
  if (files.length > remaining) {
    toast.add({ title: `최대 10장까지 업로드 가능합니다. (현재 ${form.images.length}장)`, color: 'red' });
    return;
  }

  await uploadFiles(Array.from(files));
  input.value = '';
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  const files = event.dataTransfer?.files;
  if (!files?.length) return;

  const remaining = 10 - form.images.length;
  if (files.length > remaining) {
    toast.add({ title: `최대 10장까지 업로드 가능합니다. (현재 ${form.images.length}장)`, color: 'red' });
    return;
  }

  uploadFiles(Array.from(files));
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
}

async function uploadFiles(files: File[]) {
  isUploading.value = true;
  try {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    const data = await $fetch<{ urls: string[] }>(`${apiBase}/api/upload/images`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.tokens?.accessToken}`,
      },
      body: formData,
    });

    form.images.push(...data.urls);
    toast.add({ title: `${data.urls.length}장 업로드 완료`, color: 'green' });
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '이미지 업로드에 실패했습니다.', color: 'red' });
  } finally {
    isUploading.value = false;
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

      <!-- 이미지 업로드 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          상품 이미지 (최대 10장)
        </label>

        <!-- 드래그 앤 드롭 영역 -->
        <div
          class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
          :class="{ 'opacity-50 pointer-events-none': isUploading || form.images.length >= 10 }"
          @click="triggerFileInput"
          @drop="handleDrop"
          @dragover="handleDragOver"
        >
          <UIcon v-if="isUploading" name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
          <UIcon v-else name="i-heroicons-cloud-arrow-up" class="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p class="text-sm text-gray-600">
            <template v-if="isUploading">업로드 중...</template>
            <template v-else-if="form.images.length >= 10">최대 이미지 수에 도달했습니다</template>
            <template v-else>
              클릭하거나 파일을 드래그하여 업로드
              <span class="block text-xs text-gray-400 mt-1">JPEG, PNG, WebP, GIF (최대 5MB)</span>
            </template>
          </p>
        </div>

        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          class="hidden"
          @change="handleFileSelect"
        />

        <!-- 이미지 미리보기 -->
        <div v-if="form.images.length" class="grid grid-cols-5 gap-3 mt-4">
          <div
            v-for="(img, i) in form.images"
            :key="i"
            class="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
          >
            <img
              :src="getImageUrl(img)"
              :alt="`상품 이미지 ${i + 1}`"
              class="w-full h-full object-cover"
            />
            <button
              type="button"
              class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              @click="removeImage(i)"
            >
              &times;
            </button>
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
