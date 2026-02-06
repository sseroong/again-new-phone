export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_URL || 'http://localhost:3001/api',
      siteName: '폰마켓 관리자',
    },
  },

  app: {
    head: {
      title: '폰마켓 관리자',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '폰마켓 관리자 백오피스' },
      ],
    },
  },

  colorMode: {
    preference: 'light',
  },

  ui: {
    icons: ['heroicons'],
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  typescript: {
    strict: true,
  },

  compatibilityDate: '2024-01-01',
});
