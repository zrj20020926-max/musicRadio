<template>
  <div class="vu-panel">
    <div class="vu-display">
      <div class="vu-bars">
        <div
          v-for="i in barCount"
          :key="i"
          class="vu-bar-col"
        >
          <div
            class="vu-bar"
            :class="barClass(bars[i - 1])"
            :style="{ height: bars[i - 1] + '%' }"
          ></div>
          <div
            class="vu-peak"
            :style="{ bottom: peaks[i - 1] + '%' }"
          ></div>
        </div>
      </div>
      <div class="vu-overlay"></div>
    </div>
    <div class="vu-label-row">
      <span class="vu-label">L</span>
      <span class="vu-label vu-label--center">SIGNAL</span>
      <span class="vu-label">R</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  mode: { type: String, default: 'idle' },
})

const barCount = 24
const bars = ref(Array(barCount).fill(3))
const peaks = ref(Array(barCount).fill(3))
let raf = null
let t = 0

function barClass(h) {
  if (h > 80) return 'vu-bar--hot'
  if (h > 55) return 'vu-bar--warm'
  return ''
}

function animate() {
  t += 0.04
  const newBars = []
  const newPeaks = [...peaks.value]

  for (let i = 0; i < barCount; i++) {
    let h = 3
    if (props.mode === 'scanning') {
      h = 3 + Math.random() * 55 * (0.5 + 0.5 * Math.sin(t * 3 + i * 0.5))
    } else if (props.mode === 'playing') {
      const base = Math.sin(t * 1.8 + i * 0.25) * 25
      const mid = Math.sin(t * 3.5 + i * 0.6) * 18
      const high = Math.sin(t * 7 + i * 1.2) * 8
      const center = Math.abs(i - barCount / 2) / (barCount / 2)
      h = 30 + base + mid + high + (1 - center) * 15 + Math.random() * 5
    } else if (props.mode === 'paused') {
      h = Math.max(3, (bars.value[i] || 3) * 0.94)
    }
    h = Math.max(3, Math.min(98, h))
    newBars.push(h)

    if (h > newPeaks[i]) {
      newPeaks[i] = h
    } else {
      newPeaks[i] = Math.max(3, newPeaks[i] - 0.6)
    }
  }

  bars.value = newBars
  peaks.value = newPeaks
  raf = requestAnimationFrame(animate)
}

onMounted(() => { raf = requestAnimationFrame(animate) })
onUnmounted(() => { if (raf) cancelAnimationFrame(raf) })
</script>

<style scoped>
.vu-panel {
  width: 100%;
}

.vu-display {
  position: relative;
  height: 64px;
  background: linear-gradient(180deg, #0d0800, #1a0f00, #0d0800);
  border: 1px solid #5a3d25;
  border-radius: 5px;
  padding: 5px 6px;
  overflow: hidden;
  box-shadow:
    inset 0 2px 8px rgba(0,0,0,0.9),
    0 1px 0 rgba(255,220,160,0.04);
}

.vu-bars {
  display: flex;
  align-items: flex-end;
  gap: 1.5px;
  height: 100%;
  position: relative;
  z-index: 1;
}

.vu-bar-col {
  flex: 1;
  height: 100%;
  position: relative;
  display: flex;
  align-items: flex-end;
}

.vu-bar {
  width: 100%;
  min-height: 2px;
  background: linear-gradient(180deg, #e8a030, #c88020, #8b6030);
  border-radius: 1px 1px 0 0;
  transition: height 0.06s linear;
  box-shadow: 0 0 2px rgba(232,160,48,0.3);
}

.vu-bar--warm {
  background: linear-gradient(180deg, #e87030, #cc5020, #8b3020);
  box-shadow: 0 0 3px rgba(232,112,48,0.4);
}

.vu-bar--hot {
  background: linear-gradient(180deg, #cc3333, #aa2222, #882020);
  box-shadow: 0 0 4px rgba(204,51,51,0.5);
}

.vu-peak {
  position: absolute;
  left: 0;
  right: 0;
  height: 1.5px;
  background: #e8a030;
  border-radius: 1px;
  opacity: 0.7;
  transition: bottom 0.06s linear;
  box-shadow: 0 0 3px rgba(232,160,48,0.5);
}

.vu-overlay {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(0,0,0,0.12) 3px,
      rgba(0,0,0,0.12) 4px
    );
  pointer-events: none;
  border-radius: 5px;
}

.vu-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 4px 0;
}

.vu-label {
  font-family: 'Courier New', monospace;
  font-size: 7px;
  color: #6a4a2a;
  letter-spacing: 1px;
}

.vu-label--center {
  letter-spacing: 2px;
  color: #8b7355;
}
</style>
