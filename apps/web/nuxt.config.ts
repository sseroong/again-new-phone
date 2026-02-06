// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // 서버 전용 (비밀 키)
    jwtSecret: process.env.JWT_SECRET,
    // 클라이언트에서도 사용 가능
    public: {
      apiBaseUrl: process.env.API_URL || 'http://localhost:3001/api',
      tossClientKey: process.env.TOSS_CLIENT_KEY || 'test_ck_xxxxxxxxxxxx',
      siteName: '폰마켓',
      siteDescription: '중고 전자기기 거래 플랫폼',
    },
  },

  app: {
    head: {
      title: '폰마켓 | 중고폰 판매/구매 플랫폼',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '중고 스마트폰, 태블릿, 노트북, 스마트워치 안전 거래 플랫폼' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  colorMode: {
    preference: 'light',
  },

  ui: {
    icons: ['heroicons', 'simple-icons'],
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  typescript: {
    strict: true,
  },

  compatibilityDate: '2024-01-01',
});
