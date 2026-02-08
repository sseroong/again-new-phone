<script setup lang="ts">
useHead({ title: '공지사항' });

const page = ref(1);
const limit = ref(20);

const queryString = computed(() => {
  const params = new URLSearchParams();
  params.set('type', 'NOTICE');
  params.set('page', String(page.value));
  params.set('limit', String(limit.value));
  return `/cms/contents?${params.toString()}`;
});

const { data, pending } = useApi<any>(queryString);

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR');
}
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Page Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold">공지사항</h1>
        <nav class="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <NuxtLink to="/" class="hover:text-gray-700">HOME</NuxtLink>
          <span>></span>
          <span class="text-gray-900">공지사항</span>
        </nav>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 로딩 -->
      <div v-if="pending" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
      </div>

      <!-- 목록 -->
      <div v-else-if="data?.data?.length" class="bg-white rounded-xl overflow-hidden">
        <div
          v-for="item in data.data"
          :key="item.id"
          class="border-b border-gray-100 last:border-0"
        >
          <NuxtLink
            :to="`/notices/${item.id}`"
            class="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center gap-3 min-w-0">
              <UBadge v-if="item.isPinned" color="red" variant="subtle" size="xs">고정</UBadge>
              <span class="font-medium text-gray-900 truncate">{{ item.title }}</span>
            </div>
            <span class="text-sm text-gray-400 flex-shrink-0 ml-4">{{ formatDate(item.createdAt) }}</span>
          </NuxtLink>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-else class="bg-white rounded-xl p-12 text-center">
        <UIcon name="i-heroicons-document-text" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p class="text-gray-500">등록된 공지사항이 없습니다.</p>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="data?.meta && data.meta.totalPages > 1" class="flex justify-center mt-6">
        <UPagination v-model="page" :total="data.meta.total" :page-count="limit" />
      </div>
    </div>
  </div>
</template>
