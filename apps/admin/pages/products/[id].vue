<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });

const route = useRoute();
const router = useRouter();
const toast = useToast();
const apiFetch = useAdminFetch();
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
const imageUrl = ref('');

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

function addImage() {
  if (imageUrl.value.trim()) {
    form.images.push(imageUrl.value.trim());
    imageUrl.value = '';
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
          <UButton type="submit" label="저장" :loading="isSubmitting" />
          <UButton to="/products" variant="outline" color="gray" label="취소" />
        </div>
      </form>
    </template>
  </div>
</template>
