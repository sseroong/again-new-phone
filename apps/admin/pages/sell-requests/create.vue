<script setup lang="ts">
definePageMeta({ middleware: 'admin-auth' });
useHead({ title: '판매접수 등록' });

const toast = useToast();
const router = useRouter();
const apiFetch = useAdminFetch();

const form = reactive({
  userId: '',
  category: 'SMARTPHONE',
  brand: 'APPLE',
  modelName: '',
  storage: '128GB',
  color: '',
  selfGrade: 'A',
  estimatedPrice: 0,
  tradeMethod: 'COURIER',
  inspectionNotes: '',
});

const isSubmitting = ref(false);
const userSearch = ref('');
const userSearchResults = ref<any[]>([]);
const selectedUser = ref<any>(null);
const isSearching = ref(false);

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

const storageOptions = [
  { label: '16GB', value: '16GB' },
  { label: '32GB', value: '32GB' },
  { label: '64GB', value: '64GB' },
  { label: '128GB', value: '128GB' },
  { label: '256GB', value: '256GB' },
  { label: '512GB', value: '512GB' },
  { label: '1024GB', value: '1024GB' },
];

const gradeOptions = [
  { label: 'S+', value: 'S_PLUS' },
  { label: 'S', value: 'S' },
  { label: 'A', value: 'A' },
  { label: 'B+', value: 'B_PLUS' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
  { label: 'D', value: 'D' },
  { label: 'E', value: 'E' },
];

const tradeMethodOptions = [
  { label: '택배 거래', value: 'COURIER' },
  { label: '픽업 서비스', value: 'PICKUP' },
  { label: '방문 거래', value: 'VISIT' },
];

async function searchUsers() {
  if (!userSearch.value.trim()) return;
  isSearching.value = true;
  try {
    const data = await apiFetch<any>(`/admin/users?search=${encodeURIComponent(userSearch.value)}&limit=10`);
    userSearchResults.value = data?.data || [];
  } catch {
    userSearchResults.value = [];
  } finally {
    isSearching.value = false;
  }
}

function selectUser(user: any) {
  selectedUser.value = user;
  form.userId = user.id;
  userSearchResults.value = [];
  userSearch.value = '';
}

function clearUser() {
  selectedUser.value = null;
  form.userId = '';
}

async function handleSubmit() {
  if (!form.userId) {
    toast.add({ title: '사용자를 선택해주세요.', color: 'red' });
    return;
  }
  if (!form.modelName.trim()) {
    toast.add({ title: '모델명을 입력해주세요.', color: 'red' });
    return;
  }
  if (!form.estimatedPrice) {
    toast.add({ title: '예상 가격을 입력해주세요.', color: 'red' });
    return;
  }

  isSubmitting.value = true;
  try {
    await apiFetch('/admin/sell-requests', {
      method: 'POST',
      body: {
        userId: form.userId,
        category: form.category,
        brand: form.brand,
        modelName: form.modelName,
        storage: form.storage,
        color: form.color || undefined,
        selfGrade: form.selfGrade,
        estimatedPrice: form.estimatedPrice,
        tradeMethod: form.tradeMethod,
        inspectionNotes: form.inspectionNotes || undefined,
      },
    });
    toast.add({ title: '판매접수가 등록되었습니다.', color: 'green' });
    router.push('/sell-requests');
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
      <UButton to="/sell-requests" variant="ghost" color="gray" icon="i-heroicons-arrow-left" />
      <h1 class="text-2xl font-bold text-gray-900">판매접수 등록</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 max-w-3xl">
      <!-- 사용자 선택 -->
      <div>
        <h2 class="text-lg font-semibold mb-4">신청자 선택</h2>
        <div v-if="selectedUser" class="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <div>
            <p class="text-sm font-medium text-gray-900">{{ selectedUser.name }}</p>
            <p class="text-xs text-gray-500">{{ selectedUser.email }} / {{ selectedUser.phone || '-' }}</p>
          </div>
          <UButton variant="ghost" color="gray" icon="i-heroicons-x-mark" size="xs" @click="clearUser" />
        </div>
        <div v-else class="space-y-2">
          <div class="flex gap-2">
            <UInput
              v-model="userSearch"
              placeholder="이름, 이메일로 검색..."
              icon="i-heroicons-magnifying-glass"
              class="flex-1"
              @keyup.enter="searchUsers"
            />
            <UButton label="검색" :loading="isSearching" @click="searchUsers" />
          </div>
          <div v-if="userSearchResults.length" class="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
            <button
              v-for="user in userSearchResults"
              :key="user.id"
              type="button"
              class="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
              @click="selectUser(user)"
            >
              <p class="text-sm font-medium text-gray-900">{{ user.name }}</p>
              <p class="text-xs text-gray-500">{{ user.email }}</p>
            </button>
          </div>
        </div>
      </div>

      <!-- 기기 정보 -->
      <div>
        <h2 class="text-lg font-semibold mb-4">기기 정보</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormGroup label="카테고리" required>
            <USelect v-model="form.category" :options="categoryOptions" value-attribute="value" option-attribute="label" />
          </UFormGroup>

          <UFormGroup label="브랜드" required>
            <USelect v-model="form.brand" :options="brandOptions" value-attribute="value" option-attribute="label" />
          </UFormGroup>

          <UFormGroup label="모델명" required>
            <UInput v-model="form.modelName" placeholder="iPhone 15 Pro Max" />
          </UFormGroup>

          <UFormGroup label="용량" required>
            <USelect v-model="form.storage" :options="storageOptions" value-attribute="value" option-attribute="label" />
          </UFormGroup>

          <UFormGroup label="색상">
            <UInput v-model="form.color" placeholder="블랙 티타늄" />
          </UFormGroup>

          <UFormGroup label="자가 진단 등급" required>
            <USelect v-model="form.selfGrade" :options="gradeOptions" value-attribute="value" option-attribute="label" />
          </UFormGroup>
        </div>
      </div>

      <!-- 거래 정보 -->
      <div>
        <h2 class="text-lg font-semibold mb-4">거래 정보</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormGroup label="예상 가격 (원)" required>
            <UInput v-model.number="form.estimatedPrice" type="number" placeholder="0" />
          </UFormGroup>

          <UFormGroup label="거래 방식" required>
            <USelect v-model="form.tradeMethod" :options="tradeMethodOptions" value-attribute="value" option-attribute="label" />
          </UFormGroup>

          <UFormGroup label="검수 메모" class="md:col-span-2">
            <UTextarea v-model="form.inspectionNotes" rows="3" placeholder="검수 관련 메모를 입력하세요" />
          </UFormGroup>
        </div>
      </div>

      <div class="flex gap-3 pt-4 border-t">
        <UButton type="submit" label="등록" :loading="isSubmitting" />
        <UButton to="/sell-requests" variant="outline" color="gray" label="취소" />
      </div>
    </form>
  </div>
</template>
