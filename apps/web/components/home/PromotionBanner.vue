<script setup lang="ts">
const config = useRuntimeConfig();
const apiBase = config.public.apiBaseUrl as string;

const { data: banners } = await useAsyncData('main-banners', () =>
  $fetch<any>(`${apiBase}/cms/banners`, {
    params: { position: 'MAIN_TOP' },
  }).catch(() => ({ data: [] }))
);

const bannerList = computed(() => banners.value?.data || []);
const currentIndex = ref(0);
let intervalId: ReturnType<typeof setInterval> | null = null;

function goTo(index: number) {
  currentIndex.value = index;
}

function handleBannerClick(banner: any) {
  if (banner.linkUrl) {
    navigateTo(banner.linkUrl, { external: banner.linkUrl.startsWith('http') });
  }
}

function startAutoRotation() {
  if (intervalId) clearInterval(intervalId);
  if (bannerList.value.length <= 1) return;
  intervalId = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % bannerList.value.length;
  }, 4000);
}

function stopAutoRotation() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

onMounted(() => {
  startAutoRotation();
});

onUnmounted(() => {
  stopAutoRotation();
});

watch(bannerList, () => {
  startAutoRotation();
});
</script>

<template>
  <section
    v-if="bannerList.length > 0"
    class="promotion-banner relative overflow-hidden"
    @mouseenter="stopAutoRotation"
    @mouseleave="startAutoRotation"
  >
    <div class="relative">
      <div
        v-for="(banner, index) in bannerList"
        :key="banner.id"
        :class="[
          'transition-opacity duration-500 absolute inset-0',
          index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0',
        ]"
      >
        <button
          class="w-full h-full cursor-pointer"
          @click="handleBannerClick(banner)"
        >
          <img
            :src="banner.imageUrl"
            :alt="banner.title"
            class="w-full h-48 sm:h-64 md:h-72 object-cover"
          />
        </button>
      </div>
      <!-- 첫 번째 배너의 높이를 기준으로 컨테이너 높이 잡기 -->
      <img
        v-if="bannerList.length"
        :src="bannerList[0].imageUrl"
        :alt="bannerList[0].title"
        class="w-full h-48 sm:h-64 md:h-72 object-cover invisible"
      />
    </div>

    <!-- 도트 네비게이션 -->
    <div
      v-if="bannerList.length > 1"
      class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20"
    >
      <button
        v-for="(_, index) in bannerList"
        :key="index"
        class="promotion-banner-dot"
        :class="index === currentIndex ? 'bg-white' : 'bg-white/50'"
        @click="goTo(index)"
      />
    </div>
  </section>
</template>
