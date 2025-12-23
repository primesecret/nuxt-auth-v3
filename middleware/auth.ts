// middleware/auth.ts
// 인증이 필요한 페이지를 보호하는 미들웨어
// - 로그인 여부 확인
// - 토큰 만료 시 자동 갱신 시도
// - 인증 실패 시 홈으로 리다이렉트
// 
// 사용법: definePageMeta({ middleware: 'auth' })

import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to, from) => {
  // ========================================
  // 서버 사이드 체크 스킵
  // ========================================
  // 서버에는 localStorage가 없어서 토큰을 확인할 수 없음
  // 클라이언트에서만 인증 체크 수행
  if (process.server) {
    return
  }

  const auth = useAuthStore()

  // 디버깅용 로그
  console.log('[auth middleware] Checking authentication...')
  console.log('[auth middleware] isAuthenticated:', auth.isAuthenticated)
  console.log('[auth middleware] accessToken:', auth.accessToken ? 'exists' : 'null')

  // ========================================
  // 1단계: 로그인 여부 확인
  // ========================================
  if (!auth.isAuthenticated) {
    console.log('[auth middleware] Not Authorized User, redirect to /')
    return navigateTo('/')  // 홈으로 리다이렉트
  }

  // ========================================
  // 2단계: Refresh Token 만료 확인
  // ========================================
  // Refresh Token이 만료되면 더 이상 갱신 불가
  // 강제 로그아웃 처리
  const isRefreshTokenExpired =
    auth.refreshExpiresAt && Date.now() > auth.refreshExpiresAt

  if (isRefreshTokenExpired) {
    console.log('[auth middleware] Refresh Token Expired, force logout')
    await auth.logout()
    return navigateTo('/', { replace: true })  // 히스토리 남기지 않고 리다이렉트
  }

  // ========================================
  // 3단계: Access Token 만료 확인 및 갱신
  // ========================================
  // Access Token이 만료되었지만 Refresh Token은 유효한 경우
  // 자동으로 토큰 갱신 시도
  const isAccessTokenExpired =
    auth.accessExpiresAt && Date.now() > auth.accessExpiresAt

  if (isAccessTokenExpired) {
    console.log('[auth middleware] Access Token Expired, trying refresh...')
    
    try {
      // Refresh Token으로 새 Access Token 발급
      await auth.refresh()
      console.log('[auth middleware] Token refresh successful')
    } catch (error) {
      // 갱신 실패 (Refresh Token도 무효 등) → 로그아웃
      console.error('[auth middleware] Refresh failed:', error)
      await auth.logout()
      return navigateTo('/', { replace: true })
    }
  }

  // ========================================
  // 4단계: 모든 체크 통과
  // ========================================
  // 페이지 진입 허용 (아무것도 return하지 않음)
  console.log('[auth middleware] Authentication passed')
})