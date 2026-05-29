<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useRadioStore } from '../stores/radio'

const router = useRouter()
const radioStore = useRadioStore()
const {
  currentProgram,
  currentStationObj,
  currentStationId,
  playbackStatus,
  isPlaying,
  favoritePrograms,
  subscribedPrograms,
  favoriteStationList,
  favoriteFmStationList,
  subscribedStationList,
  playHistory,
  progress,
  progressLabel,
  durationLabel,
  sleepDeadline,
  sleepRemainingLabel,
  listeningMinutes,
  listeningHourPart,
  listeningMinutePart,
} = storeToRefs(radioStore)

const sleepOptions = [0, 15, 30, 45, 60]

const showResetConfirm = ref(false)
const exportFeedback = ref('')
const cacheFeedback = ref('')

const tick = ref(0)
let tickInterval = null

const isStationMode = computed(() => !!currentStationId.value)
const hasPlaying = computed(() => !!(currentProgram.value?.id || currentStationObj.value))

const nowPlayingTitle = computed(() => {
  if (currentStationObj.value) return currentStationObj.value.name
  if (currentProgram.value?.id) return currentProgram.value.title
  return ''
})

const nowPlayingSubtitle = computed(() => {
  if (currentStationObj.value) {
    const s = currentStationObj.value
    const parts = []
    if (s.country) parts.push(s.country)
    if (s.codec) parts.push(s.codec.toUpperCase())
    if (s.bitrate) parts.push(s.bitrate + 'kbps')
    return parts.join(' · ') || '电台直播'
  }
  if (currentProgram.value?.id) return currentProgram.value.host || ''
  return ''
})

const statusText = computed(() => {
  switch (playbackStatus.value) {
    case 'playing': return 'ON AIR'
    case 'loading': return 'TUNING'
    case 'buffering': return 'BUFFER'
    case 'paused': return 'PAUSED'
    case 'error': return 'ERROR'
    default: return 'OFF'
  }
})

const currentSleepMinutes = computed(() => {
  tick.value
  if (!sleepDeadline.value) return 0
  return Math.ceil((sleepDeadline.value - Date.now()) / 60000)
})

const localSleepLabel = computed(() => {
  tick.value
  return sleepRemainingLabel.value
})

const listeningProgress = computed(() => Math.min((listeningMinutePart.value / 60) * 100, 100))

const listeningSummary = computed(() => {
  if (!listeningMinutes.value) return '今天从第一分钟开始记录'
  if (listeningHourPart.value) {
    return `已累计 ${listeningHourPart.value} 小时 ${listeningMinutePart.value} 分钟`
  }
  return `已累计 ${listeningMinutes.value} 分钟`
})

const historyItems = computed(() => {
  if (!playHistory.value || !playHistory.value.length) return []
  return playHistory.value.slice(0, 20).map((entry) => {
    const normalized = typeof entry === 'string' ? { type: 'program', id: entry } : entry

    if (normalized.type === 'station') {
      const station = radioStore.getStationById(normalized.id) || normalized.station || null
      return {
        id: normalized.id,
        title: station?.name || normalized.title || normalized.id,
        type: '电台',
        station,
      }
    }

    const program = radioStore.getProgramById(normalized.id)
    return program
      ? { id: normalized.id, title: program.title, type: '节目' }
      : { id: normalized.id, title: normalized.id, type: '未知' }
  }).filter(item => item.title !== item.id || item.type !== '未知')
})

function togglePlayback() {
  if (isStationMode.value) {
    radioStore.toggleStation()
  } else {
    radioStore.togglePlay(currentProgram.value?.id)
  }
}

function handlePrev() {
  if (!isStationMode.value) radioStore.playPrevious()
}

function handleNext() {
  if (!isStationMode.value) radioStore.playNext()
}

function goToNowPlaying() {
  if (currentStationObj.value) {
    const id = currentStationObj.value.stationuuid
    if (id && id.startsWith('known-')) {
      router.push('/stations')
    } else {
      router.push('/live')
    }
  } else if (currentProgram.value?.id) {
    router.push(`/programs/${currentProgram.value.id}`)
  }
}

function setSleep(minutes) {
  radioStore.setSleepTimer(minutes)
}

function cancelSleep() {
  radioStore.setSleepTimer(0)
}

function playHistoryItem(item) {
  if (item.type === '电台' && item.station) {
    radioStore.playStation(item.station)
    return
  }
  radioStore.playProgram(item.id)
}

function exportData() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('retro-radio') || key && key.startsWith('retro_radio')) {
      try { data[key] = JSON.parse(localStorage.getItem(key)) }
      catch { data[key] = localStorage.getItem(key) }
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `retro-radio-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  exportFeedback.value = '已导出'
  setTimeout(() => { exportFeedback.value = '' }, 2000)
}

function clearCache() {
  localStorage.removeItem('retro-radio-programs-content')
  localStorage.removeItem('retro-radio-stations-content')
  localStorage.removeItem('retro_radio_real_stations')
  localStorage.removeItem('retro-radio-content-last-updated-at')
  cacheFeedback.value = '已清除'
  setTimeout(() => { cacheFeedback.value = '' }, 2000)
}

function resetAll() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith('retro-radio') || key.startsWith('retro_radio'))) {
      keys.push(key)
    }
  }
  keys.forEach((k) => localStorage.removeItem(k))
  showResetConfirm.value = false
  window.location.reload()
}

onMounted(() => {
  tickInterval = setInterval(() => { tick.value++ }, 1000)
})

onUnmounted(() => {
  if (tickInterval) clearInterval(tickInterval)
})
</script>

<template>
  <div class="console-page">
    <!-- Page Header -->
    <div class="console-header">
      <h1 class="console-title">我的声音控制台</h1>
      <p class="console-subtitle">PERSONAL SOUND CONSOLE</p>
    </div>

    <!-- Upper Section -->
    <div class="upper-section">
      <!-- LEFT: Current Listening Console -->
      <div class="listening-console">
        <div class="panel-label">CURRENT LISTENING</div>
        <div class="console-screen">
          <!-- ON AIR Lamp -->
          <div class="onair-indicator" :class="'onair--' + playbackStatus">
            <span class="onair-dot" />
            <span class="onair-text">{{ statusText }}</span>
          </div>

          <template v-if="hasPlaying">
            <p class="screen-title" @click="goToNowPlaying" :title="nowPlayingTitle">
              {{ nowPlayingTitle }}
            </p>
            <p class="screen-subtitle">{{ nowPlayingSubtitle }}</p>

            <!-- Waveform -->
            <div class="screen-waveform">
              <span
                v-for="i in 16"
                :key="i"
                class="wave-bar"
                :class="{ 'wave-bar--active': isPlaying }"
                :style="{ animationDelay: `${i * 0.07}s` }"
              />
            </div>

            <!-- Progress -->
            <div class="screen-progress" v-if="!isStationMode">
              <span class="progress-time">{{ progressLabel }}</span>
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: (durationLabel !== '00:00' ? (progress / Math.max(1, parseInt(durationLabel.split(':')[0]) * 60 + parseInt(durationLabel.split(':')[1]))) * 100 : 0) + '%' }" />
              </div>
              <span class="progress-time">{{ durationLabel }}</span>
            </div>
            <div v-else class="screen-live-badge">
              <span class="live-dot" />
              <span>LIVE</span>
            </div>

            <!-- Transport Controls -->
            <div class="transport-row">
              <button class="transport-btn" :disabled="isStationMode" @click="handlePrev" title="上一个">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
              </button>
              <button class="transport-btn transport-btn--main" @click="togglePlayback" :title="isPlaying ? '暂停' : '播放'">
                <svg v-if="isPlaying" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z"/></svg>
              </button>
              <button class="transport-btn" :disabled="isStationMode" @click="handleNext" title="下一个">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
              </button>
            </div>
          </template>

          <template v-else>
            <div class="screen-empty">
              <p class="empty-text">还没有调到频道</p>
              <p class="empty-hint">去节目或电台页面选择内容播放</p>
            </div>
          </template>
        </div>
      </div>

      <!-- RIGHT: Listening Stats + Sleep Timer -->
      <div class="right-panels">
        <!-- Listening Time -->
        <div class="stats-panel">
          <div class="panel-label">LISTENING TIME</div>
          <div class="listening-stat">
            <div class="stat-meter" :style="{ '--listen-progress': listeningProgress + '%' }">
              <div class="stat-meter-face">
                <span class="stat-meter-value">{{ listeningMinutePart }}</span>
                <span class="stat-meter-unit">MIN</span>
              </div>
            </div>
            <div class="stat-copy">
              <p class="stat-title">累计收听时长</p>
              <div class="stat-time">
                <span class="stat-number">{{ listeningHourPart }}</span>
                <span class="stat-unit">小时</span>
                <span class="stat-number">{{ listeningMinutePart }}</span>
                <span class="stat-unit">分钟</span>
              </div>
              <p class="stat-note">{{ listeningSummary }}</p>
              <div class="stat-progress">
                <span :style="{ width: listeningProgress + '%' }" />
              </div>
            </div>
          </div>
        </div>

        <!-- Sleep Timer -->
        <div class="timer-panel">
          <div class="panel-label">SLEEP TIMER</div>
          <div class="timer-content">
            <div class="timer-dial">
              <div class="dial-ring" :style="{ '--progress': sleepDeadline ? '1' : '0' }">
                <div class="dial-face" :class="{ 'dial-face--active': sleepDeadline }">
                  <span class="dial-value">{{ sleepDeadline ? localSleepLabel : 'OFF' }}</span>
                  <span class="dial-unit" v-if="sleepDeadline">剩余</span>
                </div>
              </div>
            </div>
            <div class="timer-presets">
              <button
                v-for="m in sleepOptions"
                :key="m"
                class="mech-switch"
                :class="{ 'mech-switch--active': !sleepDeadline && m === 0 || (sleepDeadline && currentSleepMinutes <= m && currentSleepMinutes > (m - 15)) }"
                @click="setSleep(m)"
              >{{ m === 0 ? '关闭' : m + '分钟' }}</button>
            </div>
            <button v-if="sleepDeadline" class="cancel-timer-btn" @click="cancelSleep">取消定时</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Middle Section: Favorites + Subscriptions -->
    <div class="middle-section">
      <!-- LEFT: Favorites -->
      <div class="favorites-panel">
        <div class="panel-label">MY COLLECTION</div>
        <p class="section-title">收藏的声音</p>

        <!-- Favorite Programs -->
        <div v-if="favoritePrograms.length" class="tape-grid">
          <div
            v-for="program in favoritePrograms"
            :key="program.id"
            class="tape-label"
            @click="radioStore.playProgram(program.id)"
          >
            <span class="tape-strip tape-strip--program" />
            <div class="tape-info">
              <p class="tape-title" :title="program.title">{{ program.title }}</p>
              <p class="tape-meta">节目 · {{ program.host }}</p>
            </div>
            <button class="tape-action" @click.stop="radioStore.toggleFavorite(program.id)" title="取消收藏">
              <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
        </div>

        <!-- Favorite FM Stations -->
        <div v-if="favoriteFmStationList.length" class="tape-grid" style="margin-top: 12px;">
          <div
            v-for="station in favoriteFmStationList"
            :key="station.stationuuid"
            class="tape-label"
            @click="radioStore.playStation(station)"
          >
            <span class="tape-strip tape-strip--fm" />
            <div class="tape-info">
              <p class="tape-title" :title="station.name">{{ station.name }}</p>
              <p class="tape-meta">FM · {{ (station.codec || '').toUpperCase() }}</p>
            </div>
            <button class="tape-action" @click.stop="radioStore.toggleFavoriteFmStation(station.stationuuid)" title="取消收藏">
              <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
        </div>

        <!-- Favorite International Stations -->
        <div v-if="favoriteStationList.length" class="tape-grid" style="margin-top: 12px;">
          <div
            v-for="station in favoriteStationList"
            :key="station.stationuuid"
            class="tape-label"
            @click="radioStore.playStation(station)"
          >
            <span class="tape-strip tape-strip--intl" />
            <div class="tape-info">
              <p class="tape-title" :title="station.name">{{ station.name }}</p>
              <p class="tape-meta">国际 · {{ station.country }}</p>
            </div>
            <button class="tape-action" @click.stop="radioStore.toggleFavoriteStation(station.stationuuid)" title="取消收藏">
              <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
        </div>

        <div v-if="!favoritePrograms.length && !favoriteFmStationList.length && !favoriteStationList.length" class="empty-state">
          <p class="empty-label">还没有收藏的声音</p>
        </div>
      </div>

      <!-- RIGHT: Subscriptions -->
      <div class="subscriptions-panel">
        <div class="panel-label">SUBSCRIBED CHANNELS</div>
        <p class="section-title">订阅的声音</p>

        <!-- Subscribed Programs -->
        <div v-if="subscribedPrograms.length" class="drawer-grid">
          <div
            v-for="program in subscribedPrograms"
            :key="program.id"
            class="drawer-card"
          >
            <div class="drawer-body">
              <p class="drawer-title" :title="program.title">{{ program.title }}</p>
              <p class="drawer-meta">{{ program.host }} · {{ program.category }}</p>
            </div>
            <div class="drawer-actions">
              <button class="drawer-btn" @click="radioStore.playProgram(program.id)">播放</button>
              <button class="drawer-btn drawer-btn--unsub" @click="radioStore.toggleSubscribe(program.id)">退订</button>
            </div>
          </div>
        </div>

        <!-- Subscribed Stations -->
        <div v-if="subscribedStationList.length" class="drawer-grid" style="margin-top: 12px;">
          <div
            v-for="station in subscribedStationList"
            :key="station.stationuuid"
            class="drawer-card"
          >
            <div class="drawer-body">
              <p class="drawer-title" :title="station.name">{{ station.name }}</p>
              <p class="drawer-meta">{{ station.country }} · {{ (station.codec || '').toUpperCase() }}</p>
            </div>
            <div class="drawer-actions">
              <button class="drawer-btn" @click="radioStore.playStation(station)">收听</button>
              <button class="drawer-btn drawer-btn--unsub" @click="radioStore.toggleSubscribeStation(station.stationuuid)">退订</button>
            </div>
          </div>
        </div>

        <div v-if="!subscribedPrograms.length && !subscribedStationList.length" class="empty-state">
          <p class="empty-label">还没有订阅的节目或电台</p>
        </div>
      </div>
    </div>

    <!-- Bottom: Play History -->
    <div class="bottom-section">
      <div class="history-panel">
        <div class="panel-label">LISTENING LOG</div>
        <p class="section-title">播放记录</p>
        <div v-if="historyItems.length" class="history-scroll">
          <div
            v-for="item in historyItems"
            :key="item.id"
            class="history-tape"
            @click="playHistoryItem(item)"
          >
            <span class="history-strip" />
            <div class="history-info">
              <p class="history-title" :title="item.title">{{ item.title }}</p>
              <span class="history-badge">{{ item.type }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p class="empty-label">还没有播放记录</p>
        </div>
      </div>

      <!-- Maintenance Tools -->
      <div class="maintenance-panel">
        <div class="panel-label">MAINTENANCE</div>
        <p class="section-title">数据维护</p>
        <div class="maintenance-tools">
          <button class="maint-btn" @click="exportData">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            <span>{{ exportFeedback || '导出数据' }}</span>
          </button>
          <button class="maint-btn" @click="clearCache">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M5 13h14v-2H5v2zm-2 4h14v-2H3v2zM7 7v2h14V7H7z"/></svg>
            <span>{{ cacheFeedback || '清除缓存' }}</span>
          </button>
          <button class="maint-btn maint-btn--danger" @click="showResetConfirm = true">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            <span>重置所有</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Reset Confirm Modal -->
    <Teleport to="body">
      <div v-if="showResetConfirm" class="modal-overlay" @click.self="showResetConfirm = false">
        <div class="modal-box">
          <p class="modal-title">确认重置</p>
          <p class="modal-desc">将清除所有本地数据（收藏、订阅、偏好、历史），此操作不可恢复。</p>
          <div class="modal-actions">
            <button class="mech-switch" @click="showResetConfirm = false">取消</button>
            <button class="mech-switch mech-switch--danger" @click="resetAll">确认重置</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.console-page {
  position: relative;
  max-width: 1240px;
  margin: 0 auto;
  padding: 28px 24px 80px;
  min-height: calc(100vh - 120px);
}

/* --- Header --- */
.console-header {
  margin-bottom: 32px;
  text-align: center;
}
.console-title {
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(28px, 4vw, 38px);
  font-weight: 700;
  color: #2c1b10;
  letter-spacing: 2px;
}
.console-subtitle {
  margin-top: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.7rem;
  letter-spacing: 4px;
  color: #8b7355;
  text-transform: uppercase;
}

/* --- Panel Label (equipment font) --- */
.panel-label {
  font-family: 'Courier New', monospace;
  font-size: 0.6rem;
  letter-spacing: 3px;
  color: #8b7355;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.section-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(250, 244, 232, 0.85);
  margin-bottom: 14px;
}

/* --- Upper Section Grid --- */
.upper-section {
  display: grid;
  grid-template-columns: 45% minmax(0, 1fr);
  gap: 24px;
  margin-bottom: 28px;
}
@media (max-width: 1024px) {
  .upper-section {
    grid-template-columns: 1fr;
  }
}

/* --- Listening Console --- */
.listening-console {
  background: linear-gradient(160deg, #2e1f0d, #1a1008);
  border: 2px solid #5a3d25;
  border-radius: 12px;
  padding: 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 200, 120, 0.04);
  position: relative;
  overflow: hidden;
}
.listening-console::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.04;
  pointer-events: none;
}

.console-screen {
  background: linear-gradient(180deg, #0d0800, #0a0500);
  border: 1px solid #3a2815;
  border-radius: 8px;
  padding: 20px;
  box-shadow: inset 0 4px 16px rgba(0, 0, 0, 0.8);
  position: relative;
}

/* ON AIR Indicator */
.onair-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 4px;
  background: rgba(20, 15, 8, 0.8);
  border: 1px solid rgba(80, 60, 40, 0.3);
  margin-bottom: 12px;
}
.onair-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(80, 60, 40, 0.4);
  transition: background 0.3s, box-shadow 0.3s;
}
.onair--playing .onair-dot {
  background: #cc3333;
  box-shadow: 0 0 6px rgba(204, 51, 51, 0.6), 0 0 12px rgba(204, 51, 51, 0.3);
  animation: air-blink 2.5s ease-in-out infinite;
}
.onair--loading .onair-dot,
.onair--buffering .onair-dot {
  background: #e8a030;
  box-shadow: 0 0 6px rgba(232, 160, 48, 0.5);
  animation: air-blink 1s ease-in-out infinite;
}
.onair--error .onair-dot {
  background: #cc3333;
  animation: air-blink 0.4s ease-in-out infinite;
}
.onair-text {
  font-family: 'Courier New', monospace;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: rgba(250, 244, 232, 0.4);
}
.onair--playing .onair-text { color: #cc3333; }
.onair--loading .onair-text,
.onair--buffering .onair-text { color: #e8a030; }
.onair--error .onair-text { color: #cc3333; }

/* Screen content */
.screen-title {
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(16px, 2vw, 20px);
  font-weight: 600;
  color: #e8a030;
  text-shadow: 0 0 8px rgba(232, 160, 48, 0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: color 0.2s;
}
.screen-title:hover {
  color: #f0c060;
}
.screen-subtitle {
  margin-top: 4px;
  font-size: 0.75rem;
  color: rgba(232, 160, 48, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Waveform bars */
.screen-waveform {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 28px;
  margin: 14px 0;
}
.wave-bar {
  width: 4px;
  height: 4px;
  border-radius: 1px;
  background: rgba(180, 130, 60, 0.3);
  transition: height 0.3s, background 0.3s;
}
.wave-bar--active {
  background: #e8a030;
  box-shadow: 0 0 3px rgba(232, 160, 48, 0.4);
  animation: wave-bounce 0.7s ease-in-out infinite alternate;
}

/* Progress */
.screen-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.progress-time {
  font-family: 'Courier New', monospace;
  font-size: 0.65rem;
  color: rgba(232, 160, 48, 0.5);
  min-width: 36px;
  text-align: center;
}
.progress-track {
  flex: 1;
  height: 3px;
  background: rgba(60, 40, 20, 0.6);
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(to right, rgba(180, 130, 60, 0.6), #e8a030);
  border-radius: 2px;
  transition: width 0.5s linear;
}

/* Live badge */
.screen-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 12px 0;
  padding: 3px 10px;
  border-radius: 4px;
  background: rgba(204, 51, 51, 0.1);
  border: 1px solid rgba(204, 51, 51, 0.3);
}
.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #cc3333;
  animation: air-blink 1.5s ease-in-out infinite;
}
.screen-live-badge span {
  font-family: 'Courier New', monospace;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: rgba(204, 51, 51, 0.8);
}

/* Transport buttons */
.transport-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.transport-btn {
  display: grid;
  place-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3a2418, #241610);
  border: 1.5px solid rgba(140, 100, 50, 0.4);
  color: rgba(250, 244, 232, 0.6);
  cursor: pointer;
  transition: transform 0.12s, border-color 0.2s, color 0.2s;
}
.transport-btn:hover:not(:disabled) {
  border-color: rgba(200, 160, 64, 0.6);
  color: rgba(250, 244, 232, 0.9);
  transform: scale(1.05);
}
.transport-btn:active:not(:disabled) { transform: scale(0.92); }
.transport-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.transport-btn--main {
  width: 44px;
  height: 44px;
  border: 2px solid rgba(180, 130, 70, 0.5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Empty state */
.screen-empty {
  text-align: center;
  padding: 24px 0;
}
.empty-text {
  font-family: 'Noto Serif SC', serif;
  font-size: 1rem;
  color: rgba(232, 160, 48, 0.4);
}
.empty-hint {
  margin-top: 6px;
  font-size: 0.72rem;
  color: rgba(232, 160, 48, 0.25);
}

/* --- Right Panels --- */
.right-panels {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

/* Listening Stats */
.stats-panel {
  position: relative;
  overflow: hidden;
  min-width: 0;
  border: 1px solid rgba(220, 168, 86, 0.34);
  border-radius: 14px;
  padding: 18px 20px;
  background:
    linear-gradient(150deg, rgba(63, 42, 22, 0.96), rgba(25, 15, 8, 0.98)),
    #20150c;
  box-shadow:
    0 18px 40px rgba(34, 20, 8, 0.25),
    inset 0 1px 0 rgba(255, 229, 180, 0.08);
}
.listening-stat {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
}
.stat-meter {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 108px;
  height: 108px;
  border-radius: 50%;
  background:
    conic-gradient(#e8a030 var(--listen-progress), rgba(62, 42, 23, 0.95) 0),
    #1a1008;
}
.stat-meter-face {
  display: grid;
  place-items: center;
  width: 82px;
  height: 82px;
  border-radius: 50%;
  background: radial-gradient(circle at 45% 35%, #342314, #100904 78%);
  border: 1px solid rgba(232, 160, 48, 0.2);
}
.stat-meter-value {
  font-family: 'Courier New', monospace;
  font-size: 1.65rem;
  font-weight: 700;
  line-height: 1;
  color: #ffd890;
  text-shadow: 0 0 12px rgba(232, 160, 48, 0.4);
}
.stat-meter-unit {
  margin-top: -4px;
  font-family: 'Courier New', monospace;
  font-size: 0.58rem;
  letter-spacing: 2px;
  color: rgba(255, 216, 144, 0.52);
}
.stat-copy {
  min-width: 0;
  flex: 1;
}
.stat-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 1rem;
  font-weight: 700;
  color: rgba(250, 244, 232, 0.9);
}
.stat-time {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 8px;
  white-space: nowrap;
}
.stat-number {
  font-family: 'Courier New', monospace;
  font-size: clamp(1.8rem, 4vw, 2.35rem);
  font-weight: 700;
  color: #e8a030;
}
.stat-unit,
.stat-note {
  color: rgba(250, 244, 232, 0.54);
}
.stat-unit {
  font-size: 0.72rem;
}
.stat-note {
  margin-top: 5px;
  font-size: 0.72rem;
}
.stat-progress {
  height: 4px;
  margin-top: 14px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(12, 7, 3, 0.62);
}
.stat-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #a35f24, #e8a030, #ffd890);
}

/* Mechanical Switch */
.mech-switch {
  padding: 5px 12px;
  border-radius: 4px;
  background: linear-gradient(180deg, #3b2814, #2a1b0b);
  border: 1px solid #5a3d25;
  color: #8b7355;
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 0.72rem;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 220, 160, 0.04);
  transition: all 0.15s;
  white-space: nowrap;
}
.mech-switch:hover {
  border-color: #7a5535;
  color: #b8944a;
}
.mech-switch--active {
  background: linear-gradient(180deg, #5a3d25, #4a3220);
  border-color: #8b6838;
  color: #e8a030;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 8px rgba(232, 160, 48, 0.12);
  text-shadow: 0 0 4px rgba(232, 160, 48, 0.3);
}
.mech-switch--danger {
  border-color: #5a2020;
  color: #cc4444;
}
.mech-switch--danger:hover {
  border-color: #882020;
  box-shadow: 0 0 8px rgba(204, 51, 51, 0.15);
}

/* Timer Panel */
.timer-panel {
  background: linear-gradient(160deg, #2e1f0d, #1a1008);
  border: 2px solid #5a3d25;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  position: relative;
  overflow: hidden;
}
.timer-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.04;
  pointer-events: none;
}
.timer-content {
  display: flex;
  align-items: center;
  gap: 20px;
}
.timer-dial {
  flex-shrink: 0;
}
.dial-ring {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: conic-gradient(
    rgba(232, 160, 48, 0.6) calc(var(--progress) * 360deg),
    rgba(30, 20, 10, 0.8) calc(var(--progress) * 360deg)
  );
  padding: 4px;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.5), inset 0 0 4px rgba(0, 0, 0, 0.3);
  border: 2px solid #5a3d25;
}
.dial-face {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, #1a1008, #0d0800);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: box-shadow 0.3s;
}
.dial-face--active {
  box-shadow: inset 0 0 12px rgba(232, 160, 48, 0.1);
}
.dial-value {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: #e8a030;
  text-shadow: 0 0 6px rgba(232, 160, 48, 0.4);
  letter-spacing: 1px;
}
.dial-face:not(.dial-face--active) .dial-value {
  color: rgba(140, 100, 50, 0.4);
  text-shadow: none;
}
.dial-unit {
  font-size: 0.55rem;
  color: rgba(232, 160, 48, 0.4);
  margin-top: 2px;
}
.timer-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.cancel-timer-btn {
  font-size: 0.7rem;
  color: rgba(204, 51, 51, 0.7);
  background: none;
  border: 1px solid rgba(204, 51, 51, 0.3);
  border-radius: 4px;
  padding: 4px 10px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}
.cancel-timer-btn:hover {
  border-color: rgba(204, 51, 51, 0.6);
  color: rgba(204, 51, 51, 0.9);
}

/* --- Middle Section --- */
.middle-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 28px;
}
@media (max-width: 1024px) {
  .middle-section {
    grid-template-columns: 1fr;
  }
}

.favorites-panel,
.subscriptions-panel {
  background: linear-gradient(160deg, #2e1f0d, #1a1008);
  border: 2px solid #5a3d25;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  min-width: 0;
  position: relative;
  overflow: hidden;
}
.favorites-panel::before,
.subscriptions-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.04;
  pointer-events: none;
}

/* Tape Label Cards */
.tape-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
}
.tape-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 5px;
  background: linear-gradient(135deg, #3b2814, #2e1f0d);
  border: 1px solid rgba(140, 100, 50, 0.2);
  cursor: pointer;
  transition: transform 0.15s, border-color 0.2s, box-shadow 0.2s;
  min-width: 0;
}
.tape-label:hover {
  transform: translateX(3px);
  border-color: rgba(180, 130, 60, 0.4);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
.tape-strip {
  width: 4px;
  height: 28px;
  border-radius: 2px;
  flex-shrink: 0;
}
.tape-strip--program { background: linear-gradient(180deg, #e8a030, #c88020); }
.tape-strip--fm { background: linear-gradient(180deg, #6b8e4a, #4a6830); }
.tape-strip--intl { background: linear-gradient(180deg, #5a7ab8, #3a5a90); }
.tape-info {
  flex: 1;
  min-width: 0;
}
.tape-title {
  font-size: 0.78rem;
  font-weight: 500;
  color: rgba(250, 244, 232, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tape-meta {
  font-size: 0.62rem;
  color: rgba(250, 244, 232, 0.35);
  margin-top: 2px;
}
.tape-action {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: grid;
  place-content: center;
  border-radius: 50%;
  background: rgba(60, 40, 20, 0.5);
  border: 1px solid rgba(100, 70, 40, 0.3);
  color: rgba(250, 244, 232, 0.4);
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}
.tape-action:hover {
  color: rgba(204, 51, 51, 0.8);
  border-color: rgba(204, 51, 51, 0.4);
}

/* Drawer Cards */
.drawer-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.drawer-card {
  position: relative;
  padding: 12px 14px;
  border-radius: 6px;
  background: linear-gradient(180deg, #3b2814, #2e1f0d);
  border: 1px solid rgba(140, 100, 50, 0.25);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: transform 0.15s, box-shadow 0.2s;
  min-width: 0;
}
.drawer-card::before {
  content: '';
  position: absolute;
  top: -4px;
  left: 14px;
  width: 36px;
  height: 4px;
  background: linear-gradient(90deg, #8b6838, #d4a850, #8b6838);
  border-radius: 2px 2px 0 0;
}
.drawer-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.drawer-body {
  flex: 1;
  min-width: 0;
}
.drawer-title {
  font-size: 0.82rem;
  font-weight: 500;
  color: rgba(250, 244, 232, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.drawer-meta {
  font-size: 0.62rem;
  color: rgba(250, 244, 232, 0.35);
  margin-top: 3px;
}
.drawer-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.drawer-btn {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.68rem;
  cursor: pointer;
  background: linear-gradient(180deg, #4a3220, #3b2814);
  border: 1px solid #5a3d25;
  color: #b8944a;
  transition: all 0.15s;
}
.drawer-btn:hover {
  border-color: #8b6838;
  color: #e8a030;
}
.drawer-btn--unsub {
  color: rgba(204, 100, 80, 0.7);
  border-color: rgba(140, 60, 50, 0.3);
}
.drawer-btn--unsub:hover {
  color: rgba(204, 51, 51, 0.9);
  border-color: rgba(204, 51, 51, 0.5);
}

/* Empty state */
.empty-state {
  padding: 28px 16px;
  text-align: center;
}
.empty-label {
  font-family: 'Noto Serif SC', serif;
  font-size: 0.85rem;
  color: rgba(250, 244, 232, 0.25);
}

/* --- Bottom Section --- */
.bottom-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
@media (max-width: 1024px) {
  .bottom-section {
    grid-template-columns: 1fr;
  }
}

.history-panel,
.maintenance-panel {
  background: linear-gradient(160deg, #2e1f0d, #1a1008);
  border: 2px solid #5a3d25;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  min-width: 0;
  position: relative;
  overflow: hidden;
}
.history-panel::before,
.maintenance-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.04;
  pointer-events: none;
}

/* History Tape Scroll */
.history-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 8px 0 12px;
  scroll-snap-type: x proximity;
}
.history-scroll::-webkit-scrollbar { height: 4px; }
.history-scroll::-webkit-scrollbar-track { background: rgba(30, 20, 10, 0.5); border-radius: 2px; }
.history-scroll::-webkit-scrollbar-thumb { background: #5a3d25; border-radius: 2px; }

.history-tape {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 160px;
  max-width: 180px;
  padding: 8px 10px;
  border-radius: 4px;
  background: linear-gradient(135deg, #3b2814, #2e1f0d);
  border: 1px solid rgba(140, 100, 50, 0.2);
  cursor: pointer;
  scroll-snap-align: start;
  flex-shrink: 0;
  transition: transform 0.15s, border-color 0.2s;
}
.history-tape:hover {
  transform: translateY(-2px);
  border-color: rgba(180, 130, 60, 0.4);
}
.history-strip {
  width: 3px;
  height: 24px;
  border-radius: 1.5px;
  background: linear-gradient(180deg, #8b6838, #5a3d25);
  flex-shrink: 0;
}
.history-info {
  flex: 1;
  min-width: 0;
}
.history-title {
  font-size: 0.7rem;
  color: rgba(250, 244, 232, 0.75);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.history-badge {
  font-size: 0.55rem;
  color: rgba(232, 160, 48, 0.5);
  margin-top: 2px;
  display: block;
}

/* Maintenance Tools */
.maintenance-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
}
.maint-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  background: linear-gradient(180deg, #3b2814, #2a1b0b);
  border: 1.5px solid #5a3d25;
  color: #b8944a;
  font-size: 0.75rem;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 220, 160, 0.03);
  transition: all 0.15s;
}
.maint-btn:hover {
  border-color: #8b6838;
  color: #e8a030;
  transform: translateY(-1px);
}
.maint-btn:active {
  transform: translateY(1px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(0, 0, 0, 0.3);
}
.maint-btn--danger {
  border-color: #5a2020;
  color: rgba(204, 80, 60, 0.8);
}
.maint-btn--danger:hover {
  border-color: #882020;
  color: #cc4444;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4), 0 0 8px rgba(204, 51, 51, 0.1);
}

/* --- Modal --- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 100;
  display: grid;
  place-content: center;
}
.modal-box {
  background: linear-gradient(160deg, #2e1f0d, #1a1008);
  border: 2px solid #5a3d25;
  border-radius: 12px;
  padding: 28px 32px;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}
.modal-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(250, 244, 232, 0.9);
  margin-bottom: 10px;
}
.modal-desc {
  font-size: 0.78rem;
  color: rgba(250, 244, 232, 0.5);
  line-height: 1.5;
  margin-bottom: 20px;
}
.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* --- Animations --- */
@keyframes air-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
@keyframes wave-bounce {
  0% { height: 4px; }
  20% { height: 16px; }
  40% { height: 8px; }
  60% { height: 22px; }
  80% { height: 10px; }
  100% { height: 6px; }
}
</style>
