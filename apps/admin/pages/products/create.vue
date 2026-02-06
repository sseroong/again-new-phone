<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });
useHead({ title: '상품 등록' });

const toast = useToast();
const router = useRouter();
const apiFetch = useAdminFetch();

const form = reactive({
  title: '',
  description: '',
  category: 'SMARTPHONE',
  brand: 'APPLE',
  grade: 'S',
  status: 'AVAILABLE',
  originalPrice: 0,
  sellingPrice: 0,
  stock: 1,
  images: [] as string[],
  batteryHealth: 100,
  warrantyExpiry: '',
});

const imageUrl = ref('');
const isSubmitting = ref(false);

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
  if (!form.title || !form.sellingPrice) {
    toast.add({ title: '필수 항목을 입력해주세요.', color: 'red' });
    return;
  }

  isSubmitting.value = true;
  try {
    await apiFetch('/admin/products', {
      method: 'POST',
      body: form,
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
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UFormGroup label="상품명" required class="md:col-span-2">
          <UInput v-model="form.title" placeholder="iPhone 15 Pro Max 256GB" />
        </UFormGroup>

        <UFormGroup label="카테고리" required>
          <USelect v-model="form.category" :options="categoryOptions" value-attribute="value" option-attribute="label" />
        </UFormGroup>

        <UFormGroup label="브랜드" required>
          <USelect v-model="form.brand" :options="brandOptions" value-attribute="value" option-attribute="label" />
        </UFormGroup>

        <UFormGroup label="등급" required>
          <USelect v-model="form.grade" :options="gradeOptions" value-attribute="value" option-attribute="label" />
        </UFormGroup>

        <UFormGroup label="상태">
          <USelect
            v-model="form.status"
            :options="[
              { label: '판매중', value: 'AVAILABLE' },
              { label: '예약중', value: 'RESERVED' },
              { label: '비활성', value: 'UNAVAILABLE' },
            ]"
            value-attribute="value"
            option-attribute="label"
          />
        </UFormGroup>

        <UFormGroup label="정가 (원)">
          <UInput v-model.number="form.originalPrice" type="number" placeholder="0" />
        </UFormGroup>

        <UFormGroup label="판매가 (원)" required>
          <UInput v-model.number="form.sellingPrice" type="number" placeholder="0" />
        </UFormGroup>

        <UFormGroup label="재고">
          <UInput v-model.number="form.stock" type="number" min="0" />
        </UFormGroup>

        <UFormGroup label="배터리 건강도 (%)">
          <UInput v-model.number="form.batteryHealth" type="number" min="0" max="100" />
        </UFormGroup>

        <UFormGroup label="설명" class="md:col-span-2">
          <UTextarea v-model="form.description" rows="4" placeholder="상품 설명을 입력하세요" />
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
        <UButton type="submit" label="등록" :loading="isSubmitting" />
        <UButton to="/products" variant="outline" color="gray" label="취소" />
      </div>
    </form>
  </div>
</template>
