<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRadioStore } from '../stores/radio'
import {
  fetchRadioStations,
  loadCachedStations,
  saveCurrentStation,
} from '../services/radioBrowser'
import { useFrequencyDial } from '../composables/useFrequencyDial'
import FmDialScale from '../components/FmDialScale.vue'
import TuningKnob from '../components/TuningKnob.vue'
import SpectrumMeter from '../components/SpectrumMeter.vue'
import PresetButtons from '../components/PresetButtons.vue'

const radioStore = useRadioStore()
const { playbackStatus, favoriteFmStations, currentStationId } = storeToRefs(radioStore)

const {
  currentFrequency,
  lockedStation,
  isLocked,
  isScanning,
  knobAngle,
  stationsWithFreq,
  nudgeFrequency,
  tuneToStation,
  setFrequency,
  setStations,
} = useFrequencyDial()

const loading = ref(false)
const lockFlash = ref(false)
const lastUpdate = ref(null)
const stationCount = ref(0)
const showFreqInput = ref(false)
const freqInputValue = ref('')

const isPlaying = computed(() => playbackStatus.value === 'playing')
const isBuffering = computed(
  () => playbackStatus.value === 'loading' || playbackStatus.value === 'buffering',
)
const isError = computed(() => playbackStatus.value === 'error')

const statusKey = computed(() => {
  if (loading.value) return 'loadingStations'
  if (isScanning.value) return 'tuning'
  if (isError.value) return 'error'
  if (isBuffering.value) return 'loadingStream'
  if (isPlaying.value) return 'playing'
  if (isLocked.value) return 'locked'
  return 'idle'
})

const onAirState = computed(() => {
  if (isPlaying.value) return 'on'
  if (isBuffering.value || isScanning.value) return 'dim'
  return 'off'
})

const spectrumMode = computed(() => {
  if (isPlaying.value) return 'playing'
  if (isScanning.value) return 'scanning'
  if (playbackStatus.value === 'paused') return 'paused'
  return 'idle'
})

const presetStations = computed(() => stationsWithFreq.value.slice(0, 10))

const isFavorited = computed(() => {
  if (!lockedStation.value) return false
  return favoriteFmStations.value.has(lockedStation.value.stationuuid)
})

const currentIndex = computed(() => {
  if (!lockedStation.value) return -1
  return stationsWithFreq.value.findIndex((s) => s.stationuuid === lockedStation.value.stationuuid)
})
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(
  () => currentIndex.value < stationsWithFreq.value.length - 1 && currentIndex.value >= 0,
)

const screenLine1 = computed(() => {
  if (loading.value) return '正在接收电台信号...'
  if (isScanning.value) return 'SIGNAL SEARCHING...'
  if (isError.value) return '信号不稳定'
  if (isBuffering.value) return '正在连接直播流...'
  if (isPlaying.value) return lockedStation.value?.name || 'BROADCASTING'
  if (isLocked.value) return lockedStation.value?.name || 'STATION LOCKED'
  return '未锁定频道'
})

const screenLine2 = computed(() => {
  if (!lockedStation.value) return ''
  const s = lockedStation.value
  const parts = []
  if (s.country) parts.push(s.country)
  if (s.language) parts.push(s.language)
  if (s.codec) parts.push(s.codec.toUpperCase())
  if (s.bitrate) parts.push(s.bitrate + 'kbps')
  return parts.join(' · ')
})

watch(lockedStation, (station, prev) => {
  if (station && (!prev || prev.stationuuid !== station.stationuuid)) {
    saveCurrentStation(station)
    const alreadyActive = currentStationId.value === (station.stationuuid || station.name)
    if (!alreadyActive) {
      radioStore.playStation(station)
    }
    lockFlash.value = true
    setTimeout(() => {
      lockFlash.value = false
    }, 600)
  } else if (!station && prev) {
    radioStore.stopStation()
  }
})

function onKnobRotate(delta) {
  nudgeFrequency(delta)
}
function onKnobNudge(delta) {
  nudgeFrequency(delta)
}

function togglePlay() {
  if (!lockedStation.value) return
  if (isPlaying.value || isBuffering.value) {
    radioStore.stopStation()
  } else {
    radioStore.playStation(lockedStation.value)
  }
}

function prevStation() {
  if (!hasPrev.value) return
  tuneToStation(stationsWithFreq.value[currentIndex.value - 1])
}

function nextStation() {
  if (!hasNext.value) return
  tuneToStation(stationsWithFreq.value[currentIndex.value + 1])
}

function toggleFav() {
  if (!lockedStation.value) return
  radioStore.toggleFavoriteFmStation(lockedStation.value.stationuuid)
}

function onPresetSelect(station) {
  tuneToStation(station)
}

function openFreqInput() {
  freqInputValue.value = currentFrequency.value.toFixed(1)
  showFreqInput.value = true
}

function confirmFreqInput() {
  const val = parseFloat(freqInputValue.value)
  if (!isNaN(val) && val >= 87.0 && val <= 108.0) {
    setFrequency(val)
  }
  showFreqInput.value = false
}

function cancelFreqInput() {
  showFreqInput.value = false
}

async function refreshStations() {
  loading.value = true
  try {
    const stations = await fetchRadioStations()
    setStations(stations)
    stationCount.value = stations.length
    lastUpdate.value = new Date().toLocaleTimeString()
  } catch (e) {
    console.error('[radio] refresh failed', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const hasCachedStations = Boolean(localStorage.getItem('retro_radio_real_stations'))
  const cached = loadCachedStations()
  if (cached.length) {
    setStations(cached)
    stationCount.value = cached.length
    lastUpdate.value = '缓存'
  }
  if (!hasCachedStations || !cached.length) {
    await refreshStations()
  }
  if (currentStationId.value && stationsWithFreq.value.length) {
    const saved = stationsWithFreq.value.find((s) => s.stationuuid === currentStationId.value)
    if (saved) {
      tuneToStation(saved)
    }
  }
})
</script>

<template>
  <div class="vintage-radio-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">FM 调频台</h1>
        <p class="page-subtitle">转动旋钮，寻找今晚的声音</p>
      </div>
      <div class="header-right">
        <button class="refresh-btn" :disabled="loading" @click="refreshStations">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          <span>刷新电台</span>
        </button>
        <div class="data-status" v-if="stationCount">
          <span class="status-dot"></span>
          {{ stationCount }} 台
          <span v-if="lastUpdate" class="update-time">· {{ lastUpdate }}</span>
        </div>
      </div>
    </div>

    <!-- Radio Receiver Shell -->
    <div class="radio-shell" :class="{ 'radio-shell--playing': isPlaying }">
      <div class="shell-edge shell-edge--top"></div>
      <div class="shell-edge shell-edge--bottom"></div>
      <div class="shell-body">
        <!-- Lock flash -->
        <div class="lock-flash" :class="{ 'lock-flash--visible': lockFlash }"></div>

        <!-- Radio Interior -->
        <div class="radio-interior">
          <!-- LEFT: Speaker -->
          <div class="speaker-section">
            <div class="speaker-grille" :class="{ 'speaker-grille--active': isPlaying }">
              <div class="speaker-pattern"></div>
              <div class="speaker-cone">
                <div
                  class="cone-ring cone-ring--1"
                  :class="{ 'cone-ring--active': isPlaying }"
                ></div>
                <div
                  class="cone-ring cone-ring--2"
                  :class="{ 'cone-ring--active': isPlaying }"
                ></div>
                <div
                  class="cone-ring cone-ring--3"
                  :class="{ 'cone-ring--active': isPlaying }"
                ></div>
                <div class="cone-center" :class="{ 'cone-center--active': isPlaying }"></div>
              </div>
              <div class="speaker-wave" :class="{ 'speaker-wave--active': isPlaying }"></div>
              <div
                class="speaker-wave speaker-wave--2"
                :class="{ 'speaker-wave--active': isPlaying }"
              ></div>
              <div
                class="speaker-wave speaker-wave--3"
                :class="{ 'speaker-wave--active': isPlaying }"
              ></div>
            </div>
            <div class="vu-section">
              <SpectrumMeter :mode="spectrumMode" />
            </div>
          </div>

          <!-- CENTER: Frequency Display -->
          <div class="center-section">
            <!-- ON AIR -->
            <div class="on-air-lamp" :class="'on-air-lamp--' + onAirState">
              <span>ON AIR</span>
            </div>

            <!-- Frequency Window -->
            <div class="freq-window" :class="{ 'freq-window--active': isLocked || isPlaying }">
              <div class="freq-glass"></div>
              <div class="freq-scanline" :class="{ 'freq-scanline--active': isScanning }"></div>
              <div class="freq-content">
                <div class="freq-main-row">
                  <span class="freq-label">FM</span>
                  <span class="freq-digits">{{ currentFrequency.toFixed(1) }}</span>
                  <span class="freq-mhz">MHz</span>
                </div>
                <div class="freq-station-name" :class="{ 'freq-station--visible': isLocked }">
                  {{ screenLine1 }}
                </div>
                <div class="freq-meta" v-if="screenLine2">
                  {{ screenLine2 }}
                </div>
                <div class="freq-status-bar">
                  <span class="freq-status-text" :class="'status--' + statusKey">
                    {{
                      statusKey === 'locked'
                        ? 'LOCKED'
                        : statusKey === 'playing'
                          ? 'BROADCASTING'
                          : statusKey === 'tuning'
                            ? 'SCANNING'
                            : ''
                    }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Dial Scale -->
            <div class="dial-area">
              <FmDialScale
                :frequency="currentFrequency"
                :stations="stationsWithFreq"
                :is-locked="isLocked"
                :locked-id="lockedStation?.stationuuid || ''"
              />
            </div>

            <!-- Transport -->
            <div class="transport-row">
              <button
                class="transport-btn"
                :disabled="!hasPrev"
                @click="prevStation"
                title="上一台"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>
              <button
                class="transport-btn transport-btn--play"
                :disabled="!isLocked"
                @click="togglePlay"
              >
                <svg
                  v-if="!isPlaying"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                </svg>
              </button>
              <button
                class="transport-btn"
                :disabled="!hasNext"
                @click="nextStation"
                title="下一台"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
              <button
                class="transport-btn"
                :class="{ 'transport-btn--scanning': isScanning }"
                @click="openFreqInput"
                title="手动输入频率"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M4 7h16M4 12h10M4 17h6" />
                </svg>
              </button>
              <button
                class="transport-btn"
                :class="{ 'transport-btn--fav': isFavorited }"
                :disabled="!isLocked"
                @click="toggleFav"
                title="收藏"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  :fill="isFavorited ? 'currentColor' : 'none'"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- RIGHT: Tuning Knob -->
          <div class="knob-section">
            <TuningKnob :angle="knobAngle" @rotate="onKnobRotate" @nudge="onKnobNudge" />
            <div class="volume-knob">
              <div class="vol-knob-body"></div>
              <span class="vol-label">VOLUME</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preset Buttons -->
    <PresetButtons
      :stations="presetStations"
      :active-id="lockedStation?.stationuuid || ''"
      @select="onPresetSelect"
    />

    <!-- No Signal State -->
    <div class="no-signal" v-if="!loading && stationCount === 0">
      <div class="no-signal-icon">📻</div>
      <div class="no-signal-text">未接收到电台信号</div>
      <button class="no-signal-btn" @click="refreshStations">重新搜索</button>
    </div>

    <!-- Frequency Input Modal -->
    <Teleport to="body">
      <div class="freq-modal-overlay" v-if="showFreqInput" @click.self="cancelFreqInput">
        <div class="freq-modal">
          <div class="freq-modal-title">手动调频</div>
          <div class="freq-modal-body">
            <span class="freq-modal-prefix">FM</span>
            <input
              class="freq-modal-input"
              type="number"
              min="87.0"
              max="108.0"
              step="0.1"
              v-model="freqInputValue"
              @keyup.enter="confirmFreqInput"
              autofocus
            />
            <span class="freq-modal-suffix">MHz</span>
          </div>
          <div class="freq-modal-hint">范围 87.0 ~ 108.0</div>
          <div class="freq-modal-actions">
            <button class="freq-modal-btn freq-modal-btn--cancel" @click="cancelFreqInput">
              取消
            </button>
            <button class="freq-modal-btn freq-modal-btn--confirm" @click="confirmFreqInput">
              确认调频
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.vintage-radio-page {
  position: relative;
  min-height: calc(100vh - 120px);
  padding: 28px 0 60px;
}

/* --- Page Header --- */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 28px;
  padding: 0 4px;
}

.page-title {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 1.5rem;
  font-weight: normal;
  color: #3b2614;
  letter-spacing: 2px;
  margin: 0;
}

.page-subtitle {
  font-size: 0.78rem;
  color: #8b7355;
  margin: 4px 0 0;
  font-style: italic;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  background: #3b2614;
  border: 1px solid #5a3d25;
  color: #c8a040;
  font-size: 0.72rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.refresh-btn:hover {
  background: #4a3020;
  border-color: #7a5535;
}
.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.refresh-btn:disabled svg {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.data-status {
  font-size: 0.7rem;
  color: #8b7355;
  display: flex;
  align-items: center;
  gap: 5px;
}

.data-status .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6b8e4a;
}

.update-time {
  color: #a08860;
}

/* --- Radio Shell --- */
.radio-shell {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  box-shadow:
    0 30px 80px rgba(20, 10, 0, 0.6),
    0 8px 24px rgba(20, 10, 0, 0.4),
    0 2px 6px rgba(0, 0, 0, 0.3),
    inset 0 0 0 1px rgba(255, 220, 160, 0.08);
  transition: box-shadow 0.8s ease;
}

.radio-shell--playing {
  box-shadow:
    0 30px 80px rgba(20, 10, 0, 0.6),
    0 8px 24px rgba(20, 10, 0, 0.4),
    0 2px 6px rgba(0, 0, 0, 0.3),
    inset 0 0 0 1px rgba(255, 220, 160, 0.08),
    0 0 60px rgba(200, 160, 64, 0.06),
    0 0 120px rgba(200, 160, 64, 0.03);
  animation: shell-breathe 4s ease-in-out infinite;
}

@keyframes shell-breathe {
  0%,
  100% {
    box-shadow:
      0 30px 80px rgba(20, 10, 0, 0.6),
      0 8px 24px rgba(20, 10, 0, 0.4),
      0 2px 6px rgba(0, 0, 0, 0.3),
      inset 0 0 0 1px rgba(255, 220, 160, 0.08),
      0 0 60px rgba(200, 160, 64, 0.06),
      0 0 120px rgba(200, 160, 64, 0.03);
  }
  50% {
    box-shadow:
      0 30px 80px rgba(20, 10, 0, 0.6),
      0 8px 24px rgba(20, 10, 0, 0.4),
      0 2px 6px rgba(0, 0, 0, 0.3),
      inset 0 0 0 1px rgba(255, 220, 160, 0.12),
      0 0 80px rgba(200, 160, 64, 0.1),
      0 0 140px rgba(200, 160, 64, 0.05);
  }
}

.shell-edge {
  height: 6px;
  background: linear-gradient(90deg, #8b6838, #b8944a, #d4a850, #b8944a, #8b6838);
  position: relative;
}
.shell-edge--top {
  border-radius: 18px 18px 0 0;
  box-shadow:
    inset 0 2px 3px rgba(255, 255, 255, 0.2),
    inset 0 -1px 2px rgba(0, 0, 0, 0.3);
}
.shell-edge--bottom {
  border-radius: 0 0 18px 18px;
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.3),
    inset 0 -2px 3px rgba(255, 255, 255, 0.15);
}

.shell-body {
  position: relative;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"),
    linear-gradient(
      180deg,
      #4a3220 0%,
      #3b2814 8%,
      #32220f 20%,
      #2e1f0d 50%,
      #2a1b0b 80%,
      #231608 100%
    );
  padding: 30px 28px;
  min-height: 380px;
}

.lock-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 40%, rgba(255, 200, 80, 0.12), transparent 60%);
  opacity: 0;
  pointer-events: none;
  z-index: 10;
  transition: opacity 0.1s;
}
.lock-flash--visible {
  opacity: 1;
  animation: flash-out 0.6s ease-out forwards;
}
@keyframes flash-out {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* --- Radio Interior Layout --- */
.radio-interior {
  display: grid;
  grid-template-columns: 32% 42% 26%;
  gap: 20px;
  align-items: start;
  min-height: 320px;
}

@media (max-width: 1024px) {
  .radio-interior {
    grid-template-columns: 28% 44% 28%;
    gap: 14px;
  }
}

/* --- LEFT: Speaker --- */
.speaker-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.speaker-grille {
  position: relative;
  flex: 1;
  min-height: 180px;
  border-radius: 10px;
  overflow: hidden;
  background: #1a1008;
  border: 2px solid #5a3d25;
  box-shadow:
    inset 0 4px 16px rgba(0, 0, 0, 0.8),
    0 2px 4px rgba(0, 0, 0, 0.3);
}

.speaker-pattern {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 50%, transparent 30%, rgba(0, 0, 0, 0.15) 70%),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(180, 140, 80, 0.12) 3px,
      rgba(180, 140, 80, 0.12) 4px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 3px,
      rgba(180, 140, 80, 0.08) 3px,
      rgba(180, 140, 80, 0.08) 4px
    );
}

.speaker-grille--active {
  animation: grille-vibrate 0.15s linear infinite;
}

/* Speaker cone (center) */
.speaker-cone {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  margin: -50px 0 0 -50px;
  border-radius: 50%;
  pointer-events: none;
}
.cone-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(180, 140, 80, 0.15);
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
}
.cone-ring--1 {
  inset: 0;
}
.cone-ring--2 {
  inset: 15%;
}
.cone-ring--3 {
  inset: 30%;
}
.cone-ring--active.cone-ring--1 {
  border-color: rgba(200, 160, 64, 0.3);
  box-shadow: 0 0 8px rgba(200, 160, 64, 0.1);
  animation: cone-pulse-1 0.8s ease-in-out infinite alternate;
}
.cone-ring--active.cone-ring--2 {
  border-color: rgba(200, 160, 64, 0.4);
  animation: cone-pulse-2 0.6s ease-in-out infinite alternate;
}
.cone-ring--active.cone-ring--3 {
  border-color: rgba(200, 160, 64, 0.5);
  animation: cone-pulse-3 0.5s ease-in-out infinite alternate;
}
.cone-center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(80, 60, 30, 0.9), rgba(40, 30, 15, 0.95));
  border: 1px solid rgba(140, 100, 50, 0.3);
  transition:
    box-shadow 0.3s,
    transform 0.2s;
}
.cone-center--active {
  box-shadow:
    0 0 12px rgba(200, 160, 64, 0.4),
    0 0 24px rgba(200, 160, 64, 0.15);
  animation: cone-center-beat 0.4s ease-in-out infinite alternate;
}

.speaker-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  margin: -30px 0 0 -30px;
  border-radius: 50%;
  border: 2px solid rgba(200, 160, 64, 0.2);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s;
}

.speaker-wave--active {
  opacity: 1;
  animation: wave-expand 1.8s ease-out infinite;
}

.speaker-wave--2.speaker-wave--active {
  animation-delay: 0.6s;
}

.speaker-wave--3.speaker-wave--active {
  animation-delay: 1.2s;
  border-color: rgba(200, 160, 64, 0.15);
}

@keyframes wave-expand {
  0% {
    transform: scale(0.4);
    opacity: 0.8;
    border-width: 2px;
  }
  100% {
    transform: scale(3.5);
    opacity: 0;
    border-width: 0.5px;
  }
}

@keyframes grille-vibrate {
  0% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(0.3px, -0.2px);
  }
  50% {
    transform: translate(-0.2px, 0.3px);
  }
  75% {
    transform: translate(0.2px, 0.2px);
  }
  100% {
    transform: translate(-0.3px, -0.1px);
  }
}

@keyframes cone-pulse-1 {
  from {
    transform: scale(1);
    opacity: 0.7;
  }
  to {
    transform: scale(1.03);
    opacity: 1;
  }
}
@keyframes cone-pulse-2 {
  from {
    transform: scale(1);
    opacity: 0.6;
  }
  to {
    transform: scale(1.05);
    opacity: 1;
  }
}
@keyframes cone-pulse-3 {
  from {
    transform: scale(0.97);
    opacity: 0.5;
  }
  to {
    transform: scale(1.06);
    opacity: 1;
  }
}
@keyframes cone-center-beat {
  from {
    transform: scale(1);
    box-shadow: 0 0 8px rgba(200, 160, 64, 0.3);
  }
  to {
    transform: scale(1.1);
    box-shadow:
      0 0 16px rgba(200, 160, 64, 0.6),
      0 0 30px rgba(200, 160, 64, 0.2);
  }
}

.vu-section {
  flex-shrink: 0;
}

/* --- CENTER: Frequency Display --- */
.center-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ON AIR Lamp */
.on-air-lamp {
  align-self: flex-start;
  padding: 3px 14px;
  border-radius: 3px;
  background: #1a0a0a;
  border: 1px solid #3a1a1a;
  transition: all 0.4s;
}
.on-air-lamp span {
  font-family: 'Courier New', monospace;
  font-size: 0.65rem;
  font-weight: bold;
  letter-spacing: 3px;
  color: #3a1515;
  transition: all 0.4s;
}

.on-air-lamp--on {
  background: #2a0808;
  border-color: #cc3333;
  box-shadow:
    0 0 12px rgba(204, 51, 51, 0.3),
    0 0 30px rgba(204, 51, 51, 0.1);
}
.on-air-lamp--on span {
  color: #ff4444;
  text-shadow: 0 0 8px rgba(255, 68, 68, 0.8);
  animation: air-blink 2.5s ease-in-out infinite;
}

.on-air-lamp--dim {
  background: #1a0808;
  border-color: #662222;
}
.on-air-lamp--dim span {
  color: #882222;
  text-shadow: 0 0 4px rgba(136, 34, 34, 0.4);
}

@keyframes air-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.65;
  }
}

/* Frequency Window */
.freq-window {
  position: relative;
  background: linear-gradient(180deg, #1a0f00 0%, #0d0800 50%, #0a0500 100%);
  border: 2px solid #5a3d25;
  border-radius: 8px;
  padding: 18px 20px 14px;
  overflow: hidden;
  box-shadow:
    inset 0 4px 20px rgba(0, 0, 0, 0.9),
    inset 0 0 40px rgba(0, 0, 0, 0.5),
    0 1px 0 rgba(255, 220, 160, 0.08);
  transition: border-color 0.4s;
}

.freq-window--active {
  border-color: #7a5535;
}

.freq-glass {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    165deg,
    rgba(255, 200, 100, 0.03) 0%,
    transparent 40%,
    transparent 60%,
    rgba(255, 200, 100, 0.015) 100%
  );
  pointer-events: none;
}

.freq-scanline {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(200, 160, 64, 0.4), transparent);
  opacity: 0;
  pointer-events: none;
}
.freq-scanline--active {
  opacity: 1;
  animation: scanline-move 1.5s linear infinite;
}
@keyframes scanline-move {
  0% {
    top: 0;
  }
  100% {
    top: 100%;
  }
}

.freq-content {
  position: relative;
  z-index: 1;
}

.freq-main-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.freq-label {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #7a5020;
  letter-spacing: 1px;
}

.freq-digits {
  font-family: 'Courier New', monospace;
  font-size: 2.8rem;
  font-weight: bold;
  color: #e8a030;
  text-shadow:
    0 0 10px rgba(232, 160, 48, 0.6),
    0 0 20px rgba(232, 160, 48, 0.3),
    0 0 40px rgba(232, 160, 48, 0.1);
  line-height: 1;
  letter-spacing: -1px;
}

.freq-mhz {
  font-family: 'Courier New', monospace;
  font-size: 0.7rem;
  color: #7a5020;
  letter-spacing: 1px;
}

.freq-station-name {
  margin-top: 10px;
  font-size: 0.88rem;
  color: #4a3015;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.4s;
}

.freq-station--visible {
  color: #c8a040;
  text-shadow: 0 0 6px rgba(200, 160, 64, 0.3);
}

.freq-meta {
  font-size: 0.68rem;
  color: #5a4020;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.freq-status-bar {
  margin-top: 8px;
  min-height: 14px;
}

.freq-status-text {
  font-family: 'Courier New', monospace;
  font-size: 0.6rem;
  letter-spacing: 2px;
  color: #5a4020;
}
.status--locked {
  color: #6b8e4a;
}
.status--playing {
  color: #c8a040;
}
.status--tuning {
  color: #b87830;
  animation: blink-soft 0.8s infinite;
}

@keyframes blink-soft {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* Dial Area */
.dial-area {
  margin-top: 4px;
}

/* Transport Row */
.transport-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.transport-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(180deg, #3b2814, #2a1b0b);
  border: 1px solid #5a3d25;
  color: #a08860;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.12s;
  box-shadow:
    0 3px 8px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 220, 160, 0.06);
}

.transport-btn:hover:not(:disabled) {
  border-color: #8b6838;
  color: #c8a040;
  transform: translateY(-1px);
}

.transport-btn:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

.transport-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.transport-btn--play {
  width: 42px;
  height: 42px;
  border-color: #7a5535;
  color: #c8a040;
}

.transport-btn--play:hover:not(:disabled) {
  border-color: #c8a040;
  box-shadow: 0 0 12px rgba(200, 160, 64, 0.2);
}

.transport-btn--scanning {
  border-color: #b87830;
  color: #e8a030;
  animation: scan-pulse 1.5s ease-in-out infinite;
}
@keyframes scan-pulse {
  0%,
  100% {
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
  }
  50% {
    box-shadow: 0 0 12px rgba(184, 120, 48, 0.3);
  }
}

.transport-btn--fav {
  color: #cc6644;
  border-color: #5a2a1a;
}

/* --- RIGHT: Knob Section --- */
.knob-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding-top: 10px;
}

.volume-knob {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.vol-knob-body {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background:
    radial-gradient(ellipse at 30% 25%, rgba(255, 255, 255, 0.1), transparent 50%),
    conic-gradient(from 0deg, #4a3a2a, #6a5a3a, #4a3a2a, #5a4a35, #4a3a2a);
  border: 2px solid #5a3d25;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.5),
    inset 0 1px 3px rgba(255, 220, 160, 0.08);
}

.vol-label {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 2px;
  color: #8b7355;
}

/* --- No Signal State --- */
.no-signal {
  text-align: center;
  padding: 48px 24px;
  margin-top: 32px;
}

.no-signal-icon {
  font-size: 3rem;
  margin-bottom: 12px;
  opacity: 0.6;
}

.no-signal-text {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #8b7355;
  letter-spacing: 2px;
  margin-bottom: 16px;
}

.no-signal-btn {
  padding: 8px 20px;
  border-radius: 20px;
  background: #3b2614;
  border: 1px solid #5a3d25;
  color: #c8a040;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s;
}
.no-signal-btn:hover {
  background: #4a3020;
  border-color: #8b6838;
}

/* --- Responsive --- */
@media (max-width: 1280px) {
  .radio-interior {
    gap: 16px;
  }
  .freq-digits {
    font-size: 2.4rem;
  }
}

@media (max-width: 1024px) {
  .radio-interior {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .speaker-section {
    flex-direction: row;
    min-height: auto;
  }
  .speaker-grille {
    min-height: 120px;
    flex: 1;
  }
  .vu-section {
    flex: 1;
  }
  .knob-section {
    flex-direction: row;
    padding-top: 0;
    gap: 32px;
    justify-content: center;
  }
}

/* --- Frequency Input Modal --- */
.freq-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.freq-modal {
  background: linear-gradient(180deg, #4a3520 0%, #3b2814 40%, #2e1f0d 100%);
  border: 2px solid #8b6838;
  border-radius: 12px;
  padding: 28px 32px;
  min-width: 300px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.7),
    inset 0 1px 0 rgba(255, 220, 160, 0.08);
}

.freq-modal-title {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  letter-spacing: 3px;
  color: #c8a040;
  text-align: center;
  margin-bottom: 20px;
}

.freq-modal-body {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.freq-modal-prefix,
.freq-modal-suffix {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #8b7355;
}

.freq-modal-input {
  width: 120px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #5a3d25;
  background: #1a0f00;
  color: #e8a030;
  font-family: 'Courier New', monospace;
  font-size: 1.6rem;
  font-weight: bold;
  text-align: center;
  outline: none;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.6);
  appearance: textfield;
  -moz-appearance: textfield;
}

.freq-modal-input::-webkit-outer-spin-button,
.freq-modal-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.freq-modal-input:focus {
  border-color: #c8a040;
  box-shadow:
    inset 0 2px 8px rgba(0, 0, 0, 0.6),
    0 0 8px rgba(200, 160, 64, 0.2);
}

.freq-modal-hint {
  font-size: 0.68rem;
  color: #6a4a2a;
  text-align: center;
  margin-top: 10px;
}

.freq-modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: center;
}

.freq-modal-btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.freq-modal-btn--cancel {
  background: transparent;
  border: 1px solid #5a3d25;
  color: #8b7355;
}
.freq-modal-btn--cancel:hover {
  border-color: #8b6838;
  color: #c8a040;
}

.freq-modal-btn--confirm {
  background: #5a3d25;
  border: 1px solid #8b6838;
  color: #e8a030;
}
.freq-modal-btn--confirm:hover {
  background: #6a4a2a;
  box-shadow: 0 0 10px rgba(200, 160, 64, 0.15);
}
</style>
