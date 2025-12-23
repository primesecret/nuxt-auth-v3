// server/api/auth/register.post.ts
// ========================================
// 회원가입 API 엔드포인트
// ========================================
// 
// URL: POST /api/auth/register
// 
// 요청 본문:
//   { email: string, password: string, name?: string }
// 
// 응답:
//   { accessToken, refreshToken, tokenType, expiresIn, refreshExpiresIn }
// 
// 처리 과정:
//   1. 이메일 중복 확인
//   2. 새 사용자 등록
//   3. Access Token & Refresh Token 생성
//   4. Refresh Token을 메모리에 저장
//   5. 토큰 정보 반환

import { randomUUID } from 'node:crypto'
import { users, refreshTokens, incrementUserId } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  // ========================================
  // 1단계: 요청 본문 파싱 및 검증
  // ========================================
  
  const body = await readBody(event)
  const { email, password, name } = body

  // 필수 필드 검증
  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: 'Email and password are required'
    })
  }

  // ========================================
  // 2단계: 이메일 중복 확인
  // ========================================
  
  // 이미 등록된 이메일인지 확인
  if (users.find(u => u.email === email)) {
    throw createError({
      statusCode: 400,
      message: 'Email already exists'
    })
  }

  // ========================================
  // 3단계: 새 사용자 생성 및 저장
  // ========================================
  
  const newUser = {
    id: incrementUserId(),  // 고유 ID 생성
    email,
    password,  // 실제로는 bcrypt.hash(password, 10)으로 해시해야 함
    name: name || email.split('@')[0]  // name이 없으면 이메일의 @ 앞 부분 사용
  }

  // 메모리 DB에 사용자 추가
  users.push(newUser)

  // ========================================
  // 4단계: Access Token 생성
  // ========================================
  
  const accessToken = Buffer.from(JSON.stringify({
    userId: newUser.id,
    email: newUser.email,
    exp: Date.now() + 10 * 60 * 1000
  })).toString('base64')

  // ========================================
  // 5단계: Refresh Token 생성 및 저장
  // ========================================
  
  const refreshToken = randomUUID()
  const refreshExpiresAt = Date.now() + 20 * 60 * 1000

  refreshTokens.set(refreshToken, {
    userId: newUser.id,
    expiresAt: refreshExpiresAt
  })

  // ========================================
  // 6단계: 응답 반환
  // ========================================
  
  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: 10 * 60 * 1000,
    refreshExpiresIn: 20 * 60 * 1000
  }
})