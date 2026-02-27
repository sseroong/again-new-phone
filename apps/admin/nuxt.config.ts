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
      siteName: '딱내폰 관리자',
    },
  },

  app: {
    head: {
      title: '딱내폰 관리자',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '딱내폰 관리자 백오피스' },
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

  vite: {
    plugins: [
      {
        name: 'resolve-app-manifest',
        resolveId(id: string) {
          if (id === '#app-manifest') {
            return '\0virtual:app-manifest';
          }
        },
        load(id: string) {
          if (id === '\0virtual:app-manifest') {
            return 'export default {}';
          }
        },
      },
    ],
  },

  compatibilityDate: '2024-01-01',
});
