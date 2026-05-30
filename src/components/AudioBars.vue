<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  active: { type: Boolean, default: false },
  analyserData: { type: Object, default: null },
})

const BAR_COUNT = 56
const bars = ref(Array.from({ length: BAR_COUNT }, () => 3))

let animId = null
let startTime = 0

function generateBar(index, time) {
  const speed = 0.003
  const phase = index * 0.18
  const wave1 = Math.sin(time * speed + phase) * 0.4
  const wave2 = Math.sin(time * speed * 1.7 + phase * 0.7) * 0.3
  const wave3 = Math.cos(time * speed * 0.5 + phase * 1.3) * 0.3
  const combined = (wave1 + wave2 + wave3 + 1) / 2
  return Math.max(3, combined * 85)
}

function generateIdleBar(index, time) {
  const speed = 0.0008
  const phase = index * 0.25
  const wave = Math.sin(time * speed + phase) * 0.15 + 0.15
  return Math.max(2, wave * 12)
}

function tick(timestamp) {
  if (!startTime) startTime = timestamp
  const elapsed = timestamp - startTime

  if (props.analyserData) {
    const data = props.analyserData
    for (let i = 0; i < BAR_COUNT; i++) {
      const dataIndex = Math.floor((i / BAR_COUNT) * data.length * 0.7)
      bars.value[i] = Math.max(3, (data[dataIndex] / 255) * 90)
    }
  } else if (props.active) {
    for (let i = 0; i < BAR_COUNT; i++) {
      bars.value[i] = generateBar(i, elapsed)
    }
  } else {
    for (let i = 0; i < BAR_COUNT; i++) {
      const target = generateIdleBar(i, elapsed)
      bars.value[i] += (target - bars.value[i]) * 0.05
    }
  }

  animId = requestAnimationFrame(tick)
}

onMounted(() => {
  animId = requestAnimationFrame(tick)
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
})
</script>

<template>
  <div class="audio-bars">
    <div
      v-for="(height, i) in bars"
      :key="i"
      class="audio-bar"
      :style="{ height: `${height}%` }"
    />
  </div>
</template>

<style scoped>
.audio-bars {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 1px;
  height: 22%;
  padding: 0 3%;
}

.audio-bar {
  flex: 1;
  max-width: 6px;
  min-height: 2px;
  border-radius: 2px 2px 0 0;
  background: linear-gradient(to top, #8b5e2b, #d4a050, #e8c070);
  opacity: 0.75;
  transition: height 0.08s ease-out;
}

.audio-bar:nth-child(3n) {
  background: linear-gradient(to top, #7a3a1a, #c05a30, #e07a40);
}

.audio-bar:nth-child(5n+2) {
  background: linear-gradient(to top, #6b4020, #b8843a, #d4a050);
}
</style>
