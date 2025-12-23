// stores/auth.ts
// Pinia 기반 인증 상태 관리 스토어
// - Access Token/Refresh Token 관리
// - 로그인/로그아웃/회원가입/토큰 갱신 기능
// - localStorage에 상태 지속 (pinia-plugin-persistedstate)

import { defineStore } from 'pinia'

// 서버로부터 받는 인증 응답 타입 정의
type AuthResponse = {
  accessToken: string        // JWT Access Token (짧은 유효기간)
  refreshToken: string       // Refresh Token (긴 유효기간)
  tokenType: string          // 토큰 타입 (보통 "Bearer")
  expiresIn: number          // Access Token 만료 시간 (밀리초)
  refreshExpiresIn?: number  // Refresh Token 만료 시간 (밀리초, 선택)
}

// 'auth' 이름으로 스토어 정의 (Setup Store 방식)
export const useAuthStore = defineStore('auth', () => {
  // ========================================
  // State (상태)
  // ========================================
  
  const user = ref<any | null>(null)                    // 사용자 정보 (email 등)
  const accessToken = ref<string | null>(null)          // Access Token
  const refreshToken = ref<string | null>(null)         // Refresh Token
  const accessExpiresAt = ref<number | null>(null)      // Access Token 만료 시각 (타임스탬프)
  const refreshExpiresAt = ref<number | null>(null)     // Refresh Token 만료 시각 (타임스탬프)

  // ========================================
  // Getters (계산된 속성)
  // ========================================
  
  // 로그인 여부: accessToken이 있으면 인증된 것으로 간주
  const isAuthenticated = computed(() => !!accessToken.value)

  // ========================================
  // Actions (액션 함수들)
  // ========================================
  
  /**
   * 서버 응답으로 받은 토큰 정보를 스토어에 저장
   * @param res - 서버 응답 (토큰 정보)
   * @param email - 사용자 이메일 (선택, 로그인/회원가입 시)
   */
  function applyAuthResponse(res: AuthResponse, email?: string) {
    // 토큰 저장
    accessToken.value = res.accessToken
    refreshToken.value = res.refreshToken
    
    // Access Token 만료 시각 계산 (현재 시각 + expiresIn)
    accessExpiresAt.value = res.expiresIn ? Date.now() + res.expiresIn : null
    
    // Refresh Token 만료 시각 계산
    if (res.refreshExpiresIn) {
      refreshExpiresAt.value = Date.now() + res.refreshExpiresIn
    } else {
      // 서버에서 제공하지 않으면 기본값 7일
      refreshExpiresAt.value = Date.now() + (7 * 24 * 60 * 60 * 1000)
    }

    // 이메일이 제공되면 사용자 정보 저장
    if (email) {
      user.value = { email }
    }

    // 디버깅용 로그
    console.log('✅ Token stored')
    console.log('- Access expires:', new Date(accessExpiresAt.value!).toLocaleString())
    console.log('- Refresh expires:', new Date(refreshExpiresAt.value!).toLocaleString())
  }

  /**
   * 회원가입
   * @param email - 사용자 이메일
   * @param password - 비밀번호
   * @param name - 사용자 이름 (선택)
   */
  async function register(email: string, password: string, name?: string) {
    // 요청 본문 준비
    const body: any = { email, password }
    if (name) body.name = name

    // 서버에 회원가입 요청 ($fetch는 Nuxt의 전역 HTTP 클라이언트)
    const res = await $fetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body
    })

    // 받은 토큰 정보를 스토어에 저장
    applyAuthResponse(res, email)
  }

  /**
   * 로그인
   * @param email - 사용자 이메일
   * @param password - 비밀번호
   */
  async function login(email: string, password: string) {
    // 서버에 로그인 요청
    const res = await $fetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })

    // 받은 토큰 정보를 스토어에 저장
    applyAuthResponse(res, email)
  }
  
  /**
   * Access Token 갱신
   * - Refresh Token을 사용하여 새로운 Access Token 발급
   * - 실패 시 모든 인증 정보 삭제
   */
  async function refresh() {
    // Refresh Token이 없으면 에러
    if (!refreshToken.value) {
      throw new Error('No refresh token')
    }

    try {
      // 서버에 토큰 갱신 요청
      const res = await $fetch<AuthResponse>('/api/auth/refresh-token', {
        method: 'POST',
        body: { refreshToken: refreshToken.value }
      })

      // 새 토큰 정보 저장 (이메일은 이미 있으므로 전달 안 함)
      applyAuthResponse(res)
    } catch (error) {
      // 토큰 갱신 실패 시 모든 인증 정보 삭제
      user.value = null
      accessToken.value = null
      refreshToken.value = null
      accessExpiresAt.value = null
      refreshExpiresAt.value = null
      throw error
    }
  }

  /**
   * 로그아웃
   * - 서버에 로그아웃 요청 (Refresh Token 무효화)
   * - 로컬 인증 정보 모두 삭제
   */
  async function logout() {
    try {
      // 서버에 로그아웃 요청 (서버의 Refresh Token 삭제)
      await $fetch('/api/auth/logout', {
        method: 'POST',
        body: { refreshToken: refreshToken.value }
      })
    } catch (e) {
      console.error('logout 실패', e)
    } finally {
      // 성공 여부와 관계없이 로컬 상태는 무조건 삭제
      user.value = null
      accessToken.value = null
      refreshToken.value = null
      accessExpiresAt.value = null
      refreshExpiresAt.value = null
    }
  }

  // ========================================
  // Export (외부로 노출할 상태와 함수들)
  // ========================================
  
  return {
    // 상태
    user,
    accessToken,
    refreshToken,
    accessExpiresAt,
    refreshExpiresAt,
    
    // 계산된 속성
    isAuthenticated,
    
    // 액션
    register,
    login,
    refresh,
    logout
  }
}, {
  // ========================================
  // Persist 설정 (pinia-plugin-persistedstate)
  // ========================================
  // localStorage에 상태를 자동 저장/복원
  // - 브라우저 새로고침 후에도 로그인 상태 유지
  
  persist: {
    key: 'auth-store',  // localStorage의 키 이름
    // 서버 사이드에서는 localStorage 없으므로 undefined
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    // 저장할 상태 경로 (함수는 저장 안 함)
    paths: ['user', 'accessToken', 'refreshToken', 'accessExpiresAt', 'refreshExpiresAt']
  }
} as any)  // TypeScript 타입 에러 회피용

// 별칭 export (useAuth로도 사용 가능)
export const useAuth = useAuthStore