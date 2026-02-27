<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });

const route = useRoute();
const router = useRouter();
const toast = useToast();
const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;
const apiFetch = useAdminFetch();
const authStore = useAuthStore();
const id = route.params.id as string;

useHead({ title: '상품 수정' });

const { data: product, pending } = useAdminApi<any>(`/admin/products/${id}`);

// 카테고리/모델 목록 로드
const { data: categories } = useAdminApi<any[]>('/products/categories');
const { data: allModels } = useAdminApi<any[]>('/products/models');

const form = reactive({
  grade: '',
  status: '',
  sellingPrice: 0,
  batteryHealth: 100,
  description: '',
  images: [] as string[],
  discountRate: 0,
  categoryId: '',
  modelId: '',
  variantId: '',
  imei: '',
  serialNumber: '',
  warrantyExpiry: '',
  manufactureDate: '',
});

const isSubmitting = ref(false);
const isDeleting = ref(false);
const isUploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const filteredModels = computed(() => {
  const models = allModels.value || [];
  if (!form.categoryId) return models;
  return models.filter((m: any) => m.categoryId === form.categoryId);
});

const selectedModel = computed(() => {
  return (allModels.value || []).find((m: any) => m.id === form.modelId);
});

const variants = computed(() => {
  return selectedModel.value?.variants || [];
});

function productName(p: any) {
  const model = p?.model?.name || '';
  const storage = p?.variant?.storage || '';
  const color = p?.variant?.color || '';
  return [model, storage, color].filter(Boolean).join(' ') || '-';
}

watch(product, (val) => {
  if (val) {
    Object.assign(form, {
      grade: val.grade || '',
      status: val.status || '',
      sellingPrice: val.sellingPrice || 0,
      batteryHealth: val.batteryHealth ?? 100,
      description: val.description || '',
      images: val.images || [],
      discountRate: val.discountRate || 0,
      categoryId: val.categoryId || val.category?.id || '',
      modelId: val.modelId || val.model?.id || '',
      variantId: val.variantId || val.variant?.id || '',
      imei: val.imei || '',
      serialNumber: val.serialNumber || '',
      warrantyExpiry: val.warrantyExpiry ? val.warrantyExpiry.split('T')[0] : '',
      manufactureDate: val.manufactureDate ? val.manufactureDate.split('T')[0] : '',
    });
  }
}, { immediate: true });

// 카테고리 변경 시 모델/바리언트 초기화
watch(() => form.categoryId, (newVal, oldVal) => {
  if (oldVal && newVal !== oldVal) {
    form.modelId = '';
    form.variantId = '';
  }
});

watch(() => form.modelId, (newVal, oldVal) => {
  if (oldVal && newVal !== oldVal) {
    form.variantId = '';
  }
});

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

const statusOptions = [
  { label: '판매중', value: 'AVAILABLE' },
  { label: '예약중', value: 'RESERVED' },
  { label: '판매완료', value: 'SOLD' },
  { label: '비활성', value: 'UNAVAILABLE' },
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

async function handleUpdate() {
  isSubmitting.value = true;
  try {
    await apiFetch(`/admin/products/${id}`, {
      method: 'PATCH',
      body: {
        grade: form.grade,
        status: form.status,
        sellingPrice: form.sellingPrice,
        batteryHealth: form.batteryHealth,
        description: form.description,
        images: form.images,
        discountRate: form.discountRate || undefined,
        categoryId: form.categoryId || undefined,
        modelId: form.modelId || undefined,
        variantId: form.variantId || undefined,
        imei: form.imei || undefined,
        serialNumber: form.serialNumber || undefined,
        warrantyExpiry: form.warrantyExpiry || undefined,
        manufactureDate: form.manufactureDate || undefined,
      },
    });
    toast.add({ title: '상품이 수정되었습니다.', color: 'green' });
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '수정에 실패했습니다.', color: 'red' });
  } finally {
    isSubmitting.value = false;
  }
}

async function handleDelete() {
  if (!confirm('상품을 비활성화 하시겠습니까?')) return;
  isDeleting.value = true;
  try {
    await apiFetch(`/admin/products/${id}`, { method: 'DELETE' });
    toast.add({ title: '상품이 비활성화되었습니다.', color: 'green' });
    router.push('/products');
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '삭제에 실패했습니다.', color: 'red' });
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <UButton to="/products" variant="ghost" color="gray" icon="i-heroicons-arrow-left" />
        <h1 class="text-2xl font-bold text-gray-900">상품 수정</h1>
      </div>
      <UButton
        color="red"
        variant="outline"
        icon="i-heroicons-trash"
        label="비활성화"
        :loading="isDeleting"
        @click="handleDelete"
      />
    </div>

    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

    <template v-else-if="product">
      <!-- 상품명 표시 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 max-w-3xl">
        <h2 class="text-lg font-semibold mb-2">상품명</h2>
        <p class="text-gray-700 font-medium">{{ productName(product) }}</p>
      </div>

      <!-- 수정 가능 항목 -->
      <form @submit.prevent="handleUpdate" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 max-w-3xl">
        <!-- 기기 정보 -->
        <div>
          <h2 class="text-lg font-semibold mb-4">기기 정보</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UFormGroup label="카테고리">
              <USelect
                v-model="form.categoryId"
                :options="[{ label: '선택하세요', value: '' }, ...(categories || []).map((c: any) => ({ label: c.name, value: c.id }))]"
                value-attribute="value"
                option-attribute="label"
              />
            </UFormGroup>

            <UFormGroup label="모델">
              <USelect
                v-model="form.modelId"
                :disabled="!form.categoryId"
                :options="[{ label: '선택하세요', value: '' }, ...filteredModels.map((m: any) => ({ label: `${m.brand} ${m.name}`, value: m.id }))]"
                value-attribute="value"
                option-attribute="label"
              />
            </UFormGroup>

            <UFormGroup label="바리언트">
              <USelect
                v-model="form.variantId"
                :disabled="!form.modelId"
                :options="[{ label: '선택하세요', value: '' }, ...variants.map((v: any) => ({ label: `${v.storage} ${v.color}`, value: v.id }))]"
                value-attribute="value"
                option-attribute="label"
              />
            </UFormGroup>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <UFormGroup label="IMEI">
              <UInput v-model="form.imei" placeholder="IMEI 번호" />
            </UFormGroup>
            <UFormGroup label="시리얼 번호">
              <UInput v-model="form.serialNumber" placeholder="시리얼 번호" />
            </UFormGroup>
            <UFormGroup label="보증 만료일">
              <UInput v-model="form.warrantyExpiry" type="date" />
            </UFormGroup>
            <UFormGroup label="제조일">
              <UInput v-model="form.manufactureDate" type="date" />
            </UFormGroup>
          </div>
        </div>

        <!-- 판매 정보 -->
        <div>
          <h2 class="text-lg font-semibold mb-4">판매 정보</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="등급">
              <USelect v-model="form.grade" :options="gradeOptions" value-attribute="value" option-attribute="label" />
            </UFormGroup>

            <UFormGroup label="상태">
              <USelect v-model="form.status" :options="statusOptions" value-attribute="value" option-attribute="label" />
            </UFormGroup>

            <UFormGroup label="판매가 (원)" required>
              <UInput v-model.number="form.sellingPrice" type="number" />
            </UFormGroup>

            <UFormGroup label="배터리 건강도 (%)">
              <UInput v-model.number="form.batteryHealth" type="number" min="0" max="100" />
            </UFormGroup>

            <UFormGroup label="할인율 (%)">
              <UInput v-model.number="form.discountRate" type="number" min="0" max="100" />
            </UFormGroup>

            <UFormGroup label="설명" class="md:col-span-2">
              <UTextarea v-model="form.description" rows="4" />
            </UFormGroup>
          </div>
        </div>

        <!-- 이미지 업로드 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            상품 이미지 (최대 10장)
          </label>

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
          <UButton type="submit" label="저장" :loading="isSubmitting" />
          <UButton to="/products" variant="outline" color="gray" label="취소" />
        </div>
      </form>
    </template>
  </div>
</template>
