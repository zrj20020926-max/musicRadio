<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AudioBars from './AudioBars.vue'
import VinylDisc from './VinylDisc.vue'
import AtmosphereCanvas from './immersive/AtmosphereCanvas.vue'
import AtmosphereSelector from './immersive/AtmosphereSelector.vue'
import { useAtmosphere } from '../composables/useAtmosphere'
import { fetchImmersiveTextLine, fetchImmersiveTextLines } from '../services/immersiveText'

const { activeEffect } = useAtmosphere()

const props = defineProps({
  program: { type: Object, default: null },
  station: { type: Object, default: null },
  isPlaying: { type: Boolean, required: true },
  playbackStatus: { type: String, default: 'idle' },
  progressLabel: { type: String, default: '00:00' },
  durationLabel: { type: String, default: '00:00' },
  volume: { type: Number, default: 0.75 },
})

const emit = defineEmits(['close', 'toggle', 'volume', 'next', 'prev'])

const pageIndex = ref(0)
const textLines = ref([])
const textStatus = ref('loading')

let pageTimer = null
let textPollTimer = null
let requestToken = 0
const seenTextSet = new Set()

const isLive = computed(() => Boolean(props.station))
const title = computed(() => props.station?.name || props.program?.title || '午夜电台')
const host = computed(() => props.station?.country || props.program?.host || 'Retro Radio')
const frequency = computed(
  () => props.program?.cover?.frequency || props.station?.codec?.toUpperCase() || 'FM',
)
const coverImage = computed(() => props.program?.cover?.image || props.station?.favicon || '')
const stationMeta = computed(() => {
  if (!props.station) return props.program?.category || '音乐节目'
  return [
    props.station.country,
    props.station.codec?.toUpperCase(),
    props.station.bitrate && `${props.station.bitrate}kbps`,
  ]
    .filter(Boolean)
    .join(' / ')
})
const statusText = computed(() => {
  if (props.playbackStatus === 'loading') return 'TUNING'
  if (props.playbackStatus === 'buffering') return 'BUFFER'
  if (props.playbackStatus === 'error') return 'OFFLINE'
  return props.isPlaying ? 'ON AIR' : 'PAUSED'
})
const textSourceLabel = computed(() => (textStatus.value === 'ready' ? 'TEXT STREAM' : 'LOADING TEXT'))

const activeLines = computed(() => {
  if (textLines.value.length) return textLines.value
  return ['正在获取新的文字。']
})
const prevLine = computed(
  () => activeLines.value[(pageIndex.value - 1 + activeLines.value.length) % activeLines.value.length],
)
const currentLine = computed(() => activeLines.value[pageIndex.value % activeLines.value.length])
const nextLine = computed(() => activeLines.value[(pageIndex.value + 1) % activeLines.value.length])
const currentChars = computed(() => Array.from(currentLine.value))

const backgroundStyle = computed(() => {
  if (coverImage.value) {
    return { backgroundImage: `url("${coverImage.value}")` }
  }
  return {
    backgroundImage:
      'radial-gradient(circle at 22% 20%, rgba(190, 92, 48, 0.34), transparent 34%), radial-gradient(circle at 76% 28%, rgba(210, 164, 84, 0.2), transparent 30%), radial-gradient(circle at 50% 82%, rgba(66, 122, 96, 0.16), transparent 32%), linear-gradient(135deg, #25140f 0%, #11100c 48%, #251d15 100%)',
  }
})

function appendTextLines(lines) {
  const incoming = lines
    .map((line) => String(line || '').replace(/\s+/g, ' ').trim())
    .filter((line) => line.length >= 4 && !seenTextSet.has(line))

  if (!incoming.length) return false
  incoming.forEach((line) => seenTextSet.add(line))
  textLines.value = [...textLines.value, ...incoming].slice(-80)
  return true
}

function advancePage() {
  pageIndex.value = (pageIndex.value + 1) % activeLines.value.length
}

function startPageTimer() {
  clearInterval(pageTimer)
  pageTimer = setInterval(advancePage, 5200)
}

async function loadInitialTextLines() {
  const token = ++requestToken
  textStatus.value = 'loading'
  try {
    const lines = await fetchImmersiveTextLines({ batchSize: 14 })
    if (token !== requestToken) return
    appendTextLines(lines)
    textStatus.value = textLines.value.length ? 'ready' : 'loading'
  } catch {
    if (token === requestToken) textStatus.value = 'loading'
  }
}

async function pollTextLine() {
  const token = requestToken
  try {
    const line = await fetchImmersiveTextLine()
    if (token !== requestToken) return
    if (appendTextLines([line])) textStatus.value = 'ready'
  } catch {
    if (!textLines.value.length) textStatus.value = 'loading'
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape') emit('close')
}

function handleVolume(event) {
  emit('volume', Number(event.target.value))
}

onMounted(() => {
  loadInitialTextLines()
  startPageTimer()
  textPollTimer = setInterval(pollTextLine, 4200)
  window.addEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  requestToken += 1
  clearInterval(pageTimer)
  clearInterval(textPollTimer)
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <section
    class="immersive-player"
    :class="{ 'is-playing': isPlaying, 'is-live': isLive }"
    role="dialog"
    aria-modal="true"
  >
    <div class="immersive-bg" :style="backgroundStyle" />
    <div class="immersive-bg immersive-bg--drift" :style="backgroundStyle" />
    <div class="light-field" />
    <AtmosphereCanvas :effect="activeEffect" :is-playing="isPlaying" />
    <div class="grain-layer" />
    <div class="vignette-layer" />

    <header class="immersive-top">
      <div class="signal-pill" :class="{ 'signal-pill--active': isPlaying }">
        <span class="signal-dot" />
        <span>{{ statusText }}</span>
      </div>
      <AtmosphereSelector v-model="activeEffect" />
      <button type="button" class="close-btn" aria-label="关闭沉浸模式" @click="emit('close')">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6 6 18"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </header>

    <main class="immersive-main">
      <section class="visual-field" aria-label="播放视觉">
        <div class="film-frame film-frame--left" />
        <div class="film-frame film-frame--right" />
        <div class="vinyl-stage">
          <VinylDisc :spinning="isPlaying" />
          <div class="frequency-badge">{{ frequency }}</div>
        </div>
        <AudioBars :active="isPlaying" class="immersive-bars" />
      </section>

      <section class="track-panel">
        <p class="eyebrow">{{ isLive ? 'LIVE BROADCAST' : 'NOW PLAYING' }}</p>
        <h1>{{ title }}</h1>
        <p class="track-meta">{{ stationMeta }}<span v-if="host"> / {{ host }}</span></p>
      </section>

      <section class="text-stage" aria-live="polite">
        <div class="text-status" :class="{ 'text-status--ready': textStatus === 'ready' }">
          <span />
          {{ textSourceLabel }}
        </div>
        <Transition name="page-flip" mode="out-in">
          <div :key="pageIndex" class="text-page">
            <p class="text-line text-line--ghost">{{ prevLine }}</p>
            <p class="text-line text-line--current">
              <span
                v-for="(char, index) in currentChars"
                :key="`${pageIndex}-${index}`"
                class="char"
                :style="{ animationDelay: `${index * 28}ms` }"
              >
                {{ char }}
              </span>
            </p>
            <p class="text-line text-line--ghost">{{ nextLine }}</p>
          </div>
        </Transition>
      </section>
    </main>

    <footer class="immersive-controls">
      <button v-if="!isLive" type="button" class="round-btn" aria-label="上一首" @click="emit('prev')">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
        </svg>
      </button>
      <div v-else class="live-chip">
        <span />
        LIVE
      </div>

      <button
        type="button"
        class="round-btn round-btn--main"
        :aria-label="isPlaying ? '暂停' : '播放'"
        @click="emit('toggle')"
      >
        <svg v-if="!isPlaying" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
        </svg>
      </button>

      <button v-if="!isLive" type="button" class="round-btn" aria-label="下一首" @click="emit('next')">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
        </svg>
      </button>
      <div v-else class="time-chip">{{ progressLabel }}</div>
      <div v-if="!isLive" class="time-chip">{{ progressLabel }} / {{ durationLabel }}</div>
      <div class="volume-chip" :title="`Volume ${Math.round(volume * 100)}%`">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            v-if="volume <= 0"
            d="M5 9v6h4l5 4V5L9 9H5zm12.7 3 2.1-2.1-1.4-1.4-2.1 2.1-2.1-2.1-1.4 1.4 2.1 2.1-2.1 2.1 1.4 1.4 2.1-2.1 2.1 2.1 1.4-1.4-2.1-2.1z"
          />
          <path
            v-else-if="volume < 0.5"
            d="M5 9v6h4l5 4V5L9 9H5zm12.2 3a3.4 3.4 0 0 0-1.7-3v6a3.4 3.4 0 0 0 1.7-3z"
          />
          <path
            v-else
            d="M5 9v6h4l5 4V5L9 9H5zm10.5-.1v6.2A3.5 3.5 0 0 0 17 12a3.5 3.5 0 0 0-1.5-3.1zm0-3.5v2.1A6 6 0 0 1 19.5 12a6 6 0 0 1-4 5.7v2.1A8 8 0 0 0 21.5 12a8 8 0 0 0-6-6.6z"
          />
        </svg>
        <div class="volume-slider">
          <div class="volume-slider-fill" :style="{ width: `${volume * 100}%` }" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="volume"
            aria-label="Volume"
            @input="handleVolume"
          />
        </div>
        <span>{{ Math.round(volume * 100) }}</span>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.immersive-player {
  position: fixed;
  inset: 0;
  z-index: 90;
  overflow: hidden;
  color: rgba(250, 244, 232, 0.92);
  background: #100b08;
}

.immersive-bg {
  position: absolute;
  inset: -8%;
  background-position: center;
  background-size: cover;
  filter: blur(34px) saturate(0.9) brightness(0.45);
  transform: scale(1.08);
  opacity: 0.82;
}
.immersive-bg--drift {
  filter: blur(18px) saturate(1.05) brightness(0.35);
  mix-blend-mode: screen;
  opacity: 0.24;
  animation: bg-drift 18s ease-in-out infinite alternate;
}
.is-playing .immersive-bg--drift {
  animation-duration: 11s;
  opacity: 0.34;
}

.light-field,
.grain-layer,
.vignette-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.light-field {
  background:
    linear-gradient(
      110deg,
      rgba(255, 166, 76, 0.14),
      transparent 32%,
      rgba(58, 126, 96, 0.1) 72%,
      transparent
    ),
    radial-gradient(circle at 50% 16%, rgba(255, 210, 130, 0.16), transparent 42%);
  animation: light-breathe 7s ease-in-out infinite;
}
.grain-layer {
  opacity: 0.11;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.62'/%3E%3C/svg%3E");
  animation: grain-shift 0.7s steps(2) infinite;
}
.vignette-layer {
  background:
    radial-gradient(circle at center, transparent 36%, rgba(0, 0, 0, 0.34) 68%, rgba(0, 0, 0, 0.78) 100%),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.32), transparent 24%, rgba(0, 0, 0, 0.48));
}

.immersive-top {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: max(22px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) 0 max(24px, env(safe-area-inset-left));
}
.signal-pill,
.live-chip,
.time-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid rgba(212, 160, 80, 0.34);
  border-radius: 999px;
  background: rgba(22, 14, 10, 0.56);
  color: rgba(250, 244, 232, 0.72);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  backdrop-filter: blur(14px);
}
.signal-dot,
.live-chip span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(196, 64, 48, 0.9);
  box-shadow: 0 0 10px rgba(196, 64, 48, 0.6);
}
.signal-pill--active .signal-dot,
.is-live .live-chip span {
  animation: live-pulse 1.4s ease-in-out infinite;
}
.close-btn,
.round-btn {
  display: grid;
  place-content: center;
  border: 1px solid rgba(212, 160, 80, 0.38);
  border-radius: 50%;
  background: rgba(24, 15, 10, 0.62);
  color: rgba(250, 244, 232, 0.78);
  cursor: pointer;
  backdrop-filter: blur(16px);
  transition:
    transform 0.16s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
}
.close-btn {
  width: 42px;
  height: 42px;
}
.close-btn svg,
.round-btn svg {
  width: 20px;
  height: 20px;
}
.close-btn:hover,
.round-btn:hover {
  border-color: rgba(232, 190, 116, 0.76);
  background: rgba(54, 34, 20, 0.82);
  color: rgba(255, 250, 238, 0.98);
  transform: translateY(-1px);
}

.immersive-main {
  position: relative;
  z-index: 2;
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: clamp(8px, 1.5vh, 20px);
  padding: 0 clamp(20px, 5vw, 72px) 90px;
  overflow: hidden;
}
.visual-field {
  position: relative;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  height: clamp(120px, 28vh, 260px);
  width: 100%;
}
.vinyl-stage {
  position: relative;
  opacity: 0.88;
  max-height: 100%;
}
.vinyl-stage :deep(.vinyl-container) {
  width: clamp(100px, 18vw, 220px);
  height: clamp(100px, 18vw, 220px);
}
.is-playing .vinyl-stage {
  animation: stage-float 5.6s ease-in-out infinite;
}
.frequency-badge {
  position: absolute;
  right: -40px;
  bottom: 20%;
  padding: 5px 9px;
  border: 1px solid rgba(212, 160, 80, 0.34);
  border-radius: 5px;
  background: rgba(18, 12, 8, 0.68);
  color: rgba(232, 190, 116, 0.9);
  font-size: 11px;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.08em;
  white-space: nowrap;
}
.immersive-bars {
  position: absolute;
  left: 14%;
  right: 14%;
  bottom: 0;
  height: 48px;
  opacity: 0.36;
}
.film-frame {
  position: absolute;
  top: 8%;
  bottom: 4%;
  width: 32px;
  opacity: 0.16;
  background: repeating-linear-gradient(to bottom, rgba(250, 244, 232, 0.7) 0 8px, transparent 8px 22px);
}
.film-frame--left {
  left: 3%;
}
.film-frame--right {
  right: 3%;
}

.track-panel {
  flex: 0 0 auto;
  text-align: center;
  text-shadow: 0 4px 22px rgba(0, 0, 0, 0.65);
  padding: clamp(4px, 1.5vh, 16px) 0;
}
.eyebrow {
  margin-bottom: 10px;
  color: rgba(232, 190, 116, 0.78);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.22em;
}
h1 {
  max-width: min(960px, 92vw);
  margin: 0 auto;
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(28px, 6vw, 72px);
  line-height: 1.06;
  letter-spacing: 0;
}
.track-meta {
  margin-top: 12px;
  color: rgba(250, 244, 232, 0.58);
  font-size: clamp(13px, 1.6vw, 16px);
}

.text-stage {
  flex: 0 1 auto;
  min-height: 0;
  display: grid;
  place-items: center;
  padding-top: clamp(8px, 1.5vh, 24px);
  text-align: center;
  width: 100%;
}
.text-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 12px;
  padding: 5px 11px;
  border: 1px solid rgba(212, 160, 80, 0.24);
  border-radius: 999px;
  background: rgba(18, 12, 8, 0.38);
  color: rgba(250, 244, 232, 0.5);
  font-size: 11px;
  letter-spacing: 0.08em;
  backdrop-filter: blur(12px);
}
.text-status span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(212, 160, 80, 0.55);
}
.text-status--ready {
  color: rgba(250, 244, 232, 0.76);
}
.text-status--ready span {
  background: rgba(120, 200, 120, 0.8);
  box-shadow: 0 0 10px rgba(120, 200, 120, 0.38);
  animation: live-pulse 1.4s ease-in-out infinite;
}
.text-page {
  display: grid;
  justify-items: center;
  gap: 12px;
  width: min(980px, 92vw);
  margin: 0 auto;
  perspective: 900px;
}
.text-line {
  width: 100%;
  margin: 0;
  text-align: center;
  text-shadow:
    0 2px 12px rgba(0, 0, 0, 0.85),
    0 0 28px rgba(212, 160, 80, 0.18);
}
.text-line--current {
  max-width: min(940px, 88vw);
  margin-right: auto;
  margin-left: auto;
  color: rgba(255, 250, 238, 0.98);
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(22px, 4.2vw, 48px);
  font-weight: 600;
  line-height: 1.32;
  text-wrap: balance;
}
.text-line--ghost {
  max-width: min(820px, 84vw);
  margin-right: auto;
  margin-left: auto;
  color: rgba(250, 244, 232, 0.34);
  font-size: clamp(13px, 2vw, 18px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.char {
  display: inline-block;
  min-width: 0.08em;
  opacity: 0;
  transform: translateY(18px) rotateX(32deg);
  animation: char-rise 0.62s cubic-bezier(0.2, 0.9, 0.25, 1) forwards;
}
.page-flip-enter-active,
.page-flip-leave-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s ease,
    filter 0.5s ease;
}
.page-flip-enter-from {
  opacity: 0;
  transform: translateY(26px) rotateX(-18deg) scale(0.985);
  filter: blur(7px);
}
.page-flip-leave-to {
  opacity: 0;
  transform: translateY(-26px) rotateX(18deg) scale(1.015);
  filter: blur(7px);
}

.immersive-controls {
  position: absolute;
  left: 50%;
  bottom: max(24px, env(safe-area-inset-bottom));
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  transform: translateX(-50%);
}
.round-btn {
  width: 46px;
  height: 46px;
}
.round-btn--main {
  width: 62px;
  height: 62px;
  border-width: 2px;
  background: linear-gradient(135deg, rgba(82, 47, 25, 0.9), rgba(33, 21, 14, 0.92));
  color: rgba(255, 248, 232, 0.96);
  box-shadow:
    0 12px 34px rgba(0, 0, 0, 0.34),
    0 0 24px rgba(212, 160, 80, 0.16);
}
.round-btn--main svg {
  width: 24px;
  height: 24px;
}
.time-chip {
  white-space: nowrap;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.volume-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid rgba(212, 160, 80, 0.34);
  border-radius: 999px;
  background: rgba(22, 14, 10, 0.56);
  color: rgba(250, 244, 232, 0.68);
  backdrop-filter: blur(14px);
}
.volume-chip svg {
  width: 18px;
  height: 18px;
  color: rgba(232, 190, 116, 0.82);
}
.volume-chip span {
  width: 26px;
  font-size: 11px;
  font-family: 'Courier New', monospace;
  text-align: right;
}
.volume-slider {
  position: relative;
  width: 94px;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(84, 56, 32, 0.7);
}
.volume-slider-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: linear-gradient(to right, rgba(120, 200, 120, 0.65), rgba(232, 190, 116, 0.95));
}
.volume-slider input {
  position: absolute;
  inset: -8px 0;
  width: 100%;
  height: 20px;
  opacity: 0;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

@media (max-width: 720px) {
  .immersive-top {
    padding-top: max(14px, env(safe-area-inset-top));
  }
  .immersive-main {
    height: calc(100vh - 60px);
    padding: 0 18px 80px;
  }
  .visual-field {
    height: clamp(90px, 22vh, 180px);
  }
  .film-frame {
    display: none;
  }
  .immersive-bars {
    left: 4%;
    right: 4%;
    height: 40px;
  }
  .text-line--current {
    max-width: 92vw;
    font-size: clamp(18px, 4vw, 28px);
  }
  .immersive-controls {
    width: calc(100vw - 28px);
    gap: 10px;
  }
  .time-chip {
    display: none;
  }
  .volume-chip {
    flex: 1 1 auto;
    min-width: 0;
    padding: 0 10px;
  }
  .volume-slider {
    flex: 1 1 auto;
    width: auto;
    min-width: 56px;
  }
}

@media (max-height: 700px) {
  .immersive-main {
    padding-bottom: 72px;
    gap: 4px;
  }
  .visual-field {
    height: clamp(80px, 20vh, 150px);
  }
  .vinyl-stage :deep(.vinyl-container) {
    width: clamp(80px, 14vw, 140px);
    height: clamp(80px, 14vw, 140px);
  }
  h1 {
    font-size: clamp(20px, 4vw, 36px);
  }
  .text-line--current {
    font-size: clamp(16px, 3vw, 24px);
  }
  .text-line--ghost {
    display: none;
  }
  .eyebrow {
    margin-bottom: 4px;
    font-size: 10px;
  }
  .track-meta {
    margin-top: 4px;
  }
  .track-panel {
    padding: 2px 0;
  }
  .immersive-bars {
    display: none;
  }
  .frequency-badge {
    display: none;
  }
}

@keyframes bg-drift {
  from {
    transform: scale(1.08) translate3d(-1.5%, -1%, 0);
  }
  to {
    transform: scale(1.16) translate3d(1.5%, 1.2%, 0);
  }
}
@keyframes light-breathe {
  0%, 100% {
    opacity: 0.82;
  }
  50% {
    opacity: 0.54;
  }
}
@keyframes grain-shift {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(-2%, 2%);
  }
}
@keyframes stage-float {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-1vh) scale(1.02);
  }
}
@keyframes live-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.36;
  }
}
@keyframes char-rise {
  0% {
    opacity: 0;
    transform: translateY(18px) rotateX(32deg);
    text-shadow: 0 0 0 rgba(232, 190, 116, 0);
  }
  55% {
    opacity: 1;
    text-shadow: 0 0 20px rgba(232, 190, 116, 0.35);
  }
  100% {
    opacity: 1;
    transform: translateY(0) rotateX(0);
  }
}
</style>
