<script setup>
import { computed } from 'vue'
import VinylDisc from './VinylDisc.vue'
import AudioBars from './AudioBars.vue'
import OnAirSign from './OnAirSign.vue'

const props = defineProps({
  isPlaying: { type: Boolean, default: false },
  hasStation: { type: Boolean, default: false },
  programTitle: { type: String, default: '' },
  host: { type: String, default: '' },
  listeners: { type: Number, default: 0 },
  analyserData: { type: Object, default: null },
})

const emit = defineEmits(['toggle'])

const statusText = computed(() => {
  if (!props.hasStation) return 'STANDBY'
  return props.isPlaying ? 'ON AIR' : 'PAUSED'
})
const formattedListeners = computed(() => {
  if (!props.listeners) return ''
  return new Intl.NumberFormat('zh-CN').format(props.listeners)
})
</script>

<template>
  <div class="live-visual-stage" :class="{ 'is-playing': isPlaying }">
    <!-- Background layers -->
    <div class="stage-bg" />
    <div class="stage-noise" />
    <div class="stage-light stage-light--left" />
    <div class="stage-light stage-light--right" />
    <div class="stage-light stage-light--center" />

    <!-- Decorative elements -->
    <div class="stage-decor stage-decor--tape">
      <div class="tape-reel" />
      <div class="tape-reel" />
    </div>
    <div class="stage-decor stage-decor--freq">
      <div v-for="i in 14" :key="i" class="freq-tick" />
    </div>
    <div class="stage-decor stage-decor--poster" />

    <!-- Main content area -->
    <div class="stage-content">
      <!-- Left: visual area with vinyl + ON AIR -->
      <div class="stage-visual">
        <OnAirSign :active="isPlaying" class="visual-onair" />

        <div class="visual-center">
          <!-- Sound wave rings -->
          <div class="wave-rings wave-rings--left">
            <div v-for="i in 3" :key="i" class="wave-ring" :style="{ animationDelay: `${i * 0.7}s` }" />
          </div>

          <VinylDisc :spinning="isPlaying" class="visual-vinyl" />

          <div class="wave-rings wave-rings--right">
            <div v-for="i in 3" :key="i" class="wave-ring" :style="{ animationDelay: `${i * 0.7}s` }" />
          </div>
        </div>

        <!-- Info HUD below vinyl -->
        <div class="visual-hud">
          <template v-if="hasStation">
            <p class="hud-title">{{ programTitle }}</p>
            <p class="hud-meta">
              <span v-if="host">{{ host }}</span>
              <span v-if="host && formattedListeners"> · </span>
              <span v-if="formattedListeners">{{ formattedListeners }} 人收听</span>
            </p>
          </template>
          <p v-else class="hud-idle">Pick a station to start listening</p>
          <div class="hud-status-row">
            <span class="hud-status" :class="{ 'hud-status--live': isPlaying }">{{ statusText }}</span>
            <button v-if="hasStation" type="button" class="hud-play-btn" @click="emit('toggle')" :aria-label="isPlaying ? '暂停' : '播放'">
              <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="hud-play-icon">
                <path d="M8 5v14l11-7z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="hud-play-icon">
                <path d="M7 5h4v14H7zm6 0h4v14h-4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Right: integrated station panel (slot) -->
      <div class="stage-panel">
        <slot />
      </div>
    </div>

    <!-- Spectrum bars across bottom -->
    <AudioBars :active="isPlaying" :analyser-data="analyserData" class="stage-bars" />
  </div>
</template>

<style scoped>
.live-visual-stage {
  position: relative;
  width: 100%;
  height: 520px;
  border-radius: 2rem;
  overflow: hidden;
  border: 1px solid rgba(122, 80, 47, 0.7);
  box-shadow: 0 10px 30px rgba(60, 40, 20, 0.15), inset 0 1px 0 rgba(255, 200, 120, 0.04);
}

@media (min-width: 1280px) {
  .live-visual-stage {
    height: 560px;
  }
}

/* Background */
.stage-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, #2a1810 0%, #1a0e08 35%, #0d0704 100%);
  z-index: 0;
}

.stage-noise {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  background-size: 150px 150px;
  z-index: 1;
}

/* Light sources */
.stage-light {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  z-index: 1;
}
.stage-light--left {
  width: 50%;
  height: 80%;
  top: -10%;
  left: -15%;
  background: radial-gradient(circle, rgba(255, 160, 60, 0.1) 0%, transparent 65%);
}
.stage-light--right {
  width: 40%;
  height: 60%;
  bottom: -10%;
  right: -10%;
  background: radial-gradient(circle, rgba(255, 130, 50, 0.06) 0%, transparent 65%);
}
.stage-light--center {
  width: 40%;
  height: 50%;
  top: 5%;
  left: 15%;
  background: radial-gradient(circle, rgba(255, 180, 80, 0.08) 0%, transparent 60%);
  transition: opacity 1s ease;
}
.is-playing .stage-light--center {
  animation: breathe 4s ease-in-out infinite;
}

/* Decorative elements */
.stage-decor--tape {
  position: absolute;
  top: 20px;
  left: 24px;
  display: flex;
  gap: 8px;
  z-index: 2;
  opacity: 0.2;
}
.tape-reel {
  width: 22px;
  height: 22px;
  border: 2px solid #7a5030;
  border-radius: 50%;
}
.stage-decor--freq {
  position: absolute;
  top: 24px;
  left: 90px;
  display: flex;
  gap: 3px;
  align-items: flex-end;
  z-index: 2;
  opacity: 0.18;
}
.freq-tick {
  width: 1.5px;
  background: #8a6040;
  border-radius: 1px;
}
.freq-tick:nth-child(odd) { height: 8px; }
.freq-tick:nth-child(even) { height: 14px; }
.freq-tick:nth-child(3n) { height: 18px; }

.stage-decor--poster {
  position: absolute;
  top: 16px;
  right: 20px;
  width: 40px;
  height: 52px;
  border: 1px solid rgba(122, 80, 47, 0.2);
  border-radius: 3px;
  background: linear-gradient(135deg, rgba(60, 35, 18, 0.4), rgba(40, 24, 12, 0.3));
  z-index: 2;
  opacity: 0.35;
}

/* Main content layout */
.stage-content {
  position: relative;
  z-index: 5;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  height: 100%;
  padding-bottom: 60px;
}

@media (max-width: 1000px) {
  .stage-content {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 100%;
  }
}

/* Left visual area */
.stage-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px 20px;
  gap: 16px;
}

.visual-onair {
  flex-shrink: 0;
}

.visual-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
}

.visual-vinyl {
  flex-shrink: 0;
}

/* Sound wave rings */
.wave-rings {
  position: relative;
  width: 50px;
  height: 50px;
  flex-shrink: 0;
}
.wave-ring {
  position: absolute;
  width: 50px;
  height: 50px;
  border: 1px solid rgba(212, 160, 80, 0.2);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.3);
  opacity: 0;
}
.is-playing .wave-ring {
  animation: wave-expand 2.4s ease-out infinite;
}

/* Info HUD */
.visual-hud {
  text-align: center;
  max-width: 280px;
}
.hud-title {
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(15px, 2vw, 20px);
  color: rgba(250, 244, 232, 0.88);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hud-meta {
  font-size: clamp(11px, 1.2vw, 14px);
  color: rgba(250, 244, 232, 0.45);
  margin-top: 4px;
}
.hud-idle {
  font-size: clamp(13px, 1.4vw, 16px);
  color: rgba(250, 244, 232, 0.35);
  letter-spacing: 0.04em;
}
.hud-status-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 10px;
}
.hud-status {
  font-size: 11px;
  color: rgba(250, 244, 232, 0.35);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.hud-status--live {
  color: rgba(196, 80, 50, 0.9);
}
.hud-play-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1.5px solid rgba(212, 160, 80, 0.5);
  background: rgba(30, 18, 10, 0.7);
  color: rgba(250, 244, 232, 0.85);
  display: grid;
  place-content: center;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.2s ease;
}
.hud-play-btn:hover {
  transform: scale(1.1);
  background: rgba(50, 30, 18, 0.9);
}
.hud-play-btn:active {
  transform: scale(0.92);
}
.hud-play-icon {
  width: 16px;
  height: 16px;
}

/* Right panel area */
.stage-panel {
  position: relative;
  z-index: 10;
  padding: 24px 24px 24px 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

@media (max-width: 1000px) {
  .stage-panel {
    padding: 0 20px 20px;
  }
}

/* Spectrum bars */
.stage-bars {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 50%;
  z-index: 4;
  pointer-events: none;
}

@media (max-width: 1000px) {
  .stage-bars {
    right: 0;
  }
}

/* Animations */
@keyframes breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

@keyframes wave-expand {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0.5;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.8);
    opacity: 0;
  }
}
</style>
