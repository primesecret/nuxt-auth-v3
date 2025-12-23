// server/api/auth/refresh-token.post.ts
// ========================================
// 토큰 갱신 API 엔드포인트
// ========================================
// 
// URL: POST /api/auth/refresh-token
// 
// 요청 본문:
//   { refreshToken: string }
// 
// 응답:
//   { accessToken, refreshToken, tokenType, expiresIn, refreshExpiresIn }
// 
// 처리 과정:
//   1. Refresh Token 유효성 확인
//   2. 기존 Refresh Token 삭제 (Rotation 전략)
//   3. 새 Access Token & Refresh Token 생성
//   4. 새 Refresh Token 저장
//   5. 토큰 정보 반환

import { randomUUID } from 'node:crypto'
import { refreshTokens } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  // ========================================
  // 1단계: 요청 본문 파싱 및 검증
  // ========================================
  
  const body = await readBody(event)
  const { refreshToken } = body

  if (!refreshToken) {
    throw createError({
      statusCode: 400,
      message: 'Refresh token is required'
    })
  }

  // ========================================
  // 2단계: Refresh Token 검증
  // ========================================
  
  // 메모리에 저장된 Refresh Token 조회
  const tokenData = refreshTokens.get(refreshToken)

  if (!tokenData) {
    throw createError({
      statusCode: 401,
      message: 'Invalid refresh token'
    })
  }

  // 만료 여부 확인
  if (Date.now() > tokenData.expiresAt) {
    // 만료된 토큰은 삭제
    refreshTokens.delete(refreshToken)
    throw createError({
      statusCode: 401,
      message: 'Refresh token expired'
    })
  }

  // ========================================
  // 3단계: 기존 Refresh Token 삭제 (Rotation)
  // ========================================
  // 보안: 한 번 사용한 Refresh Token은 삭제하여 재사용 방지
  refreshTokens.delete(refreshToken)

  // ========================================
  // 4단계: 새 Access Token 생성
  // ========================================
  
  const newAccessToken = Buffer.from(JSON.stringify({
    userId: tokenData.userId,
    exp: Date.now() + 10 * 60 * 1000
  })).toString('base64')

  // ========================================
  // 5단계: 새 Refresh Token 생성 및 저장
  // ========================================
  
  const newRefreshToken = randomUUID()
  const newRefreshExpiresAt = Date.now() + 20 * 60 * 1000

  refreshTokens.set(newRefreshToken, {
    userId: tokenData.userId,
    expiresAt: newRefreshExpiresAt
  })

  // ========================================
  // 6단계: 응답 반환
  // ========================================
  
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    tokenType: 'Bearer',
    expiresIn: 10 * 60 * 1000,
    refreshExpiresIn: 20 * 60 * 1000
  }
})