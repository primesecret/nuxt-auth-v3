<template>
  <div style="max-width: 600px; margin: 40px auto; padding: 24px; border: 1px solid #ddd; border-radius: 8px;">
    <h1>로그인 테스트</h1>

    <ClientOnly>
      <!-- 로그인 상태일 때 -->
      <div v-if="auth.isAuthenticated" style="margin-top: 20px;">
        <div style="padding: 15px; background: #f0f9ff; border-radius: 4px; margin-bottom: 20px;">
          <h3>✅ 로그인 상태</h3>
          <p><strong>사용자:</strong> {{ auth.user?.email }}</p>
          <p><strong>Access Token:</strong></p>
          <code style="font-size: 11px; word-break: break-all; display: block; background: white; padding: 8px; border-radius: 4px; margin-top: 5px;">
            {{ auth.accessToken?.substring(0, 80) }}...
          </code>
          <p style="margin-top: 10px;"><strong>Refresh Token:</strong> {{ auth.refreshToken }}</p>
        </div>

        <div style="display: flex; gap: 10px;">
          <NuxtLink 
            to="/protected" 
            style="padding: 10px 20px; background: #10b981; color: white; text-decoration: none; border-radius: 4px; display: inline-block;"
          >
            🔒 보호된 페이지로 이동
          </NuxtLink>
          <button 
            @click="handleLogout"
            style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            로그아웃
          </button>
        </div>
      </div>

      <!-- 로그인 안 되어 있을 때 -->
      <div v-else>
        <!-- 로그인/회원가입 탭 -->
        <div style="display: flex; gap: 0; margin-top: 20px; border-bottom: 2px solid #e5e7eb;">
          <button 
            @click="isRegisterMode = false"
            :style="{
              flex: '1',
              padding: '12px 20px',
              background: !isRegisterMode ? '#0066cc' : '#f3f4f6',
              color: !isRegisterMode ? 'white' : '#374151',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              transition: 'all 0.2s'
            }"
            @mouseover="(e) => { if (isRegisterMode) e.target.style.background = '#e5e7eb' }"
            @mouseout="(e) => { if (isRegisterMode) e.target.style.background = '#f3f4f6' }"
          >
            🔑 로그인
          </button>
          <button 
            @click="isRegisterMode = true"
            :style="{
              flex: '1',
              padding: '12px 20px',
              background: isRegisterMode ? '#10b981' : '#f3f4f6',
              color: isRegisterMode ? 'white' : '#374151',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              transition: 'all 0.2s'
            }"
            @mouseover="(e) => { if (!isRegisterMode) e.target.style.background = '#e5e7eb' }"
            @mouseout="(e) => { if (!isRegisterMode) e.target.style.background = '#f3f4f6' }"
          >
            ✨ 회원가입
          </button>
        </div>

        <!-- 로그인 폼 -->
        <form v-if="!isRegisterMode" @submit.prevent="handleLogin" style="margin-top: 20px;">
          <div style="margin-bottom: 10px;">
            <label>이메일</label><br/>
            <input 
              v-model="email" 
              type="email" 
              style="width: 100%; padding: 8px; box-sizing: border-box;"
            />
          </div>
          <div style="margin-bottom: 10px;">
            <label>비밀번호</label><br/>
            <input 
              v-model="password" 
              type="password" 
              style="width: 100%; padding: 8px; box-sizing: border-box;"
            />
          </div>
          <button 
            type="submit"
            style="padding: 10px 20px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            로그인
          </button>

          <p style="margin-top: 10px; color: gray;">
            테스트 계정: <b>test@local / 1234</b>
          </p>
        </form>

        <!-- 회원가입 폼 -->
        <form v-else @submit.prevent="handleRegister" style="margin-top: 20px;">
          <div style="margin-bottom: 10px;">
            <label>이메일 *</label><br/>
            <input 
              v-model="registerEmail" 
              type="email" 
              required
              placeholder="example@email.com"
              style="width: 100%; padding: 8px; box-sizing: border-box;"
            />
          </div>
          <div style="margin-bottom: 10px;">
            <label>이름</label><br/>
            <input 
              v-model="registerName" 
              type="text" 
              placeholder="홍길동 (선택사항)"
              style="width: 100%; padding: 8px; box-sizing: border-box;"
            />
          </div>
          <div style="margin-bottom: 10px;">
            <label>비밀번호 *</label><br/>
            <input 
              v-model="registerPassword" 
              type="password" 
              required
              minlength="4"
              placeholder="최소 4자"
              style="width: 100%; padding: 8px; box-sizing: border-box;"
            />
          </div>
          <div style="margin-bottom: 10px;">
            <label>비밀번호 확인 *</label><br/>
            <input 
              v-model="registerPasswordConfirm" 
              type="password" 
              required
              minlength="4"
              placeholder="비밀번호 재입력"
              style="width: 100%; padding: 8px; box-sizing: border-box;"
            />
          </div>
          <button 
            type="submit"
            style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            회원가입
          </button>
        </form>

        <!-- Step 2: 응답 표시 -->
        <div v-if="response" style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 4px;">
          <h3>서버 응답:</h3>
          <pre style="overflow-x: auto; background: white; padding: 10px; border-radius: 4px;">{{ response }}</pre>
        </div>

        <!-- Step 3: 에러 표시 -->
        <div v-if="error" style="margin-top: 20px; padding: 15px; background: #fee; border: 1px solid red; border-radius: 4px; color: red;">
          <strong>에러:</strong> {{ error }}
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()

// 로그인/회원가입 모드 전환
const isRegisterMode = ref(false)

// 로그인 폼 데이터
const email = ref('test@local')
const password = ref('1234')

// 회원가입 폼 데이터
const registerEmail = ref('')
const registerName = ref('')
const registerPassword = ref('')
const registerPasswordConfirm = ref('')

// 공통 상태
const response = ref('')
const error = ref('')

// 로그인 핸들러
const handleLogin = async () => {
  try {
    error.value = ''
    response.value = ''
    
    console.log('로그인 시도:', email.value)
    
    await auth.login(email.value, password.value)
    
    response.value = JSON.stringify({
      message: '로그인 성공!',
      accessToken: auth.accessToken?.substring(0, 50) + '...',
      refreshToken: auth.refreshToken,
      user: auth.user,
      isAuthenticated: auth.isAuthenticated
    }, null, 2)
    
    console.log('로그인 성공')
    
  } catch (e: any) {
    console.error('로그인 에러:', e)
    error.value = e.message || '로그인 실패'
    response.value = JSON.stringify(e.data || e, null, 2)
  }
}

// 회원가입 핸들러
const handleRegister = async () => {
  try {
    error.value = ''
    response.value = ''

    // 비밀번호 확인
    if (registerPassword.value !== registerPasswordConfirm.value) {
      error.value = '비밀번호가 일치하지 않습니다'
      return
    }

    console.log('회원가입 시도:', registerEmail.value)
    
    await auth.register(
      registerEmail.value, 
      registerPassword.value,
      registerName.value || undefined
    )
    
    response.value = JSON.stringify({
      message: '회원가입 성공! 자동 로그인되었습니다.',
      user: auth.user,
      isAuthenticated: auth.isAuthenticated
    }, null, 2)
    
    console.log('회원가입 성공')

    // 폼 초기화
    registerEmail.value = ''
    registerName.value = ''
    registerPassword.value = ''
    registerPasswordConfirm.value = ''
    
  } catch (e: any) {
    console.error('회원가입 에러:', e)
    error.value = e.data?.message || e.message || '회원가입 실패'
    response.value = JSON.stringify(e.data || e, null, 2)
  }
}

// 로그아웃 핸들러
const handleLogout = async () => {
  try {
    await auth.logout()
    response.value = ''
    error.value = ''
    console.log('로그아웃 성공')
  } catch (e: any) {
    console.error('로그아웃 에러:', e)
  }
}
</script>