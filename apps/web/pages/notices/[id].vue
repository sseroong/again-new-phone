<script setup lang="ts">
const route = useRoute();
const id = route.params.id as string;

const { data: content, pending } = useApi<any>(`/cms/contents/${id}`);

useHead({
  title: computed(() => content.value?.title || '공지사항'),
});

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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
          <NuxtLink to="/notices" class="hover:text-gray-700">공지사항</NuxtLink>
          <span>></span>
          <span class="text-gray-900">상세</span>
        </nav>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 로딩 -->
      <div v-if="pending" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
      </div>

      <!-- 상세 -->
      <template v-else-if="content">
        <div class="bg-white rounded-xl overflow-hidden">
          <!-- 제목 영역 -->
          <div class="px-6 py-5 border-b border-gray-100">
            <h2 class="text-xl font-bold text-gray-900">{{ content.title }}</h2>
            <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>{{ formatDate(content.createdAt) }}</span>
              <span>조회 {{ content.viewCount }}</span>
            </div>
          </div>

          <!-- 본문 -->
          <div class="px-6 py-6">
            <div class="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
              {{ content.content }}
            </div>
          </div>
        </div>

        <!-- 목록으로 -->
        <div class="mt-6 text-center">
          <UButton to="/notices" variant="outline" color="gray" label="목록으로" icon="i-heroicons-arrow-left" />
        </div>
      </template>

      <!-- 에러 -->
      <div v-else class="bg-white rounded-xl p-12 text-center">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p class="text-gray-500">공지사항을 찾을 수 없습니다.</p>
        <UButton to="/notices" variant="outline" color="gray" label="목록으로" class="mt-4" />
      </div>
    </div>
  </div>
</template>
