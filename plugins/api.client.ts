// plugins/api.client.ts
// ========================================
// API 클라이언트 플러그인 (클라이언트 전용)
// ========================================
// 
// 기능:
//   1. 커스텀 $fetch 인스턴스 생성 ($api)
//   2. 모든 API 요청에 자동으로 Authorization 헤더 추가
//   3. 401/403 에러 발생 시 자동으로 토큰 갱신 및 재시도
//   4. 갱신 실패 시 자동 로그아웃 및 홈으로 리다이렉트
// 
// 사용법:
//   const { $api } = useNuxtApp()
//   const data = await $api('/some-protected-endpoint')

import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(() => {
  const router = useRouter()
  const auth = useAuthStore()

  const config = useRuntimeConfig()
  // baseURL: 환경 변수로 설정 가능, 기본값은 localhost:8080
  const baseURL = (config.public.apiBase as string | undefined) || 'http://localhost:8080'

  // ========================================
  // Refresh 중복 호출 방지
  // ========================================
  // 여러 API 요청이 동시에 실패할 경우 refresh를 한 번만 실행
  let refreshPromise: Promise<void> | null = null

  /**
   * Refresh Token으로 Access Token 갱신
   * - 중복 호출 방지: 이미 갱신 중이면 기존 Promise 재사용
   */
  async function ensureRefreshed() {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          await auth.refresh()
        } finally {
          refreshPromise = null  // 완료 후 초기화
        }
      })()
    }
    return refreshPromise
  }

  // ========================================
  // $fetch 커스텀 인스턴스 생성
  // ========================================
  const api: typeof $fetch = $fetch.create({
    baseURL,

    // ========================================
    // onRequest: 요청 전 인터셉터
    // ========================================
    // 모든 API 요청에 Authorization 헤더 자동 추가
    onRequest({ request, options }) {
      const url = typeof request === 'string' ? request : ''

      // /api/auth/* 경로는 인증 헤더 추가 안 함 (로그인, 회원가입 등)
      if (url.includes('/api/auth/')) {
        return
      }

      // Access Token이 있으면 Authorization 헤더 추가
      if (auth.accessToken) {
        if (!options.headers) {
          options.headers = {} as any
        }
        // Bearer 토큰 방식으로 헤더 설정
        (options.headers as any).Authorization = `Bearer ${auth.accessToken}`
      }
    },

    // ========================================
    // onResponseError: 응답 에러 인터셉터
    // ========================================
    // 401/403 에러 발생 시 자동으로 토큰 갱신 후 재시도
    async onResponseError({ request, options, response }): Promise<any> {
      const url = typeof request === 'string' ? request : ''
      const status = response.status

      // /api/auth/* 경로는 처리 안 함 (무한 루프 방지)
      if (url.includes('/api/auth/')) {
        throw response
      }

      // 재시도 플래그 확인 (무한 재시도 방지)
      const opt: any = options
      if (opt._isRetry) {
        throw response  // 이미 재시도한 요청이면 에러 throw
      }

      // ========================================
      // 401/403 에러 처리: 토큰 갱신 및 재시도
      // ========================================
      if (status === 401 || status === 403) {
        try {
          // Refresh Token으로 Access Token 갱신
          await ensureRefreshed()

          // 새로운 Access Token으로 헤더 업데이트
          if (!options.headers) {
            options.headers = {} as any
          }
          
          if (auth.accessToken) {
            (options.headers as any).Authorization = `Bearer ${auth.accessToken}`
          }

          // 재시도 플래그 설정 후 요청 재시도
          const retryOptions: any = {
            ...options,
            _isRetry: true  // 재시도 표시
          }

          return await api(request, retryOptions)
        } catch (e) {
          // 갱신 실패 시 로그아웃 처리
          await auth.logout()
          
          // 현재 페이지가 홈이 아니면 홈으로 리다이렉트
          if (router.currentRoute.value.path !== '/') {
            await router.push('/')
          }
          
          throw response
        }
      }

      // 다른 에러는 그대로 throw
      throw response
    }
  })

  // ========================================
  // 플러그인으로 $api 제공
  // ========================================
  // 컴포넌트에서 useNuxtApp().$api 로 사용 가능
  return {
    provide: {
      api
    }
  }
})