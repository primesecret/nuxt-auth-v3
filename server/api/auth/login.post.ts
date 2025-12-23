// server/api/auth/login.post.ts
// ========================================
// 로그인 API 엔드포인트
// ========================================
// 
// URL: POST /api/auth/login
// 
// 요청 본문:
//   { email: string, password: string }
// 
// 응답:
//   { accessToken, refreshToken, tokenType, expiresIn, refreshExpiresIn }
// 
// 처리 과정:
//   1. 이메일/비밀번호로 사용자 찾기
//   2. Access Token & Refresh Token 생성
//   3. Refresh Token을 메모리에 저장
//   4. 토큰 정보 반환

import { randomUUID } from 'node:crypto'
import { users, refreshTokens } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  // ========================================
  // 1단계: 요청 본문 파싱 및 검증
  // ========================================
  
  const body = await readBody(event)
  const { email, password } = body

  // 필수 필드 검증
  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: 'Email and password are required'
    })
  }

  // ========================================
  // 2단계: 사용자 인증
  // ========================================
  
  // 메모리 DB에서 이메일과 비밀번호가 일치하는 사용자 찾기
  // 실제로는 비밀번호를 bcrypt.compare()로 비교해야 함
  const user = users.find(u => u.email === email && u.password === password)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password'
    })
  }

  // ========================================
  // 3단계: Access Token 생성
  // ========================================
  // 
  // 주의: 실제로는 JWT 라이브러리(jsonwebtoken) 사용 권장
  // 현재는 데모용으로 Base64 인코딩만 사용
  const accessToken = Buffer.from(JSON.stringify({
    userId: user.id,
    email: user.email,
    exp: Date.now() + 10 * 60 * 1000 // 만료 시각: 10분 후
  })).toString('base64')

  // ========================================
  // 4단계: Refresh Token 생성 및 저장
  // ========================================
  
  // UUID로 랜덤한 Refresh Token 생성
  const refreshToken = randomUUID()
  const refreshExpiresAt = Date.now() + 20 * 60 * 1000 // 20분 후 (테스트용 짧은 시간)

  // 메모리 Map에 Refresh Token 저장
  // 실제로는 데이터베이스에 저장해야 함
  refreshTokens.set(refreshToken, {
    userId: user.id,
    expiresAt: refreshExpiresAt
  })

  // ========================================
  // 5단계: 응답 반환
  // ========================================
  
  return {
    accessToken,              // Access Token (짧은 수명)
    refreshToken,             // Refresh Token (긴 수명)
    tokenType: 'Bearer',      // HTTP Authorization 헤더 타입
    expiresIn: 10 * 60 * 1000,        // Access Token 유효기간 (밀리초)
    refreshExpiresIn: 20 * 60 * 1000  // Refresh Token 유효기간 (밀리초)
  }
})