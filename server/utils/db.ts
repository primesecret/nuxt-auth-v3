// server/utils/db.ts
// ========================================
// 메모리 기반 데이터베이스 (개발/테스트용)
// ========================================
// 
// 주의사항:
// - 서버 재시작 시 모든 데이터 초기화됨
// - 실제 프로덕션에서는 PostgreSQL, MongoDB 등 사용 권장
// - 비밀번호는 평문 저장 (실제로는 bcrypt 등으로 해시 필요)
// 
// 이 파일의 export들은 모든 server API 파일에서 공유됨
// - server/api/auth/login.post.ts
// - server/api/auth/register.post.ts
// - server/api/auth/refresh-token.post.ts
// - server/api/auth/logout.post.ts

// ========================================
// 타입 정의
// ========================================

// 사용자 정보 인터페이스
export interface User {
  id: number          // 사용자 고유 ID
  email: string       // 이메일 (로그인 ID)
  password: string    // 비밀번호 (실제로는 해시값 저장해야 함)
  name: string        // 사용자 이름
}

// Refresh Token 저장 데이터
export interface RefreshTokenData {
  userId: number      // 토큰 소유자 ID
  expiresAt: number   // 만료 시각 (타임스탬프)
}

// ========================================
// 데이터 저장소
// ========================================

// 사용자 목록 (배열)
// 기본 테스트 계정 포함
export const users: User[] = [
  {
    id: 1,
    email: 'test@local',
    password: '1234',  // 실제로는 bcrypt 해시값 저장
    name: 'Test User'
  }
]

// Refresh Token 저장소 (Map)
// key: refreshToken (UUID), value: RefreshTokenData
// 로그아웃 시 또는 만료 시 삭제됨
export const refreshTokens = new Map<string, RefreshTokenData>()

// ========================================
// 유틸리티 함수
// ========================================

// 새 사용자 ID 생성용 카운터
export let userIdCounter = 2  // id: 1은 테스트 계정이 사용 중

/**
 * 다음 사용자 ID를 반환하고 카운터 증가
 * @returns 새로운 사용자 ID
 */
export function incrementUserId() {
  return userIdCounter++
}
