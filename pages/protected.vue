<template>
  <div class="page">
    <h1>보호된 페이지</h1>
    <p>로그인된 사용자만 볼 수 있습니다.</p>

    <ClientOnly>
      <div style="margin: 2rem 0; padding: 1rem; background: #f0f9ff; border-radius: 4px;">
        <p><strong>사용자:</strong> {{ auth.user?.email }}</p>
        <p><strong>Access Token:</strong></p>
        <code style="font-size: 11px; word-break: break-all; display: block; background: white; padding: 8px; border-radius: 4px;">
          {{ auth.accessToken }}
        </code>
      </div>
    </ClientOnly>

    <div>
      <NuxtLink to="/" style="display: inline-block; padding: 8px 16px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px;">
        홈으로 돌아가기
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: 'auth'
})

const auth = useAuthStore()
</script>

<style scoped>
.page {
  max-width: 600px;
  margin: 40px auto;
  padding: 24px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
</style>