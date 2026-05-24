<script setup>
const props = defineProps({
  program: { type: Object, default: null },
  station: { type: Object, default: null },
  isPlaying: { type: Boolean, required: true },
  isBuffering: { type: Boolean, default: false },
  playbackStatus: { type: String, default: 'idle' },
  playbackError: { type: String, default: '' },
  progress: { type: Number, required: true },
  durationSec: { type: Number, required: true },
  progressLabel: { type: String, required: true },
  durationLabel: { type: String, required: true },
  nextTitle: { type: String, default: '暂无下一集' },
  feedback: { type: String, default: '' },
})

const emit = defineEmits(['toggle', 'seek', 'next', 'prev', 'retry'])

function handleSeek(event) {
  emit('seek', Number(event.target.value))
}
</script>

<template>
  <section
    class="player-bar"
    :class="{
      'is-playing': playbackStatus === 'playing',
      'is-loading': playbackStatus === 'loading',
      'is-buffering': playbackStatus === 'buffering',
      'is-error': playbackStatus === 'error',
      'is-paused': playbackStatus === 'paused',
    }"
  >
    <!-- Scanning light (loading state) -->
    <div v-if="playbackStatus === 'loading'" class="scan-light" />

    <!-- Buffering shimmer -->
    <div v-if="playbackStatus === 'buffering'" class="buffer-overlay">
      <div class="buffer-wave" />
      <div class="buffer-wave buffer-wave--2" />
    </div>

    <!-- Signal strength indicator (left edge) -->
    <div class="signal-edge">
      <span
        v-for="i in 4"
        :key="i"
        class="signal-bar"
        :class="{
          'signal-bar--active': playbackStatus === 'playing' && i <= 4,
          'signal-bar--loading': playbackStatus === 'loading' || playbackStatus === 'buffering',
        }"
      />
    </div>

    <div class="player-content">
      <!-- Left: track info -->
      <div class="player-info">
        <!-- ON AIR lamp -->
        <div
          class="onair-lamp"
          :class="{
            'onair-lamp--lit': playbackStatus === 'playing',
            'onair-lamp--error': playbackStatus === 'error',
          }"
        >
          <span class="lamp-dot" />
          <span class="lamp-text">
            {{
              playbackStatus === 'error'
                ? 'ERROR'
                : playbackStatus === 'loading'
                  ? 'TUNING'
                  : playbackStatus === 'buffering'
                    ? 'BUFFER'
                    : playbackStatus === 'playing'
                      ? 'ON AIR'
                      : 'OFF'
            }}
          </span>
        </div>

        <!-- Title -->
        <p class="track-title" :title="props.station ? props.station.name : props.program?.title">
          {{ props.station ? props.station.name : props.program?.title }}
        </p>

        <!-- Subtitle -->
        <p class="track-meta">
          <span v-if="playbackStatus === 'loading'" class="meta-loading">
            正在连接电台信号...
          </span>
          <span v-else-if="playbackStatus === 'buffering'" class="meta-buffering"> 缓冲中... </span>
          <span v-else-if="playbackStatus === 'error'" class="meta-error">
            {{ props.playbackError || '连接失败' }}
          </span>
          <span v-else-if="props.feedback" class="meta-feedback">
            {{ props.feedback }}
          </span>
          <span v-else-if="props.station">
            {{ props.station.country }} · {{ (props.station.codec || '').toUpperCase() }}
            {{ props.station.bitrate }}kbps
          </span>
          <span v-else> {{ props.program?.host }} · 下一集：{{ props.nextTitle }} </span>
        </p>
      </div>

      <!-- Center: controls -->
      <div class="player-controls">
        <button
          v-if="!props.station"
          type="button"
          class="ctrl-btn ctrl-btn--skip"
          @click="emit('prev')"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="ctrl-icon">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
          </svg>
        </button>

        <!-- Error: retry button -->
        <button
          v-if="playbackStatus === 'error'"
          type="button"
          class="ctrl-btn ctrl-btn--main ctrl-btn--error"
          @click="emit('retry')"
          aria-label="重试"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="ctrl-icon">
            <path
              d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
            />
          </svg>
        </button>

        <!-- Normal play/pause/loading -->
        <button
          v-else
          type="button"
          class="ctrl-btn ctrl-btn--main"
          :class="{
            'ctrl-btn--loading': playbackStatus === 'loading' || playbackStatus === 'buffering',
          }"
          @click="emit('toggle')"
          :aria-label="isPlaying ? '暂停' : '播放'"
        >
          <!-- Loading: rotating knob -->
          <svg
            v-if="playbackStatus === 'loading' || playbackStatus === 'buffering'"
            class="ctrl-knob"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="9" stroke-dasharray="42 14" />
            <line x1="12" y1="3" x2="12" y2="7" stroke-width="2.5" stroke-linecap="round" />
          </svg>
          <!-- Play icon -->
          <svg
            v-else-if="!isPlaying"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="ctrl-icon ctrl-icon--play"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          <!-- Pause icon -->
          <svg v-else viewBox="0 0 24 24" fill="currentColor" class="ctrl-icon">
            <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
          </svg>
        </button>

        <button
          v-if="!props.station"
          type="button"
          class="ctrl-btn ctrl-btn--skip"
          @click="emit('next')"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="ctrl-icon">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>

      <!-- Right: seek bar / live / spectrum -->
      <div class="player-right">
        <template v-if="!props.station">
          <span class="time-label">{{ props.progressLabel }}</span>
          <div class="seek-track">
            <div
              class="seek-fill"
              :style="{
                width: props.durationSec ? (props.progress / props.durationSec) * 100 + '%' : '0%',
              }"
            />
            <input
              class="seek-input"
              type="range"
              min="0"
              :max="props.durationSec"
              :value="props.progress"
              @input="handleSeek"
            />
          </div>
          <span class="time-label">{{ props.durationLabel }}</span>
        </template>
        <template v-else>
          <!-- Spectrum bars for live -->
          <div
            class="spectrum-bars"
            :class="{ 'spectrum-bars--active': playbackStatus === 'playing' }"
          >
            <span
              v-for="i in 10"
              :key="i"
              class="spectrum-bar"
              :style="{ animationDelay: `${i * 0.08}s` }"
            />
          </div>
          <div
            class="live-indicator"
            :class="{ 'live-indicator--error': playbackStatus === 'error' }"
          >
            <span class="live-pulse" />
            <span class="live-text">{{ playbackStatus === 'error' ? 'OFFLINE' : 'LIVE' }}</span>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  background: linear-gradient(to right, #1a1210, #241a14, #1a1210);
  border-top: 1px solid rgba(100, 70, 40, 0.4);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
  overflow: hidden;
}
.player-bar.is-playing {
  border-top-color: rgba(140, 90, 50, 0.6);
  box-shadow:
    0 -4px 20px rgba(0, 0, 0, 0.3),
    0 -1px 8px rgba(180, 130, 70, 0.15);
}
.player-bar.is-loading {
  border-top-color: rgba(212, 160, 80, 0.5);
}
.player-bar.is-error {
  border-top-color: rgba(196, 64, 48, 0.6);
  box-shadow:
    0 -4px 20px rgba(0, 0, 0, 0.3),
    0 -1px 6px rgba(196, 64, 48, 0.2);
}

/* --- Scanning light (loading) --- */
.scan-light {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.scan-light::before {
  content: '';
  position: absolute;
  top: 0;
  left: -30%;
  width: 30%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(212, 160, 80, 0.15),
    rgba(212, 160, 80, 0.25),
    rgba(212, 160, 80, 0.15),
    transparent
  );
  animation: scan-sweep 2s ease-in-out infinite;
}

/* --- Buffering overlay --- */
.buffer-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.buffer-wave {
  position: absolute;
  top: 0;
  left: -100%;
  width: 200%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(212, 160, 80, 0.06) 25%,
    rgba(212, 160, 80, 0.12) 50%,
    rgba(212, 160, 80, 0.06) 75%,
    transparent 100%
  );
  animation: buffer-sweep 2s linear infinite;
}
.buffer-wave--2 {
  animation-delay: -1s;
  opacity: 0.6;
}

/* --- Signal edge --- */
.signal-edge {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 20px;
}
.signal-bar {
  width: 3px;
  border-radius: 1px;
  background: rgba(80, 60, 40, 0.3);
  transition:
    background 0.3s,
    height 0.3s;
}
.signal-bar:nth-child(1) {
  height: 5px;
}
.signal-bar:nth-child(2) {
  height: 9px;
}
.signal-bar:nth-child(3) {
  height: 13px;
}
.signal-bar:nth-child(4) {
  height: 18px;
}
.signal-bar--active {
  background: rgba(120, 200, 120, 0.7);
  box-shadow: 0 0 3px rgba(120, 200, 120, 0.3);
}
.signal-bar--loading {
  animation: signal-pulse 1s ease-in-out infinite alternate;
  background: rgba(212, 160, 80, 0.5);
}
.signal-bar--loading:nth-child(1) {
  animation-delay: 0s;
}
.signal-bar--loading:nth-child(2) {
  animation-delay: 0.15s;
}
.signal-bar--loading:nth-child(3) {
  animation-delay: 0.3s;
}
.signal-bar--loading:nth-child(4) {
  animation-delay: 0.45s;
}

/* --- Content layout --- */
.player-content {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 12px 40px 12px 36px;
}
@media (max-width: 768px) {
  .player-content {
    flex-wrap: wrap;
    padding: 10px 16px 10px 36px;
    gap: 8px;
  }
  .signal-edge {
    left: 8px;
  }
}

/* --- Info section --- */
.player-info {
  min-width: 0;
  flex: 1;
}

/* ON AIR lamp */
.onair-lamp {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 4px;
  background: rgba(40, 30, 20, 0.7);
  border: 1px solid rgba(80, 60, 40, 0.3);
  transition:
    border-color 0.3s,
    background 0.3s;
}
.onair-lamp--lit {
  border-color: rgba(196, 64, 48, 0.5);
  background: rgba(40, 20, 15, 0.8);
}
.onair-lamp--error {
  border-color: rgba(196, 64, 48, 0.6);
}
.lamp-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(80, 60, 40, 0.4);
  transition:
    background 0.3s,
    box-shadow 0.3s;
}
.onair-lamp--lit .lamp-dot {
  background: rgba(196, 64, 48, 0.95);
  box-shadow:
    0 0 6px rgba(196, 64, 48, 0.6),
    0 0 12px rgba(196, 64, 48, 0.3);
  animation: lamp-blink 2s ease-in-out infinite;
}
.onair-lamp--error .lamp-dot {
  background: rgba(196, 64, 48, 0.8);
  animation: lamp-blink-fast 0.5s ease-in-out infinite;
}
.is-loading .onair-lamp .lamp-dot,
.is-buffering .onair-lamp .lamp-dot {
  background: rgba(212, 160, 80, 0.9);
  box-shadow: 0 0 6px rgba(212, 160, 80, 0.5);
  animation: lamp-blink 1s ease-in-out infinite;
}
.lamp-text {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: rgba(250, 244, 232, 0.4);
  transition: color 0.3s;
}
.onair-lamp--lit .lamp-text {
  color: rgba(196, 64, 48, 0.9);
}
.onair-lamp--error .lamp-text {
  color: rgba(196, 64, 48, 0.9);
}
.is-loading .onair-lamp .lamp-text,
.is-buffering .onair-lamp .lamp-text {
  color: rgba(212, 160, 80, 0.9);
}

.track-title {
  margin-top: 4px;
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(14px, 2vw, 18px);
  font-weight: 600;
  color: rgba(250, 244, 232, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-meta {
  margin-top: 2px;
  font-size: clamp(11px, 1.4vw, 13px);
  color: rgba(250, 244, 232, 0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meta-loading {
  color: rgba(212, 160, 80, 0.8);
  animation: text-shimmer 2s ease-in-out infinite;
}
.meta-buffering {
  color: rgba(212, 160, 80, 0.7);
  animation: text-shimmer 1.5s ease-in-out infinite;
}
.meta-error {
  font-weight: 500;
  color: rgba(196, 64, 48, 0.9);
}
.meta-feedback {
  font-weight: 500;
  color: rgba(120, 200, 120, 0.8);
}

/* --- Controls --- */
.player-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ctrl-btn {
  display: grid;
  place-content: center;
  border: none;
  cursor: pointer;
  transition:
    transform 0.12s ease,
    background 0.2s;
}
.ctrl-btn:active {
  transform: scale(0.9);
}

.ctrl-btn--skip {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(60, 40, 25, 0.5);
  border: 1px solid rgba(100, 70, 40, 0.3);
  color: rgba(250, 244, 232, 0.6);
}
.ctrl-btn--skip:hover {
  background: rgba(80, 55, 35, 0.6);
  color: rgba(250, 244, 232, 0.9);
}
@media (max-width: 640px) {
  .ctrl-btn--skip {
    display: none;
  }
}

.ctrl-btn--main {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3a2418, #241610);
  border: 2px solid rgba(180, 130, 70, 0.5);
  color: rgba(250, 244, 232, 0.9);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 200, 120, 0.08);
}
.ctrl-btn--main:hover {
  border-color: rgba(212, 160, 80, 0.7);
  transform: scale(1.05);
}
.ctrl-btn--loading {
  border-color: rgba(212, 160, 80, 0.6);
  animation: ring-glow 1.5s ease-in-out infinite;
}
.ctrl-btn--error {
  border-color: rgba(196, 64, 48, 0.6);
  background: linear-gradient(135deg, #3a1818, #241010);
}
.ctrl-btn--error:hover {
  border-color: rgba(196, 64, 48, 0.8);
}

.ctrl-icon {
  width: 18px;
  height: 18px;
}
.ctrl-icon--play {
  transform: translateX(1px);
}
.ctrl-knob {
  width: 22px;
  height: 22px;
  animation: knob-rotate 1.2s linear infinite;
}

/* --- Right: seek / live / spectrum --- */
.player-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
@media (max-width: 1024px) {
  .player-right {
    display: none;
  }
}

.time-label {
  font-size: 11px;
  font-family: 'Courier New', monospace;
  color: rgba(250, 244, 232, 0.4);
  width: 42px;
  text-align: center;
}

.seek-track {
  position: relative;
  width: 180px;
  height: 4px;
  background: rgba(60, 40, 25, 0.6);
  border-radius: 2px;
  overflow: hidden;
}
@media (min-width: 1280px) {
  .seek-track {
    width: 240px;
  }
}
.seek-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(to right, rgba(180, 130, 70, 0.7), rgba(212, 160, 80, 0.9));
  border-radius: 2px;
  transition: width 0.3s linear;
}
.seek-input {
  position: absolute;
  inset: -6px 0;
  width: 100%;
  height: 16px;
  opacity: 0;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

/* Spectrum bars */
.spectrum-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 24px;
  padding: 0 4px;
}
.spectrum-bar {
  width: 3px;
  height: 4px;
  border-radius: 1px;
  background: rgba(80, 60, 40, 0.4);
  transition:
    height 0.3s,
    background 0.3s;
}
.spectrum-bars--active .spectrum-bar {
  background: rgba(120, 200, 120, 0.7);
  box-shadow: 0 0 2px rgba(120, 200, 120, 0.3);
  animation: spectrum-bounce 0.8s ease-in-out infinite alternate;
}
.spectrum-bars--active .spectrum-bar:nth-child(1) {
  animation-delay: 0s;
}
.spectrum-bars--active .spectrum-bar:nth-child(2) {
  animation-delay: 0.1s;
}
.spectrum-bars--active .spectrum-bar:nth-child(3) {
  animation-delay: 0.2s;
}
.spectrum-bars--active .spectrum-bar:nth-child(4) {
  animation-delay: 0.05s;
}
.spectrum-bars--active .spectrum-bar:nth-child(5) {
  animation-delay: 0.15s;
}
.spectrum-bars--active .spectrum-bar:nth-child(6) {
  animation-delay: 0.25s;
}
.spectrum-bars--active .spectrum-bar:nth-child(7) {
  animation-delay: 0.08s;
}
.spectrum-bars--active .spectrum-bar:nth-child(8) {
  animation-delay: 0.18s;
}
.spectrum-bars--active .spectrum-bar:nth-child(9) {
  animation-delay: 0.12s;
}
.spectrum-bars--active .spectrum-bar:nth-child(10) {
  animation-delay: 0.22s;
}

/* Live indicator */
.live-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 6px;
  background: rgba(196, 64, 48, 0.1);
  border: 1px solid rgba(196, 64, 48, 0.3);
}
.live-indicator--error {
  background: rgba(196, 64, 48, 0.15);
  border-color: rgba(196, 64, 48, 0.5);
}
.live-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(196, 64, 48, 0.9);
  box-shadow: 0 0 6px rgba(196, 64, 48, 0.5);
  animation: live-blink 1.5s ease-in-out infinite;
}
.live-indicator--error .live-pulse {
  background: rgba(196, 64, 48, 0.5);
  box-shadow: none;
  animation: none;
}
.live-text {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: rgba(196, 64, 48, 0.8);
}

/* --- Animations --- */
@keyframes scan-sweep {
  0% {
    left: -30%;
  }
  100% {
    left: 100%;
  }
}
@keyframes buffer-sweep {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(50%);
  }
}
@keyframes signal-pulse {
  from {
    opacity: 0.3;
  }
  to {
    opacity: 1;
  }
}
@keyframes lamp-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
@keyframes lamp-blink-fast {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.2;
  }
}
@keyframes text-shimmer {
  0%,
  100% {
    opacity: 0.8;
  }
  50% {
    opacity: 0.4;
  }
}
@keyframes ring-glow {
  0%,
  100% {
    box-shadow:
      0 0 4px rgba(212, 160, 80, 0.2),
      0 2px 8px rgba(0, 0, 0, 0.3);
  }
  50% {
    box-shadow:
      0 0 12px rgba(212, 160, 80, 0.4),
      0 2px 8px rgba(0, 0, 0, 0.3);
  }
}
@keyframes knob-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes spectrum-bounce {
  0% {
    height: 4px;
  }
  25% {
    height: 14px;
  }
  50% {
    height: 8px;
  }
  75% {
    height: 20px;
  }
  100% {
    height: 6px;
  }
}
@keyframes live-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
</style>
