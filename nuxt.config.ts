// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  
  modules: [
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt'
  ],
  
  runtimeConfig: {
    public: {
      apiBase: '' // 빈 문자열 = 같은 서버 사용
    }
  }
})