<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });
useHead({ title: '배너 관리' });

const toast = useToast();
const apiFetch = useAdminFetch();

const page = ref(1);
const limit = ref(20);

const queryString = computed(() => {
  const params = new URLSearchParams();
  params.set('page', String(page.value));
  params.set('limit', String(limit.value));
  return `/admin/cms/banners?${params.toString()}`;
});

const { data, pending, refresh } = useAdminApi<any>(queryString);

// 등록/수정 폼
const showForm = ref(false);
const editingId = ref<string | null>(null);
const isSubmitting = ref(false);

const form = reactive({
  title: '',
  imageUrl: '',
  linkUrl: '',
  position: 'MAIN_TOP',
  isActive: true,
  sortOrder: 0,
  startDate: '',
  endDate: '',
});

const positionOptions = [
  { label: '메인 상단', value: 'MAIN_TOP' },
  { label: '메인 중간', value: 'MAIN_MIDDLE' },
  { label: '메인 하단', value: 'MAIN_BOTTOM' },
  { label: '팝업', value: 'POPUP' },
];

const positionLabels: Record<string, string> = {
  MAIN_TOP: '메인 상단',
  MAIN_MIDDLE: '메인 중간',
  MAIN_BOTTOM: '메인 하단',
  POPUP: '팝업',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

function resetForm() {
  Object.assign(form, {
    title: '',
    imageUrl: '',
    linkUrl: '',
    position: 'MAIN_TOP',
    isActive: true,
    sortOrder: 0,
    startDate: '',
    endDate: '',
  });
  editingId.value = null;
}

function openCreate() {
  resetForm();
  showForm.value = true;
}

function openEdit(banner: any) {
  editingId.value = banner.id;
  Object.assign(form, {
    title: banner.title || '',
    imageUrl: banner.imageUrl || '',
    linkUrl: banner.linkUrl || '',
    position: banner.position || 'MAIN_TOP',
    isActive: banner.isActive ?? true,
    sortOrder: banner.sortOrder ?? 0,
    startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
    endDate: banner.endDate ? banner.endDate.split('T')[0] : '',
  });
  showForm.value = true;
}

async function handleSubmit() {
  if (!form.title.trim() || !form.imageUrl.trim()) {
    toast.add({ title: '제목과 이미지 URL은 필수입니다.', color: 'red' });
    return;
  }

  isSubmitting.value = true;
  try {
    const body: Record<string, any> = {
      title: form.title,
      imageUrl: form.imageUrl,
      linkUrl: form.linkUrl || undefined,
      position: form.position,
      isActive: form.isActive,
      sortOrder: form.sortOrder,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    };

    if (editingId.value) {
      await apiFetch(`/admin/cms/banners/${editingId.value}`, {
        method: 'PATCH',
        body,
      });
      toast.add({ title: '배너가 수정되었습니다.', color: 'green' });
    } else {
      await apiFetch('/admin/cms/banners', {
        method: 'POST',
        body,
      });
      toast.add({ title: '배너가 등록되었습니다.', color: 'green' });
    }

    showForm.value = false;
    resetForm();
    refresh();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '처리에 실패했습니다.', color: 'red' });
  } finally {
    isSubmitting.value = false;
  }
}

async function handleDelete(id: string) {
  if (!confirm('이 배너를 비활성화하시겠습니까?')) return;
  try {
    await apiFetch(`/admin/cms/banners/${id}`, { method: 'DELETE' });
    toast.add({ title: '배너가 비활성화되었습니다.', color: 'green' });
    refresh();
  } catch (error: any) {
    toast.add({ title: error?.data?.message || '처리에 실패했습니다.', color: 'red' });
  }
}

const columns = [
  { key: 'title', label: '제목' },
  { key: 'position', label: '위치', class: 'w-28' },
  { key: 'isActive', label: '상태', class: 'w-20' },
  { key: 'sortOrder', label: '순서', class: 'w-16' },
  { key: 'createdAt', label: '등록일', class: 'w-28' },
  { key: 'actions', label: '', class: 'w-28' },
];
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <UButton to="/cms" variant="ghost" color="gray" icon="i-heroicons-arrow-left" />
        <h1 class="text-2xl font-bold text-gray-900">배너 관리</h1>
      </div>
      <UButton
        icon="i-heroicons-plus"
        label="배너 등록"
        @click="openCreate"
      />
    </div>

    <!-- 등록/수정 폼 -->
    <div v-if="showForm" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 max-w-3xl">
      <h2 class="text-lg font-semibold mb-4">{{ editingId ? '배너 수정' : '배너 등록' }}</h2>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormGroup label="제목" required>
            <UInput v-model="form.title" placeholder="배너 제목" />
          </UFormGroup>
          <UFormGroup label="위치">
            <USelect v-model="form.position" :options="positionOptions" value-attribute="value" option-attribute="label" />
          </UFormGroup>
        </div>

        <UFormGroup label="이미지 URL" required>
          <UInput v-model="form.imageUrl" placeholder="https://example.com/banner.jpg" />
        </UFormGroup>

        <UFormGroup label="링크 URL">
          <UInput v-model="form.linkUrl" placeholder="/events/1 또는 https://..." />
        </UFormGroup>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UFormGroup label="정렬 순서">
            <UInput v-model.number="form.sortOrder" type="number" min="0" />
          </UFormGroup>
          <UFormGroup label="시작일">
            <UInput v-model="form.startDate" type="date" />
          </UFormGroup>
          <UFormGroup label="종료일">
            <UInput v-model="form.endDate" type="date" />
          </UFormGroup>
        </div>

        <div class="flex items-center gap-2">
          <input id="isActive" v-model="form.isActive" type="checkbox" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          <label for="isActive" class="text-sm text-gray-700">활성화</label>
        </div>

        <div class="flex gap-3 pt-4 border-t">
          <UButton type="submit" :label="editingId ? '수정' : '등록'" :loading="isSubmitting" />
          <UButton variant="outline" color="gray" label="취소" @click="showForm = false; resetForm();" />
        </div>
      </form>
    </div>

    <!-- 테이블 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <UTable :columns="columns" :rows="data?.data || []" :loading="pending">
        <template #title-data="{ row }">
          <div class="flex items-center gap-2">
            <img v-if="row.imageUrl" :src="row.imageUrl" :alt="row.title" class="w-16 h-10 object-cover rounded" />
            <span class="text-sm font-medium">{{ row.title }}</span>
          </div>
        </template>
        <template #position-data="{ row }">
          <UBadge variant="subtle" size="xs">{{ positionLabels[row.position] || row.position }}</UBadge>
        </template>
        <template #isActive-data="{ row }">
          <UBadge :color="row.isActive ? 'green' : 'red'" variant="subtle" size="xs">
            {{ row.isActive ? '활성' : '비활성' }}
          </UBadge>
        </template>
        <template #sortOrder-data="{ row }">
          <span class="text-sm text-gray-600">{{ row.sortOrder }}</span>
        </template>
        <template #createdAt-data="{ row }">
          <span class="text-sm text-gray-500">{{ formatDate(row.createdAt) }}</span>
        </template>
        <template #actions-data="{ row }">
          <div class="flex gap-1">
            <UButton variant="ghost" color="gray" icon="i-heroicons-pencil-square" size="xs" @click="openEdit(row)" />
            <UButton variant="ghost" color="red" icon="i-heroicons-trash" size="xs" @click="handleDelete(row.id)" />
          </div>
        </template>
      </UTable>

      <div v-if="data?.meta" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <p class="text-sm text-gray-500">총 {{ data.meta.total }}건</p>
        <UPagination v-model="page" :total="data.meta.total" :page-count="limit" @update:model-value="refresh" />
      </div>
    </div>
  </div>
</template>
