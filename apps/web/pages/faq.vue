<script setup lang="ts">
definePageMeta({
  layout: 'default',
});

useHead({
  title: '자주 묻는 질문',
});

const activeCategory = ref('');
const openItems = ref<Set<string>>(new Set());

const toggleItem = (id: string) => {
  if (openItems.value.has(id)) {
    openItems.value.delete(id);
  } else {
    openItems.value.add(id);
  }
};

const faqCategoryOptions = [
  { key: '', label: '전체' },
  { key: 'buy', label: '구매' },
  { key: 'sell', label: '판매' },
  { key: 'delivery', label: '배송/수거' },
  { key: 'payment', label: '결제/환불' },
  { key: 'etc', label: '기타' },
];

const queryString = computed(() => {
  const params = new URLSearchParams();
  if (activeCategory.value) params.set('category', activeCategory.value);
  return `/cms/faqs?${params.toString()}`;
});

const { data, pending } = useApi<any>(queryString);

const faqs = computed(() => data.value?.data || []);

watch(activeCategory, () => {
  openItems.value = new Set();
});
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Page Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold">자주 묻는 질문</h1>
        <nav class="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <NuxtLink to="/" class="hover:text-gray-700">HOME</NuxtLink>
          <span>></span>
          <span class="text-gray-900">FAQ</span>
        </nav>
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 카테고리 탭 -->
      <div class="flex gap-2 mb-8 overflow-x-auto pb-2">
        <button
          v-for="cat in faqCategoryOptions"
          :key="cat.key"
          class="px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
          :class="[
            activeCategory === cat.key
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          ]"
          @click="activeCategory = cat.key; openItems = new Set()"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- 로딩 -->
      <div v-if="pending" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
      </div>

      <!-- FAQ 아코디언 -->
      <div v-else-if="faqs.length" class="space-y-3">
        <div
          v-for="(faq, idx) in faqs"
          :key="faq.id || idx"
          class="bg-white rounded-xl overflow-hidden"
        >
          <button
            class="w-full px-6 py-4 flex items-center justify-between text-left"
            @click="toggleItem(faq.id || `${activeCategory}-${idx}`)"
          >
            <div class="flex items-center gap-3">
              <span class="text-primary-600 font-bold text-sm">Q</span>
              <span class="font-medium">{{ faq.title }}</span>
            </div>
            <UIcon
              name="i-heroicons-chevron-down"
              class="w-5 h-5 text-gray-400 transition-transform flex-shrink-0"
              :class="{ 'rotate-180': openItems.has(faq.id || `${activeCategory}-${idx}`) }"
            />
          </button>
          <div
            v-if="openItems.has(faq.id || `${activeCategory}-${idx}`)"
            class="px-6 pb-4"
          >
            <div class="flex gap-3 pl-0">
              <span class="text-gray-400 font-bold text-sm">A</span>
              <p class="text-gray-600 text-sm leading-relaxed">{{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-else class="bg-white rounded-xl p-12 text-center">
        <UIcon name="i-heroicons-question-mark-circle" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p class="text-gray-500">등록된 FAQ가 없습니다.</p>
      </div>

      <!-- 추가 문의 안내 -->
      <div class="mt-12 bg-white rounded-xl p-8 text-center">
        <UIcon name="i-heroicons-chat-bubble-left-right" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 class="font-bold text-lg mb-2">원하시는 답변을 찾지 못하셨나요?</h3>
        <p class="text-gray-500 text-sm mb-4">고객센터로 문의해주시면 빠르게 도움드리겠습니다.</p>
        <div class="flex items-center justify-center gap-4">
          <div class="text-center">
            <p class="text-sm text-gray-500">전화 문의</p>
            <p class="font-bold text-lg">1588-0000</p>
          </div>
          <div class="w-px h-10 bg-gray-200" />
          <div class="text-center">
            <p class="text-sm text-gray-500">운영 시간</p>
            <p class="font-bold text-lg">평일 09:00~18:00</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
