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
  title: '',
  description: '',
  category: '',
  brand: '',
  grade: '',
  status: '',
  originalPrice: 0,
  sellingPrice: 0,
  stock: 0,
  batteryHealth: 100,
  images: [] as string[],
});

const isSubmitting = ref(false);
const isDeleting = ref(false);

watch(product, (val) => {
  if (val) {
    Object.assign(form, {
      title: val.title || '',
      description: val.description || '',
      category: val.category || '',
      brand: val.brand || '',
      grade: val.grade || '',
      status: val.status || '',
      originalPrice: val.originalPrice || 0,
      sellingPrice: val.sellingPrice || 0,
      stock: val.stock || 0,
      batteryHealth: val.batteryHealth || 100,
      images: val.images || [],
    });
  }
}, { immediate: true });

const categoryOptions = [
  { label: '스마트폰', value: 'SMARTPHONE' },
  { label: '태블릿', value: 'TABLET' },
  { label: '스마트워치', value: 'WATCH' },
  { label: '노트북', value: 'LAPTOP' },
  { label: '무선이어폰', value: 'EARPHONE' },
];

const brandOptions = [
  { label: '애플', value: 'APPLE' },
  { label: '삼성', value: 'SAMSUNG' },
  { label: 'LG', value: 'LG' },
  { label: '레노버', value: 'LENOVO' },
  { label: '기타', value: 'OTHER' },
];

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

async function handleUpdate() {
  isSubmitting.value = true;
  try {
    await apiFetch(`/admin/products/${id}`, {
      method: 'PATCH',
      body: form,
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

    <form v-else @submit.prevent="handleUpdate" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 max-w-3xl">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UFormGroup label="상품명" required class="md:col-span-2">
          <UInput v-model="form.title" />
        </UFormGroup>

        <UFormGroup label="카테고리">
          <USelect v-model="form.category" :options="categoryOptions" value-attribute="value" option-attribute="label" />
        </UFormGroup>

        <UFormGroup label="브랜드">
          <USelect v-model="form.brand" :options="brandOptions" value-attribute="value" option-attribute="label" />
        </UFormGroup>

        <UFormGroup label="등급">
          <USelect v-model="form.grade" :options="gradeOptions" value-attribute="value" option-attribute="label" />
        </UFormGroup>

        <UFormGroup label="상태">
          <USelect v-model="form.status" :options="statusOptions" value-attribute="value" option-attribute="label" />
        </UFormGroup>

        <UFormGroup label="정가 (원)">
          <UInput v-model.number="form.originalPrice" type="number" />
        </UFormGroup>

        <UFormGroup label="판매가 (원)" required>
          <UInput v-model.number="form.sellingPrice" type="number" />
        </UFormGroup>

        <UFormGroup label="재고">
          <UInput v-model.number="form.stock" type="number" min="0" />
        </UFormGroup>

        <UFormGroup label="배터리 건강도 (%)">
          <UInput v-model.number="form.batteryHealth" type="number" min="0" max="100" />
        </UFormGroup>

        <UFormGroup label="설명" class="md:col-span-2">
          <UTextarea v-model="form.description" rows="4" />
        </UFormGroup>
      </div>

      <div class="flex gap-3 pt-4 border-t">
        <UButton type="submit" label="저장" :loading="isSubmitting" />
        <UButton to="/products" variant="outline" color="gray" label="취소" />
      </div>
    </form>
  </div>
</template>
