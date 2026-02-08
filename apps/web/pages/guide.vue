<script setup lang="ts">
useHead({ title: '이용방법' });

const { data, pending } = useApi<any>('/cms/contents?type=GUIDE');
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Page Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold">이용방법</h1>
        <nav class="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <NuxtLink to="/" class="hover:text-gray-700">HOME</NuxtLink>
          <span>></span>
          <span class="text-gray-900">이용방법</span>
        </nav>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 로딩 -->
      <div v-if="pending" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
      </div>

      <!-- 가이드 카드 -->
      <div v-else-if="data?.data?.length" class="space-y-6">
        <div
          v-for="(item, idx) in data.data"
          :key="item.id"
          class="bg-white rounded-xl p-6 shadow-sm"
        >
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold flex-shrink-0">
              {{ idx + 1 }}
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-bold text-gray-900 mb-2">{{ item.title }}</h3>
              <div class="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {{ item.content }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-else class="bg-white rounded-xl p-12 text-center">
        <UIcon name="i-heroicons-book-open" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p class="text-gray-500">이용방법이 아직 등록되지 않았습니다.</p>
      </div>
    </div>
  </div>
</template>
