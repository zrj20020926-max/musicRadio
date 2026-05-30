<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { RainEffect } from './effects/rain'
import { SnowEffect } from './effects/snow'
import { FogEffect } from './effects/fog'
import { FireflyEffect } from './effects/firefly'

const props = defineProps({
  effect: { type: String, default: 'none' },
  isPlaying: { type: Boolean, default: false },
})

const canvasRef = ref(null)
let ctx = null
let currentEffect = null
let rafId = null
let lastTime = 0
let dpr = 1

const EFFECT_MAP = {
  rain: RainEffect,
  snow: SnowEffect,
  fog: FogEffect,
  firefly: FireflyEffect,
}

function createEffect(id) {
  if (!ctx || !canvasRef.value) return null
  const Ctor = EFFECT_MAP[id]
  if (!Ctor) return null
  return new Ctor(canvasRef.value, ctx, { dpr })
}

function destroyEffect() {
  if (currentEffect) {
    currentEffect.destroy()
    currentEffect = null
  }
}

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const parent = canvas.parentElement
  if (!parent) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = parent.clientWidth
  const h = parent.clientHeight
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  if (currentEffect) {
    currentEffect.resize(w, h)
  }
}

function loop(time) {
  if (!currentEffect) return
  const dt = lastTime ? Math.min(time - lastTime, 50) : 16.67
  lastTime = time
  currentEffect.tick(dt)
  rafId = requestAnimationFrame(loop)
}

function startLoop() {
  stopLoop()
  lastTime = 0
  rafId = requestAnimationFrame(loop)
}

function stopLoop() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function handleVisibility() {
  if (document.hidden) {
    stopLoop()
  } else if (currentEffect) {
    startLoop()
  }
}

let resizeObserver = null

onMounted(async () => {
  await nextTick()
  const canvas = canvasRef.value
  if (!canvas) return
  ctx = canvas.getContext('2d')
  if (!ctx) return

  resizeCanvas()

  resizeObserver = new ResizeObserver(() => resizeCanvas())
  resizeObserver.observe(canvas.parentElement)

  document.addEventListener('visibilitychange', handleVisibility)

  if (props.effect !== 'none') {
    currentEffect = createEffect(props.effect)
    if (currentEffect) startLoop()
  }
})

onUnmounted(() => {
  stopLoop()
  destroyEffect()
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  document.removeEventListener('visibilitychange', handleVisibility)
})

watch(() => props.effect, (newEffect, oldEffect) => {
  if (newEffect === oldEffect) return
  stopLoop()
  destroyEffect()
  if (ctx) {
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  }
  if (newEffect !== 'none') {
    currentEffect = createEffect(newEffect)
    if (currentEffect) startLoop()
  }
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="atmosphere-canvas"
    :class="{
      'atmosphere-canvas--firefly': effect === 'firefly',
      'atmosphere-canvas--rain': effect === 'rain',
    }"
  />
</template>

<style scoped>
.atmosphere-canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.6s ease;
}
.atmosphere-canvas--firefly {
  mix-blend-mode: screen;
}
.atmosphere-canvas--rain {
  backdrop-filter: blur(0.6px) saturate(0.92) brightness(0.95);
}
</style>
