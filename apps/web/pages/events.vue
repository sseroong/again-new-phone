<script setup lang="ts">
useHead({ title: '이벤트' });

const { data, pending } = useApi<any>('/cms/contents?type=EVENT');

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

function eventStatus(item: any) {
  const now = new Date();
  if (item.endDate && new Date(item.endDate) < now) return { label: '종료', color: 'gray' };
  if (item.startDate && new Date(item.startDate) > now) return { label: '예정', color: 'blue' };
  return { label: '진행중', color: 'green' };
}
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Page Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold">이벤트</h1>
        <nav class="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <NuxtLink to="/" class="hover:text-gray-700">HOME</NuxtLink>
          <span>></span>
          <span class="text-gray-900">이벤트</span>
        </nav>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 로딩 -->
      <div v-if="pending" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
      </div>

      <!-- 카드 그리드 -->
      <div v-else-if="data?.data?.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="item in data.data"
          :key="item.id"
          class="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <!-- 썸네일 -->
          <div class="aspect-video bg-gray-100 relative">
            <img
              v-if="item.thumbnail"
              :src="item.thumbnail"
              :alt="item.title"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-heroicons-photo" class="w-12 h-12 text-gray-300" />
            </div>
            <UBadge
              :color="eventStatus(item).color"
              class="absolute top-3 right-3"
              size="xs"
            >
              {{ eventStatus(item).label }}
            </UBadge>
          </div>

          <!-- 내용 -->
          <div class="p-4">
            <h3 class="font-bold text-gray-900 mb-2">{{ item.title }}</h3>
            <p v-if="item.content" class="text-sm text-gray-500 line-clamp-2 mb-3">
              {{ item.content }}
            </p>
            <div class="flex items-center justify-between text-xs text-gray-400">
              <span v-if="item.startDate && item.endDate">
                {{ formatDate(item.startDate) }} ~ {{ formatDate(item.endDate) }}
              </span>
              <span v-else>{{ formatDate(item.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-else class="bg-white rounded-xl p-12 text-center">
        <UIcon name="i-heroicons-gift" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p class="text-gray-500">진행중인 이벤트가 없습니다.</p>
      </div>
    </div>
  </div>
</template>
