<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });
useHead({ title: '메타데이터 관리' });

const toast = useToast();
const apiFetch = useAdminFetch();

// ---------------------------------------------------------------------------
// 탭 관리
// ---------------------------------------------------------------------------
const tabs = [
  { label: '카테고리', key: 'categories' },
  { label: '기기모델', key: 'device-models' },
  { label: '모델변형', key: 'model-variants' },
  { label: '참조 데이터', key: 'enums' },
];
const activeTab = ref(0);

// ---------------------------------------------------------------------------
// Enum 데이터 (참조용)
// ---------------------------------------------------------------------------
const { data: enumData } = useAdminApi<{
  brands: { key: string; label: string }[];
  categories: { key: string; label: string; icon: string }[];
  grades: { key: string; label: string; description: string; color: string }[];
  storageOptions: string[];
}>('/admin/metadata/enums');

const brandOptions = computed(() =>
  (enumData.value as any)?.brands?.map((b: any) => ({ label: b.label, value: b.key })) || [],
);
const storageOptions = computed(() =>
  (enumData.value as any)?.storageOptions?.map((s: string) => ({ label: s, value: s })) || [],
);

// ---------------------------------------------------------------------------
// 카테고리 탭
// ---------------------------------------------------------------------------
const { data: categoryData, pending: categoryPending, refresh: refreshCategories } =
  useAdminApi<any[]>('/admin/metadata/categories');

const categoryColumns = [
  { key: 'type', label: '타입', class: 'w-32' },
  { key: 'name', label: '이름' },
  { key: 'icon', label: '아이콘', class: 'w-40' },
  { key: 'sortOrder', label: '순서', class: 'w-20' },
  { key: 'isActive', label: '상태', class: 'w-20' },
  { key: '_count', label: '연관', class: 'w-28' },
  { key: 'actions', label: '', class: 'w-16' },
];

const showCategoryForm = ref(false);
const editingCategoryId = ref<string | null>(null);
const isCategorySubmitting = ref(false);

const categoryForm = reactive({
  name: '',
  description: '',
  icon: '',
  sortOrder: 0,
  isActive: true,
});

function openCategoryEdit(cat: any) {
  editingCategoryId.value = cat.id;
  Object.assign(categoryForm, {
    name: cat.name || '',
    description: cat.description || '',
    icon: cat.icon || '',
    sortOrder: cat.sortOrder ?? 0,
    isActive: cat.isActive ?? true,
  });
  showCategoryForm.value = true;
}

function resetCategoryForm() {
  Object.assign(categoryForm, { name: '', description: '', icon: '', sortOrder: 0, isActive: true });
  editingCategoryId.value = null;
}

async function handleCategorySubmit() {
  if (!editingCategoryId.value) return;
  isCategorySubmitting.value = true;
  try {
    await apiFetch(`/admin/metadata/categories/${editingCategoryId.value}`, {
      method: 'PATCH',
      body: {
        name: categoryForm.name || undefined,
        description: categoryForm.description || undefined,
        icon: categoryForm.icon || undefined,
        sortOrder: categoryForm.sortOrder,
        isActive: categoryForm.isActive,
      },
    });
    toast.add({ title: '카테고리가 수정되었습니다.', color: 'green' });
    showCategoryForm.value = false;
    resetCategoryForm();
    refreshCategories();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '수정에 실패했습니다.', color: 'red' });
  } finally {
    isCategorySubmitting.value = false;
  }
}

// ---------------------------------------------------------------------------
// 기기모델 탭
// ---------------------------------------------------------------------------
const dmPage = ref(1);
const dmLimit = ref(20);
const dmCategoryFilter = ref('');
const dmBrandFilter = ref('');
const dmSearch = ref('');

const dmQueryString = computed(() => {
  const params = new URLSearchParams();
  params.set('page', String(dmPage.value));
  params.set('limit', String(dmLimit.value));
  if (dmCategoryFilter.value) params.set('categoryId', dmCategoryFilter.value);
  if (dmBrandFilter.value) params.set('brand', dmBrandFilter.value);
  if (dmSearch.value) params.set('search', dmSearch.value);
  return `/admin/metadata/device-models?${params.toString()}`;
});

const { data: dmData, pending: dmPending, refresh: refreshDm } = useAdminApi<any>(dmQueryString);

const categoryFilterOptions = computed(() => {
  const cats = (categoryData.value as any[]) || [];
  return [{ label: '전체', value: '' }, ...cats.map((c: any) => ({ label: c.name, value: c.id }))];
});
const brandFilterOptions = computed(() => [{ label: '전체', value: '' }, ...brandOptions.value]);

const dmColumns = [
  { key: 'brand', label: '브랜드', class: 'w-24' },
  { key: 'name', label: '모델명' },
  { key: 'series', label: '시리즈', class: 'w-32' },
  { key: 'category', label: '카테고리', class: 'w-28' },
  { key: 'isActive', label: '상태', class: 'w-20' },
  { key: '_count', label: '변형/상품', class: 'w-28' },
  { key: 'actions', label: '', class: 'w-24' },
];

const showDmForm = ref(false);
const editingDmId = ref<string | null>(null);
const isDmSubmitting = ref(false);

const dmForm = reactive({
  categoryId: '',
  brand: '',
  name: '',
  series: '',
  releaseDate: '',
  isActive: true,
});

function openDmCreate() {
  editingDmId.value = null;
  Object.assign(dmForm, { categoryId: '', brand: '', name: '', series: '', releaseDate: '', isActive: true });
  showDmForm.value = true;
}

function openDmEdit(model: any) {
  editingDmId.value = model.id;
  Object.assign(dmForm, {
    categoryId: model.categoryId || model.category?.id || '',
    brand: model.brand || '',
    name: model.name || '',
    series: model.series || '',
    releaseDate: model.releaseDate ? model.releaseDate.split('T')[0] : '',
    isActive: model.isActive ?? true,
  });
  showDmForm.value = true;
}

async function handleDmSubmit() {
  if (!dmForm.name.trim()) {
    toast.add({ title: '모델명은 필수입니다.', color: 'red' });
    return;
  }
  isDmSubmitting.value = true;
  try {
    if (editingDmId.value) {
      await apiFetch(`/admin/metadata/device-models/${editingDmId.value}`, {
        method: 'PATCH',
        body: {
          brand: dmForm.brand || undefined,
          name: dmForm.name,
          series: dmForm.series || undefined,
          releaseDate: dmForm.releaseDate || undefined,
          isActive: dmForm.isActive,
        },
      });
      toast.add({ title: '기기모델이 수정되었습니다.', color: 'green' });
    } else {
      if (!dmForm.categoryId || !dmForm.brand) {
        toast.add({ title: '카테고리와 브랜드는 필수입니다.', color: 'red' });
        isDmSubmitting.value = false;
        return;
      }
      await apiFetch('/admin/metadata/device-models', {
        method: 'POST',
        body: {
          categoryId: dmForm.categoryId,
          brand: dmForm.brand,
          name: dmForm.name,
          series: dmForm.series || undefined,
          releaseDate: dmForm.releaseDate || undefined,
        },
      });
      toast.add({ title: '기기모델이 등록되었습니다.', color: 'green' });
    }
    showDmForm.value = false;
    refreshDm();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '처리에 실패했습니다.', color: 'red' });
  } finally {
    isDmSubmitting.value = false;
  }
}

async function handleDmDelete(id: string) {
  if (!confirm('이 기기모델을 삭제/비활성화하시겠습니까?')) return;
  try {
    await apiFetch(`/admin/metadata/device-models/${id}`, { method: 'DELETE' });
    toast.add({ title: '처리되었습니다.', color: 'green' });
    refreshDm();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '처리에 실패했습니다.', color: 'red' });
  }
}

// ---------------------------------------------------------------------------
// 모델변형 탭
// ---------------------------------------------------------------------------
const mvPage = ref(1);
const mvLimit = ref(20);
const mvModelFilter = ref('');

const mvQueryString = computed(() => {
  const params = new URLSearchParams();
  params.set('page', String(mvPage.value));
  params.set('limit', String(mvLimit.value));
  if (mvModelFilter.value) params.set('modelId', mvModelFilter.value);
  return `/admin/metadata/model-variants?${params.toString()}`;
});

const { data: mvData, pending: mvPending, refresh: refreshMv } = useAdminApi<any>(mvQueryString);

// 모델 선택 옵션 (기기모델 전체 목록)
const { data: allModelsData } = useAdminApi<any>('/admin/metadata/device-models?limit=100');
const modelFilterOptions = computed(() => {
  const models = (allModelsData.value as any)?.data || [];
  return [
    { label: '전체', value: '' },
    ...models.map((m: any) => ({
      label: `${m.brand} ${m.name}`,
      value: m.id,
    })),
  ];
});

const mvColumns = [
  { key: 'model', label: '기기모델' },
  { key: 'storage', label: '용량', class: 'w-24' },
  { key: 'color', label: '색상', class: 'w-32' },
  { key: 'originalMsrp', label: '출시가', class: 'w-28' },
  { key: '_count', label: '상품수', class: 'w-20' },
  { key: 'actions', label: '', class: 'w-24' },
];

const showMvForm = ref(false);
const editingMvId = ref<string | null>(null);
const isMvSubmitting = ref(false);

const mvForm = reactive({
  modelId: '',
  storage: '',
  color: '',
  originalMsrp: 0,
});

function openMvCreate() {
  editingMvId.value = null;
  Object.assign(mvForm, { modelId: '', storage: '', color: '', originalMsrp: 0 });
  showMvForm.value = true;
}

function openMvEdit(variant: any) {
  editingMvId.value = variant.id;
  Object.assign(mvForm, {
    modelId: variant.modelId || variant.model?.id || '',
    storage: variant.storage || '',
    color: variant.color || '',
    originalMsrp: variant.originalMsrp ?? 0,
  });
  showMvForm.value = true;
}

async function handleMvSubmit() {
  if (!mvForm.storage.trim() || !mvForm.color.trim()) {
    toast.add({ title: '용량과 색상은 필수입니다.', color: 'red' });
    return;
  }
  isMvSubmitting.value = true;
  try {
    if (editingMvId.value) {
      await apiFetch(`/admin/metadata/model-variants/${editingMvId.value}`, {
        method: 'PATCH',
        body: {
          storage: mvForm.storage,
          color: mvForm.color,
          originalMsrp: mvForm.originalMsrp || undefined,
        },
      });
      toast.add({ title: '모델변형이 수정되었습니다.', color: 'green' });
    } else {
      if (!mvForm.modelId) {
        toast.add({ title: '기기모델은 필수입니다.', color: 'red' });
        isMvSubmitting.value = false;
        return;
      }
      await apiFetch('/admin/metadata/model-variants', {
        method: 'POST',
        body: {
          modelId: mvForm.modelId,
          storage: mvForm.storage,
          color: mvForm.color,
          originalMsrp: mvForm.originalMsrp || undefined,
        },
      });
      toast.add({ title: '모델변형이 등록되었습니다.', color: 'green' });
    }
    showMvForm.value = false;
    refreshMv();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '처리에 실패했습니다.', color: 'red' });
  } finally {
    isMvSubmitting.value = false;
  }
}

async function handleMvDelete(id: string) {
  if (!confirm('이 모델변형을 삭제하시겠습니까?')) return;
  try {
    await apiFetch(`/admin/metadata/model-variants/${id}`, { method: 'DELETE' });
    toast.add({ title: '모델변형이 삭제되었습니다.', color: 'green' });
    refreshMv();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '처리에 실패했습니다.', color: 'red' });
  }
}

// ---------------------------------------------------------------------------
// 유틸
// ---------------------------------------------------------------------------
function formatPrice(price: number | null | undefined) {
  if (!price) return '-';
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">메타데이터 관리</h1>

    <UTabs :items="tabs" v-model="activeTab">
      <!-- 카테고리 탭 -->
      <template #item="{ item }">
        <div v-if="item.key === 'categories'" class="mt-4">
          <!-- 수정 모달 -->
          <UModal v-model="showCategoryForm">
            <div class="p-6">
              <h3 class="text-lg font-semibold mb-4">카테고리 수정</h3>
              <form @submit.prevent="handleCategorySubmit" class="space-y-4">
                <UFormGroup label="이름">
                  <UInput v-model="categoryForm.name" placeholder="카테고리 이름" />
                </UFormGroup>
                <UFormGroup label="설명">
                  <UInput v-model="categoryForm.description" placeholder="설명" />
                </UFormGroup>
                <UFormGroup label="아이콘">
                  <UInput v-model="categoryForm.icon" placeholder="i-heroicons-..." />
                </UFormGroup>
                <div class="grid grid-cols-2 gap-4">
                  <UFormGroup label="정렬 순서">
                    <UInput v-model.number="categoryForm.sortOrder" type="number" min="0" />
                  </UFormGroup>
                  <UFormGroup label="활성 상태">
                    <div class="flex items-center gap-2 pt-2">
                      <input id="catActive" v-model="categoryForm.isActive" type="checkbox" class="rounded border-gray-300 text-primary-600" />
                      <label for="catActive" class="text-sm">활성화</label>
                    </div>
                  </UFormGroup>
                </div>
                <div class="flex gap-3 pt-4 border-t">
                  <UButton type="submit" label="수정" :loading="isCategorySubmitting" />
                  <UButton variant="outline" color="gray" label="취소" @click="showCategoryForm = false; resetCategoryForm();" />
                </div>
              </form>
            </div>
          </UModal>

          <!-- 테이블 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <UTable :columns="categoryColumns" :rows="(categoryData as any[]) || []" :loading="categoryPending">
              <template #type-data="{ row }">
                <UBadge variant="subtle" size="xs">{{ row.type }}</UBadge>
              </template>
              <template #icon-data="{ row }">
                <div v-if="row.icon" class="flex items-center gap-1">
                  <UIcon :name="row.icon" class="w-4 h-4" />
                  <span class="text-xs text-gray-500">{{ row.icon }}</span>
                </div>
                <span v-else class="text-xs text-gray-400">-</span>
              </template>
              <template #sortOrder-data="{ row }">
                <span class="text-sm text-gray-600">{{ row.sortOrder }}</span>
              </template>
              <template #isActive-data="{ row }">
                <UBadge :color="row.isActive ? 'green' : 'red'" variant="subtle" size="xs">
                  {{ row.isActive ? '활성' : '비활성' }}
                </UBadge>
              </template>
              <template #_count-data="{ row }">
                <span class="text-xs text-gray-500">모델 {{ row._count?.models || 0 }} / 상품 {{ row._count?.products || 0 }}</span>
              </template>
              <template #actions-data="{ row }">
                <UButton variant="ghost" color="gray" icon="i-heroicons-pencil-square" size="xs" @click="openCategoryEdit(row)" />
              </template>
            </UTable>
          </div>
        </div>

        <!-- 기기모델 탭 -->
        <div v-else-if="item.key === 'device-models'" class="mt-4">
          <!-- 필터 -->
          <div class="flex items-center gap-3 mb-4">
            <USelect v-model="dmCategoryFilter" :options="categoryFilterOptions" value-attribute="value" option-attribute="label" placeholder="카테고리" class="w-40" size="sm" />
            <USelect v-model="dmBrandFilter" :options="brandFilterOptions" value-attribute="value" option-attribute="label" placeholder="브랜드" class="w-32" size="sm" />
            <UInput v-model="dmSearch" placeholder="모델명 검색" icon="i-heroicons-magnifying-glass" class="w-48" size="sm" @keyup.enter="refreshDm" />
            <div class="flex-1" />
            <UButton icon="i-heroicons-plus" label="기기모델 등록" size="sm" @click="openDmCreate" />
          </div>

          <!-- 수정/등록 모달 -->
          <UModal v-model="showDmForm">
            <div class="p-6">
              <h3 class="text-lg font-semibold mb-4">{{ editingDmId ? '기기모델 수정' : '기기모델 등록' }}</h3>
              <form @submit.prevent="handleDmSubmit" class="space-y-4">
                <div v-if="!editingDmId" class="grid grid-cols-2 gap-4">
                  <UFormGroup label="카테고리" required>
                    <USelect v-model="dmForm.categoryId" :options="categoryFilterOptions.filter((o: any) => o.value)" value-attribute="value" option-attribute="label" placeholder="카테고리 선택" />
                  </UFormGroup>
                  <UFormGroup label="브랜드" required>
                    <USelect v-model="dmForm.brand" :options="brandOptions" value-attribute="value" option-attribute="label" placeholder="브랜드 선택" />
                  </UFormGroup>
                </div>
                <UFormGroup label="모델명" required>
                  <UInput v-model="dmForm.name" placeholder="예: 아이폰 15 Pro" />
                </UFormGroup>
                <div class="grid grid-cols-2 gap-4">
                  <UFormGroup label="시리즈">
                    <UInput v-model="dmForm.series" placeholder="예: 15 시리즈" />
                  </UFormGroup>
                  <UFormGroup label="출시일">
                    <UInput v-model="dmForm.releaseDate" type="date" />
                  </UFormGroup>
                </div>
                <div v-if="editingDmId" class="flex items-center gap-2">
                  <input id="dmActive" v-model="dmForm.isActive" type="checkbox" class="rounded border-gray-300 text-primary-600" />
                  <label for="dmActive" class="text-sm">활성화</label>
                </div>
                <div class="flex gap-3 pt-4 border-t">
                  <UButton type="submit" :label="editingDmId ? '수정' : '등록'" :loading="isDmSubmitting" />
                  <UButton variant="outline" color="gray" label="취소" @click="showDmForm = false" />
                </div>
              </form>
            </div>
          </UModal>

          <!-- 테이블 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <UTable :columns="dmColumns" :rows="dmData?.data || []" :loading="dmPending">
              <template #brand-data="{ row }">
                <UBadge variant="subtle" size="xs">{{ row.brand }}</UBadge>
              </template>
              <template #name-data="{ row }">
                <span class="text-sm font-medium">{{ row.name }}</span>
              </template>
              <template #series-data="{ row }">
                <span class="text-sm text-gray-500">{{ row.series || '-' }}</span>
              </template>
              <template #category-data="{ row }">
                <span class="text-sm text-gray-500">{{ row.category?.name || '-' }}</span>
              </template>
              <template #isActive-data="{ row }">
                <UBadge :color="row.isActive ? 'green' : 'red'" variant="subtle" size="xs">
                  {{ row.isActive ? '활성' : '비활성' }}
                </UBadge>
              </template>
              <template #_count-data="{ row }">
                <span class="text-xs text-gray-500">{{ row._count?.variants || 0 }}변형 / {{ row._count?.products || 0 }}상품</span>
              </template>
              <template #actions-data="{ row }">
                <div class="flex gap-1">
                  <UButton variant="ghost" color="gray" icon="i-heroicons-pencil-square" size="xs" @click="openDmEdit(row)" />
                  <UButton variant="ghost" color="red" icon="i-heroicons-trash" size="xs" @click="handleDmDelete(row.id)" />
                </div>
              </template>
            </UTable>

            <div v-if="dmData?.meta" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p class="text-sm text-gray-500">총 {{ dmData.meta.total }}건</p>
              <UPagination v-model="dmPage" :total="dmData.meta.total" :page-count="dmLimit" />
            </div>
          </div>
        </div>

        <!-- 모델변형 탭 -->
        <div v-else-if="item.key === 'model-variants'" class="mt-4">
          <!-- 필터 -->
          <div class="flex items-center gap-3 mb-4">
            <USelect v-model="mvModelFilter" :options="modelFilterOptions" value-attribute="value" option-attribute="label" placeholder="기기모델" class="w-56" size="sm" />
            <div class="flex-1" />
            <UButton icon="i-heroicons-plus" label="모델변형 등록" size="sm" @click="openMvCreate" />
          </div>

          <!-- 등록/수정 모달 -->
          <UModal v-model="showMvForm">
            <div class="p-6">
              <h3 class="text-lg font-semibold mb-4">{{ editingMvId ? '모델변형 수정' : '모델변형 등록' }}</h3>
              <form @submit.prevent="handleMvSubmit" class="space-y-4">
                <UFormGroup v-if="!editingMvId" label="기기모델" required>
                  <USelect v-model="mvForm.modelId" :options="modelFilterOptions.filter((o: any) => o.value)" value-attribute="value" option-attribute="label" placeholder="기기모델 선택" />
                </UFormGroup>
                <div class="grid grid-cols-2 gap-4">
                  <UFormGroup label="저장 용량" required>
                    <USelect v-model="mvForm.storage" :options="storageOptions" value-attribute="value" option-attribute="label" placeholder="용량 선택" />
                  </UFormGroup>
                  <UFormGroup label="색상" required>
                    <UInput v-model="mvForm.color" placeholder="예: 내추럴 티타늄" />
                  </UFormGroup>
                </div>
                <UFormGroup label="출시가 (원)">
                  <UInput v-model.number="mvForm.originalMsrp" type="number" min="0" step="10000" placeholder="예: 1550000" />
                </UFormGroup>
                <div class="flex gap-3 pt-4 border-t">
                  <UButton type="submit" :label="editingMvId ? '수정' : '등록'" :loading="isMvSubmitting" />
                  <UButton variant="outline" color="gray" label="취소" @click="showMvForm = false" />
                </div>
              </form>
            </div>
          </UModal>

          <!-- 테이블 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <UTable :columns="mvColumns" :rows="mvData?.data || []" :loading="mvPending">
              <template #model-data="{ row }">
                <span class="text-sm font-medium">{{ row.model?.brand }} {{ row.model?.name }}</span>
              </template>
              <template #storage-data="{ row }">
                <UBadge variant="subtle" size="xs">{{ row.storage }}</UBadge>
              </template>
              <template #color-data="{ row }">
                <span class="text-sm">{{ row.color }}</span>
              </template>
              <template #originalMsrp-data="{ row }">
                <span class="text-sm text-gray-600">{{ formatPrice(row.originalMsrp) }}</span>
              </template>
              <template #_count-data="{ row }">
                <span class="text-xs text-gray-500">{{ row._count?.products || 0 }}</span>
              </template>
              <template #actions-data="{ row }">
                <div class="flex gap-1">
                  <UButton variant="ghost" color="gray" icon="i-heroicons-pencil-square" size="xs" @click="openMvEdit(row)" />
                  <UButton variant="ghost" color="red" icon="i-heroicons-trash" size="xs" @click="handleMvDelete(row.id)" />
                </div>
              </template>
            </UTable>

            <div v-if="mvData?.meta" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p class="text-sm text-gray-500">총 {{ mvData.meta.total }}건</p>
              <UPagination v-model="mvPage" :total="mvData.meta.total" :page-count="mvLimit" />
            </div>
          </div>
        </div>

        <!-- 참조 데이터 탭 -->
        <div v-else-if="item.key === 'enums'" class="mt-4 space-y-6">
          <!-- 브랜드 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">브랜드 (Brand)</h3>
            <div class="flex flex-wrap gap-2">
              <UBadge v-for="b in (enumData as any)?.brands" :key="b.key" variant="subtle" size="sm">
                {{ b.key }} - {{ b.label }}
              </UBadge>
            </div>
          </div>

          <!-- 카테고리 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">기기 카테고리 (DeviceCategory)</h3>
            <div class="flex flex-wrap gap-2">
              <UBadge v-for="c in (enumData as any)?.categories" :key="c.key" variant="subtle" size="sm">
                <UIcon v-if="c.icon" :name="c.icon" class="w-3 h-3 mr-1" />
                {{ c.key }} - {{ c.label }}
              </UBadge>
            </div>
          </div>

          <!-- 등급 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">상품 등급 (ProductGrade)</h3>
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead>
                  <tr class="text-left text-gray-500 border-b">
                    <th class="pb-2 pr-4">등급</th>
                    <th class="pb-2 pr-4">라벨</th>
                    <th class="pb-2 pr-4">설명</th>
                    <th class="pb-2">색상</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="g in (enumData as any)?.grades" :key="g.key" class="border-b last:border-0">
                    <td class="py-2 pr-4 font-medium">{{ g.key }}</td>
                    <td class="py-2 pr-4">{{ g.label }}</td>
                    <td class="py-2 pr-4 text-gray-500">{{ g.description }}</td>
                    <td class="py-2">
                      <UBadge :color="g.color" variant="subtle" size="xs">{{ g.color }}</UBadge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 저장 용량 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">저장 용량 (Storage)</h3>
            <div class="flex flex-wrap gap-2">
              <UBadge v-for="s in (enumData as any)?.storageOptions" :key="s" variant="subtle" size="sm">
                {{ s }}
              </UBadge>
            </div>
          </div>
        </div>
      </template>
    </UTabs>
  </div>
</template>
