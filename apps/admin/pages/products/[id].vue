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

const form = reactive({
  grade: '',
  status: '',
  sellingPrice: 0,
  batteryHealth: 100,
  description: '',
  images: [] as string[],
  discountRate: 0,
});

const isSubmitting = ref(false);
const isDeleting = ref(false);
const isUploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

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
    });
  }
}, { immediate: true });

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
      <!-- 상품 기본 정보 (읽기 전용) -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 max-w-3xl">
        <h2 class="text-lg font-semibold mb-4">기기 정보</h2>
        <dl class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-gray-500">상품명</dt>
            <dd class="font-medium">{{ productName(product) }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">카테고리</dt>
            <dd>{{ product.category?.name || '-' }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">브랜드</dt>
            <dd>{{ product.model?.brand || '-' }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">IMEI</dt>
            <dd>{{ product.imei || '-' }}</dd>
          </div>
        </dl>
      </div>

      <!-- 수정 가능 항목 -->
      <form @submit.prevent="handleUpdate" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 max-w-3xl">
        <h2 class="text-lg font-semibold">수정 항목</h2>
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
          <UButton type="submit" label="저장" :loading="isSubmitting" />
          <UButton to="/products" variant="outline" color="gray" label="취소" />
        </div>
      </form>
    </template>
  </div>
</template>
