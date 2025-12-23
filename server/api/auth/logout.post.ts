// server/api/auth/logout.post.ts
// ========================================
// 로그아웃 API 엔드포인트
// ========================================
// 
// URL: POST /api/auth/logout
// 
// 요청 본문:
//   { refreshToken: string }
// 
// 응답:
//   { message: 'Logout successful' }
// 
// 처리 과정:
//   1. Refresh Token을 메모리에서 삭제
//   2. 성공 메시지 반환
// 
// 참고:
//   - Access Token은 서버에서 관리하지 않으므로 클라이언트에서 삭제
//   - Refresh Token만 서버에서 무효화

import { refreshTokens } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  // ========================================
  // 1단계: 요청 본문 파싱
  // ========================================
  
  const body = await readBody(event)
  const { refreshToken } = body

  // ========================================
  // 2단계: Refresh Token 삭제
  // ========================================
  // refreshToken이 없어도 에러 없이 처리 (멱등성 보장)
  if (refreshToken) {
    // 메모리에서 Refresh Token 삭제 → 해당 토큰으로는 더 이상 갱신 불가
    refreshTokens.delete(refreshToken)
  }

  // ========================================
  // 3단계: 성공 응답 반환
  // ========================================
  
  return {
    message: 'Logout successful'
  }
})