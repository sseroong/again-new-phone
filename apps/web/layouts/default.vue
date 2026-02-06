<script setup lang="ts">
const route = useRoute();

// 네비게이션 메뉴 항목
const navItems = [
  { label: '판매하기', to: '/sell', icon: 'i-heroicons-arrow-up-tray' },
  { label: '구매하기', to: '/buy', icon: 'i-heroicons-shopping-cart' },
  { label: '나의 거래내역', to: '/my/transactions', icon: 'i-heroicons-document-text' },
  { label: '실거래 리뷰', to: '/reviews', icon: 'i-heroicons-chat-bubble-left-right' },
  { label: '중고폰 시세', to: '/price', icon: 'i-heroicons-chart-bar' },
  { label: '내 기기 관리', to: '/my/devices', icon: 'i-heroicons-device-phone-mobile' },
];

// 더보기 메뉴 항목
const moreMenuItems = [
  [
    { label: '폰마켓 소개', to: '/about', icon: 'i-heroicons-information-circle' },
    { label: '이용방법', to: '/guide', icon: 'i-heroicons-book-open' },
  ],
  [
    { label: '이벤트', to: '/events', icon: 'i-heroicons-gift' },
    { label: '공지사항', to: '/notices', icon: 'i-heroicons-megaphone' },
    { label: '자주 묻는 질문', to: '/faq', icon: 'i-heroicons-question-mark-circle' },
  ],
  [
    { label: '분실/도난 조회', to: '/lost-device', icon: 'i-heroicons-shield-exclamation' },
  ],
];

// 현재 활성 탭
const isActiveTab = (to: string) => {
  return route.path.startsWith(to);
};
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Top Bar -->
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-2">
            <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-device-phone-mobile" class="w-5 h-5 text-white" />
            </div>
            <span class="text-xl font-bold text-gray-900">폰마켓</span>
          </NuxtLink>

          <!-- Right Actions -->
          <div class="flex items-center gap-4">
            <NuxtLink
              to="/auth/login"
              class="text-sm text-gray-600 hover:text-gray-900"
            >
              로그인
            </NuxtLink>
            <span class="text-gray-300">·</span>
            <NuxtLink
              to="/auth/register"
              class="text-sm text-gray-600 hover:text-gray-900"
            >
              회원가입
            </NuxtLink>
            <UDropdown :items="moreMenuItems" :popper="{ placement: 'bottom-end' }">
              <UButton
                variant="ghost"
                color="gray"
                icon="i-heroicons-bars-3"
                size="sm"
              />
            </UDropdown>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <nav class="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
            :class="[
              isActiveTab(item.to)
                ? 'text-primary-600 border-primary-600'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Top Section -->
        <div class="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-gray-100">
          <div>
            <p class="text-sm text-gray-600">
              <span class="font-medium">폰마켓 고객센터</span>
              <a href="mailto:cs@phonemarket.com" class="text-primary-600 ml-2">
                cs@phonemarket.com
              </a>
            </p>
            <p class="text-xs text-gray-500 mt-1">
              · 운영시간 ｜ 평일 10:00 ~ 17:00 (토·일, 공휴일 휴무)
            </p>
            <p class="text-xs text-gray-500">
              · 점심시간 ｜ 평일 11:30 ~ 12:30
            </p>
          </div>

          <div class="flex gap-4">
            <NuxtLink to="/terms" class="text-xs text-gray-500 hover:text-gray-700">
              이용약관
            </NuxtLink>
            <NuxtLink to="/privacy" class="text-xs text-gray-500 hover:text-gray-700">
              개인정보 처리방침
            </NuxtLink>
            <NuxtLink to="/blog" class="text-xs text-gray-500 hover:text-gray-700">
              블로그
            </NuxtLink>
          </div>
        </div>

        <!-- Bottom Section -->
        <div class="pt-6">
          <p class="text-xs text-gray-400 leading-relaxed">
            주식회사 폰마켓 | 대표 : 홍길동 | 사업자등록번호 : 000-00-00000<br />
            통신판매업번호 : 0000-서울강남-0000<br />
            서울특별시 강남구 테헤란로 000 00빌딩 00층
          </p>
          <p class="text-xs text-gray-400 mt-4">
            Copyright @ 2024 PhoneMarket Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>
