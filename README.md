# Nuxt Auth v3 프로젝트

JWT 토큰 기반 인증 시스템이 구현된 Nuxt 3 프로젝트입니다.

## 🚀 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다.

### 3. 프로덕션 빌드
```bash
npm run build
npm run preview
```

## 📁 프로젝트 구조

```
nuxt-auth-v3/
├── server/
│   ├── api/
│   │   └── auth/
│   │       ├── login.post.ts          # 로그인 API
│   │       ├── register.post.ts       # 회원가입 API
│   │       ├── refresh-token.post.ts  # 토큰 갱신 API
│   │       └── logout.post.ts         # 로그아웃 API
│   └── utils/
│       └── db.ts                      # 공유 메모리 DB (신규)
├── stores/
│   └── auth.ts                        # Pinia 인증 스토어
├── middleware/
│   └── auth.ts                        # 인증 미들웨어
├── plugins/
│   └── api.client.ts                  # API 클라이언트 플러그인
└── pages/
    └── index.vue                      # 메인 페이지
```

## 🔧 Server API 설명

### `/api/auth/login` (POST)
사용자 로그인을 처리합니다.

**요청 본문:**
```json
{
  "email": "test@local",
  "password": "1234"
}
```

**응답:**
```json
{
  "accessToken": "base64_encoded_token",
  "refreshToken": "uuid_token",
  "tokenType": "Bearer",
  "expiresIn": 600000,
  "refreshExpiresIn": 1200000
}
```

### `/api/auth/register` (POST)
새 사용자를 등록합니다.

**요청 본문:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name" // optional
}
```

### `/api/auth/refresh-token` (POST)
Access Token을 갱신합니다.

**요청 본문:**
```json
{
  "refreshToken": "uuid_token"
}
```

### `/api/auth/logout` (POST)
사용자를 로그아웃합니다.

**요청 본문:**
```json
{
  "refreshToken": "uuid_token"
}
```

## 🔑 테스트 계정

- **이메일:** test@local
- **비밀번호:** 1234

## ✨ 최근 수정 사항

### 1. TypeScript 타입 에러 수정
- `@types/node` 패키지 추가
- `crypto` import를 `node:crypto`로 변경
- 타입 안전성 개선

### 2. Server API 메모리 공유 문제 해결
- `server/utils/db.ts` 파일 생성
- 모든 API 엔드포인트가 동일한 메모리 DB 공유
- 사용자 데이터와 refresh token이 올바르게 공유됨

### 3. Import 누락 수정
- `middleware/auth.ts`에 `useAuthStore` import 추가
- `plugins/api.client.ts`에 `useAuthStore` import 추가

### 4. Pinia Persist 플러그인 설정
- `nuxt.config.ts`에 `pinia-plugin-persistedstate/nuxt` 모듈 추가
- localStorage를 통한 인증 상태 지속성 구현

### 5. API 클라이언트 개선
- 명시적 타입 정의 추가
- Headers 타입 처리 개선
- 자동 토큰 갱신 로직 강화

## 🔒 인증 플로우

1. **로그인**: 사용자가 로그인하면 Access Token(10분)과 Refresh Token(20분) 발급
2. **토큰 저장**: Pinia store에 토큰 저장 및 localStorage에 지속
3. **API 요청**: 모든 API 요청에 자동으로 Authorization 헤더 추가
4. **토큰 갱신**: Access Token 만료 시 자동으로 Refresh Token을 사용하여 갱신
5. **로그아웃**: Refresh Token 삭제 및 인증 상태 초기화

## �️ 미들웨어 처리 과정 (middleware/auth.ts)

보호된 페이지 접근 시 미들웨어가 자동으로 실행되어 인증 상태를 검증합니다.

### 사용법
```typescript
// pages/protected.vue
definePageMeta({
  middleware: 'auth'  // 이 페이지는 인증 필요
})
```

### 처리 단계

#### 📌 0단계: 서버 사이드 체크 스킵
```
🖥️ 서버 렌더링 시 (SSR)
   └─> localStorage 접근 불가
   └─> 인증 체크 건너뛰기 (return)
   └─> 클라이언트에서 다시 체크
```

**이유**: 서버에는 localStorage가 없어 토큰을 확인할 수 없음

---

#### 📌 1단계: 로그인 여부 확인
```
isAuthenticated === false?
   ├─ YES → 홈(/)으로 리다이렉트
   └─ NO  → 2단계로 진행
```

**검증**: `auth.accessToken`이 존재하는지 확인

---

#### 📌 2단계: Refresh Token 만료 체크
```
Refresh Token 만료됨?
   ├─ YES → 강제 로그아웃
   │         └─> auth.logout()
   │         └─> 홈(/)으로 리다이렉트
   └─ NO  → 3단계로 진행
```

**검증**: `Date.now() > auth.refreshExpiresAt`

**중요**: Refresh Token이 만료되면 더 이상 갱신 불가능

---

#### 📌 3단계: Access Token 만료 체크 및 자동 갱신
```
Access Token 만료됨?
   ├─ NO  → 4단계로 진행 (페이지 접근 허용)
   └─ YES → 자동 갱신 시도
             ├─ 갱신 성공 → 4단계로 진행
             └─ 갱신 실패 → 로그아웃 후 홈으로 리다이렉트
```

**검증**: `Date.now() > auth.accessExpiresAt`

**자동 갱신 과정**:
```typescript
try {
  await auth.refresh()  // Refresh Token으로 새 Access Token 발급
  console.log('Token refresh successful')
  // → 새 Access Token 저장 완료
  // → 페이지 접근 허용
} catch (error) {
  // Refresh Token도 무효 (만료/삭제/invalid)
  await auth.logout()
  navigateTo('/')
}
```

---

#### 📌 4단계: 인증 통과
```
✅ 모든 체크 통과
   └─> 페이지 진입 허용
   └─> 정상적으로 보호된 컨텐츠 표시
```

---

### 전체 흐름도

```
페이지 접근 시도 (/protected)
        ↓
   [미들웨어 실행]
        ↓
   ┌─────────────┐
   │ 서버 사이드?   │
   └─────────────┘
     YES ↓    ↓ NO
    [SKIP]    ↓
              ↓
   ┌──────────────────┐
   │ 로그인 되어있나?     │ (1단계)
   └──────────────────┘
     NO ↓     ↓ YES
    [홈]      ↓
              ↓
   ┌───────────────────────┐
   │ Refresh Token 만료?    │ (2단계)
   └───────────────────────┘
     YES ↓    ↓ NO
  [로그아웃]  ↓
   [홈]       ↓
              ↓
   ┌──────────────────────┐
   │ Access Token 만료?    │ (3단계)
   └──────────────────────┘
     YES ↓    ↓ NO
     [갱신]    ↓
     시도      ↓
      ↓       ↓
     성공?     ↓
   YES|NO     ↓
    ↓  ↓      ↓
    ↓ [로그아웃]
    ↓ [홈]    ↓
    ↓         ↓
    └─────────┘
        ↓
   ✅ 페이지 접근 허용
```

### 주요 특징

#### 🔄 토큰 Rotation 전략
- Refresh Token 사용 시 새로운 Refresh Token 발급
- 기존 Refresh Token은 즉시 무효화 (보안)
- 토큰 재사용 공격 방지

#### ⚡ 무한 루프 방지
- `/api/auth/*` 경로는 인증 체크 제외
- 재시도 플래그로 중복 갱신 방지

#### 🎯 사용자 경험 최적화
- 토큰 만료를 사용자가 느끼지 못하도록 자동 처리
- 갱신 실패 시에만 로그인 화면으로 이동
- 로그인 상태가 localStorage에 저장되어 새로고침 후에도 유지

### 디버깅

콘솔에서 미들웨어 동작 확인:
```javascript
// 브라우저 콘솔에서 실행
[auth middleware] Checking authentication...
[auth middleware] isAuthenticated: true
[auth middleware] accessToken: exists
[auth middleware] Authentication passed
```

토큰 만료 시:
```javascript
[auth middleware] Access Token Expired, trying refresh...
[auth middleware] Token refresh successful
```

## �📝 주의사항

- 현재는 메모리 기반 DB를 사용하므로 서버 재시작 시 데이터가 초기화됩니다
- 실제 프로덕션 환경에서는 데이터베이스와 JWT 라이브러리 사용 권장
- 비밀번호는 bcrypt 등으로 해시하여 저장해야 합니다
- Access Token 유효기간: 10분 (테스트용)
- Refresh Token 유효기간: 20분 (테스트용)

## 🛠️ 기술 스택

- **Nuxt 3**: Vue.js 기반 프레임워크
- **Pinia**: 상태 관리
- **TypeScript**: 타입 안전성
- **pinia-plugin-persistedstate**: 상태 지속성

## 📚 추가 개선 사항 제안

1. 실제 데이터베이스 연결 (PostgreSQL, MongoDB 등)
2. JWT 라이브러리 사용 (jsonwebtoken)
3. 비밀번호 해싱 (bcrypt)
4. 환경 변수 설정 (.env)
5. API 에러 핸들링 강화
6. 단위 테스트 추가
7. CORS 설정
8. Rate limiting 추가
