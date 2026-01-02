<template>
  <div class="page">
    <ClientOnly>
      <WatermarkOverlay
        :text="watermarkText"
        :gap-x="280"
        :gap-y="130"
        :font-size="13"
        :opacity="0.12"
        :padding-x="56"
        :max-tiles="420"
      />
    </ClientOnly>

    <header class="header">
      <h1>보안 화면 데모 (워터마크 + 마스킹)</h1>
      <p class="sub">
        “잠깐 보기”는 항상 <b>1개 필드만</b> 활성화됩니다.
        다른 필드를 누르면 기존 공개는 즉시 종료되고 새 필드만 공개됩니다.
      </p>
    </header>

    <section class="card">
      <h2>사용자 정보</h2>
      <div class="kv">
        <div><b>User</b>: {{ userId }}</div>
        <div><b>Session</b>: {{ sessionId }}</div>
        <div><b>Now</b>: {{ nowKst }}</div>
        <div><b>Active Reveal</b>: {{ activeKey ?? "-" }}</div>
      </div>
    </section>

    <section class="card">
      <h2>민감정보</h2>

      <MaskedField
        label="고객명"
        :value="customerName"
        field-key="customer_name"
        :active-key="activeKey"
        :reveal-seconds="3"
        :allow-copy="false"
        audit-key="customer_name"
        @activate="activate"
        @ended="onEnded"
      />

      <MaskedField
        label="휴대폰"
        :value="phone"
        field-key="phone"
        :active-key="activeKey"
        :reveal-seconds="3"
        :allow-copy="false"
        audit-key="phone"
        @activate="activate"
        @ended="onEnded"
      />

      <MaskedField
        label="계좌번호"
        :value="account"
        field-key="account"
        :active-key="activeKey"
        :reveal-seconds="3"
        :allow-copy="false"
        audit-key="account"
        @activate="activate"
        @ended="onEnded"
      />

      <MaskedField
        label="API Key"
        :value="apiKey"
        field-key="api_key"
        :active-key="activeKey"
        :reveal-seconds="2"
        :allow-copy="false"
        audit-key="api_key"
        @activate="activate"
        @ended="onEnded"
      />

      <p class="hint">※ 다른 필드 “잠깐 보기”를 누르면 기존 공개 필드는 즉시 마스킹됩니다.</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import WatermarkOverlay from "~/components/WatermarkOverlay.vue";
import MaskedField from "~/components/MaskedField.vue";

const userId = "kimtaeyeong";
const sessionId = Math.random().toString(36).slice(2, 10);

const customerName = "홍길동";
const phone = "010-1234-5678";
const account = "123-456-789012";
const apiKey = "demo_key_1234567890abcdefghijklmnopqrstuvwxyz";

// ✅ 현재 공개중인 필드 키 (항상 1개만)
const activeKey = ref<string | null>(null);

// ✅ 어떤 필드든 누를 수 있음: 누르면 그 필드가 active가 되고, 나머지는 watch로 즉시 숨김됨
function activate(key: string) {
  activeKey.value = key;
}

// ✅ 타이머 종료된 필드가 현재 active면 해제
function onEnded(key: string) {
  if (activeKey.value === key) activeKey.value = null;
}

// 시간 표시
const now = ref(new Date());
let tick: any = null;

onMounted(() => {
  tick = setInterval(() => (now.value = new Date()), 1000);
});
onBeforeUnmount(() => {
  if (tick) clearInterval(tick);
});

const nowKst = computed(() => {
  const d = now.value;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
});

const watermarkText = computed(() => `${userId} | ${nowKst.value} | sid:${sessionId}`);
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 28px 18px 60px;
  max-width: 920px;
  margin: 0 auto;
}

.header h1 {
  margin: 0 0 8px;
  font-size: 22px;
}

.sub {
  margin: 0 0 18px;
  opacity: 0.8;
}

.card {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 16px;
  padding: 16px;
  margin: 14px 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
}

.card h2 {
  margin: 0 0 10px;
  font-size: 16px;
}

.kv {
  display: grid;
  gap: 6px;
  opacity: 0.9;
}

.hint {
  margin-top: 10px;
  font-size: 13px;
  opacity: 0.75;
}
</style>
