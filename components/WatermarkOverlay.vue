<template>
  <!-- ✅ 클라이언트에서만 렌더 -->
  <div v-if="isClient" class="wm-root" aria-hidden="true">
    <div class="wm-layer" :style="layerStyle">
      <div v-for="i in tileCount" :key="i" class="wm-tile">
        <span class="wm-text">{{ text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const isClient = import.meta.client; // ✅ Nuxt/Vite 환경에서 SSR 구분

const props = withDefaults(
  defineProps<{
    text: string;
    angle?: number;
    opacity?: number;
    fontSize?: number;
    fontFamily?: string;
    gapX?: number;
    gapY?: number;
    paddingX?: number;
    maxTiles?: number;
  }>(),
  {
    angle: -22,
    opacity: 0.12,
    fontSize: 13,
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    gapX: 260,
    gapY: 120,
    paddingX: 48,
    maxTiles: 420,
  }
);

const viewportW = ref(1200);
const viewportH = ref(800);

function updateViewport() {
  if (!isClient) return;
  viewportW.value = window.innerWidth;
  viewportH.value = window.innerHeight;
}

onMounted(() => {
  updateViewport();
  window.addEventListener("resize", updateViewport, { passive: true });
});
onBeforeUnmount(() => {
  if (!isClient) return;
  window.removeEventListener("resize", updateViewport);
});

// ---- 텍스트 폭 측정 (클라이언트에서만) ----
const measuredTextWidth = ref(300);

function measureTextWidth() {
  if (!isClient) return;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.font = `${props.fontSize}px ${props.fontFamily}`;
  const metrics = ctx.measureText(props.text || "");
  measuredTextWidth.value = Math.ceil(metrics.width);
}

watch(
  () => [props.text, props.fontSize, props.fontFamily],
  () => measureTextWidth(),
  { immediate: true }
);

// 텍스트 길이에 따라 gapX 자동 확장 (겹침 방지)
const gapXEff = computed(() => Math.max(props.gapX, measuredTextWidth.value + props.paddingX));
const gapYEff = computed(() => props.gapY);

const cols = computed(() => (isClient ? Math.max(4, Math.ceil(viewportW.value / gapXEff.value)) : 0));
const rows = computed(() => (isClient ? Math.max(4, Math.ceil(viewportH.value / gapYEff.value)) : 0));

const tileCount = computed(() => {
  if (!isClient) return 0;
  return Math.min(cols.value * rows.value, props.maxTiles);
});

const layerStyle = computed(() => ({
  transform: `rotate(${props.angle}deg)`,
  opacity: String(props.opacity),
  fontSize: `${props.fontSize}px`,
  fontFamily: props.fontFamily,
  gridTemplateColumns: `repeat(${cols.value}, ${gapXEff.value}px)`,
  gridAutoRows: `${gapYEff.value}px`,
}));
</script>

<style scoped>
.wm-root {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

.wm-layer {
  position: absolute;
  left: -30%;
  top: -30%;
  width: 160%;
  height: 160%;
  display: grid;
  align-items: center;
  justify-items: center;
  user-select: none;
  white-space: nowrap;
  text-rendering: geometricPrecision;
}

.wm-tile {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden; /* ✅ 옆 칸 침범 방지 */
}

.wm-text {
  display: inline-block;
  white-space: nowrap;
  line-height: 1.1;
  letter-spacing: 0.2px;
  transform: translateZ(0);
}
</style>
