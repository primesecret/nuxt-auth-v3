<template>
  <div class="row">
    <div class="label">{{ label }}</div>

    <div class="value">
      <span class="mono">{{ displayValue }}</span>

      <button
        class="btn"
        type="button"
        @click="requestReveal"
        :disabled="revealing && isActive"
      >
        {{ (revealing && isActive) ? `${remain}s` : "잠깐 보기" }}
      </button>

      <button
        class="btn ghost"
        type="button"
        @click="copyIfAllowed"
        :disabled="!allowCopy || !(revealing && isActive)"
      >
        복사
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

const emit = defineEmits<{
  (e: "activate", key: string): void;     // ✅ 이 필드를 공개 대상으로 만들고 싶다
  (e: "ended", key: string): void;        // ✅ 내 타이머가 끝나서 공개가 종료됐다
}>();

const props = withDefaults(
  defineProps<{
    label: string;
    value: string;

    // ✅ 부모가 관리하는 "현재 공개중인 필드"
    fieldKey: string;
    activeKey: string | null;

    maskChar?: string;
    revealSeconds?: number;
    allowCopy?: boolean;
    auditKey?: string;
  }>(),
  {
    maskChar: "•",
    revealSeconds: 3,
    allowCopy: false,
    auditKey: "",
  }
);

const isActive = computed(() => props.activeKey === props.fieldKey);

const revealing = ref(false);
const remain = ref(props.revealSeconds);
let timer: any = null;

const masked = computed(() => {
  const v = props.value ?? "";
  if (v.length <= 4) return props.maskChar.repeat(v.length || 4);
  return `${v.slice(0, 2)}${props.maskChar.repeat(Math.max(4, v.length - 4))}${v.slice(-2)}`;
});

// ✅ "내가 활성(active)일 때만" 원문 표시
const displayValue = computed(() => (revealing.value && isActive.value ? props.value : masked.value));

function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function stopReveal() {
  clearTimer();
  revealing.value = false;
  remain.value = props.revealSeconds;
}

// ✅ 다른 필드가 활성화되면(=activeKey가 바뀌면) 나는 즉시 숨김 처리
watch(
  () => props.activeKey,
  (ak) => {
    if (!ak || ak !== props.fieldKey) {
      stopReveal();
    }
  }
);

async function audit(action: "reveal" | "copy") {
  try {
    await $fetch("/api/audit/log", {
      method: "POST",
      body: {
        action,
        key: props.auditKey || props.label,
        at: new Date().toISOString(),
      },
    });
  } catch {
    // 실패해도 UX 유지
  }
}

function startRevealTimer() {
  stopReveal(); // 안전하게 초기화
  revealing.value = true;
  remain.value = props.revealSeconds;

  clearTimer();
  timer = setInterval(() => {
    remain.value -= 1;
    if (remain.value <= 0) {
      stopReveal();
      emit("ended", props.fieldKey);
    }
  }, 1000);
}

async function requestReveal() {
  // ✅ 부모에게 "나로 활성화" 요청 (부모가 activeKey를 내 key로 바꿔줌)
  emit("activate", props.fieldKey);

  // ✅ nextTick 없이도 watch로 stopReveal 되지 않으며,
  // 부모가 즉시 activeKey 갱신하면 아래 조건이 true가 됩니다.
  // (비동기 상황 대비해서 0ms로 한 번 미룸)
  setTimeout(async () => {
    if (!isActive.value) return; // 이미 다른 걸로 바뀌었으면 시작 안 함
    await audit("reveal");
    startRevealTimer();
  }, 0);
}

async function copyIfAllowed() {
  if (!props.allowCopy) return;
  if (!(revealing.value && isActive.value)) return;
  try {
    await navigator.clipboard.writeText(props.value);
    await audit("copy");
  } catch {
    // 환경에 따라 실패 가능
  }
}

onBeforeUnmount(() => stopReveal());
</script>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.label {
  font-weight: 600;
  opacity: 0.85;
}

.value {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn {
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: white;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ghost {
  background: transparent;
}
</style>
