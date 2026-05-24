<template>
  <div class="knob-wrapper">
    <div class="knob-ring">
      <div class="knob-ticks">
        <span v-for="i in 27" :key="i" class="knob-tick" :style="{ transform: `rotate(${(i - 1) * 10 - 135}deg)` }"></span>
      </div>
      <div
        class="knob-body"
        :style="{ transform: `rotate(${angle}deg)` }"
        @pointerdown="onPointerDown"
        @wheel.prevent="onWheel"
      >
        <div class="knob-cap">
          <div class="knob-grip"></div>
          <div class="knob-grip"></div>
          <div class="knob-grip"></div>
          <div class="knob-grip"></div>
          <div class="knob-grip"></div>
          <div class="knob-grip"></div>
          <div class="knob-grip"></div>
          <div class="knob-grip"></div>
        </div>
        <div class="knob-marker"></div>
      </div>
    </div>
    <div class="knob-controls">
      <button class="knob-step" @click="$emit('nudge', -0.1)">
        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M7 2L3 5l4 3" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
      </button>
      <span class="knob-label">TUNING</span>
      <button class="knob-step" @click="$emit('nudge', 0.1)">
        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M3 2l4 3-4 3" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({ angle: { type: Number, default: 0 } })
const emit = defineEmits(['rotate', 'nudge'])

const dragging = ref(false)
let startAngle = 0
let startPointerAngle = 0

function getPointerAngle(e, el) {
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  return Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI)
}

function onPointerDown(e) {
  dragging.value = true
  startAngle = props.angle
  startPointerAngle = getPointerAngle(e, e.currentTarget)
  e.currentTarget.setPointerCapture(e.pointerId)
  e.currentTarget.addEventListener('pointermove', onPointerMove)
  e.currentTarget.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e) {
  if (!dragging.value) return
  const current = getPointerAngle(e, e.currentTarget)
  let delta = current - startPointerAngle
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  const newAngle = Math.max(0, Math.min(270, startAngle + delta))
  const freqDelta = (newAngle - props.angle) / 270 * 21.0
  if (Math.abs(freqDelta) >= 0.05) {
    emit('rotate', freqDelta)
    startAngle = newAngle
    startPointerAngle = current
  }
}

function onPointerUp(e) {
  dragging.value = false
  e.currentTarget.removeEventListener('pointermove', onPointerMove)
  e.currentTarget.removeEventListener('pointerup', onPointerUp)
}

function onWheel(e) {
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  emit('nudge', delta)
}
</script>

<style scoped>
.knob-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.knob-ring {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 50%, #3b2814 60%, #2a1b0b 100%);
  box-shadow:
    0 0 0 3px #1a1008,
    0 0 0 5px #8b6838,
    0 0 0 7px #5a3d25,
    0 12px 36px rgba(0,0,0,0.7),
    inset 0 0 20px rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.knob-ticks {
  position: absolute;
  inset: 8px;
  border-radius: 50%;
}

.knob-tick {
  position: absolute;
  top: 0;
  left: 50%;
  width: 1px;
  height: 7px;
  margin-left: -0.5px;
  background: #8b6838;
  transform-origin: 50% 67px;
  border-radius: 1px;
}

.knob-tick:nth-child(3n+1) {
  height: 10px;
  background: #b8944a;
  width: 1.5px;
}

.knob-body {
  width: 115px;
  height: 115px;
  border-radius: 50%;
  background:
    radial-gradient(ellipse at 35% 30%, rgba(255,220,160,0.12), transparent 50%),
    radial-gradient(ellipse at 65% 70%, rgba(0,0,0,0.3), transparent 50%),
    conic-gradient(from 0deg, #6a5030, #8b6838, #5a4020, #7a5830, #6a5030);
  box-shadow:
    0 6px 20px rgba(0,0,0,0.6),
    inset 0 2px 4px rgba(255,220,160,0.1),
    inset 0 -2px 4px rgba(0,0,0,0.4);
  cursor: grab;
  position: relative;
  transition: transform 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  touch-action: none;
  user-select: none;
  z-index: 1;
}

.knob-body:active { cursor: grabbing; }

.knob-cap {
  position: absolute;
  inset: 18px;
  border-radius: 50%;
  background:
    radial-gradient(ellipse at 35% 30%, rgba(255,220,160,0.08), transparent 40%),
    radial-gradient(circle, #4a3520, #3b2814);
  box-shadow:
    inset 0 1px 3px rgba(255,220,160,0.06),
    inset 0 -1px 3px rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2.5px;
  padding: 22px;
  overflow: hidden;
}

.knob-grip {
  width: 2px;
  height: 100%;
  background: linear-gradient(180deg, rgba(255,220,160,0.06), rgba(0,0,0,0.2));
  border-radius: 1px;
}

.knob-marker {
  position: absolute;
  top: 8px;
  left: 50%;
  width: 3px;
  height: 16px;
  margin-left: -1.5px;
  background: linear-gradient(180deg, #e8a030, #c88020);
  border-radius: 2px;
  box-shadow: 0 0 6px rgba(232,160,48,0.6), 0 0 12px rgba(232,160,48,0.3);
}

.knob-controls {
  display: flex;
  align-items: center;
  gap: 14px;
}

.knob-step {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(180deg, #3b2814, #2a1b0b);
  border: 1px solid #5a3d25;
  color: #b8944a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.1s;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}

.knob-step:hover { border-color: #8b6838; color: #e8a030; }
.knob-step:active {
  transform: scale(0.92);
  box-shadow: 0 0 2px rgba(0,0,0,0.4);
}

.knob-label {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 3px;
  color: #8b7355;
  text-transform: uppercase;
}
</style>
