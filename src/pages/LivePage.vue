<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import LiveVisualStage from '../components/LiveVisualStage.vue'
import { useRadioStore } from '../stores/radio'

const radioStore = useRadioStore()
const {
  stations,
  currentStationId,
  isPlaying,
  favoriteStations,
  subscribedStations,
  stationsRefreshing,
} = storeToRefs(radioStore)
const brokenStationIcons = ref(new Set())
const loadedStationIcons = ref(new Set())

function currentStation() {
  return stations.value.find((s) => s.stationuuid === currentStationId.value)
}

function handleToggle() {
  if (currentStationId.value) {
    radioStore.toggleStation()
  } else {
    radioStore.togglePlay()
  }
}

function isStationIconBroken(station) {
  return brokenStationIcons.value.has(station.stationuuid)
}

function isStationIconLoaded(station) {
  return loadedStationIcons.value.has(station.stationuuid)
}

function markStationIconLoaded(station) {
  if (!station?.stationuuid) return
  loadedStationIcons.value.add(station.stationuuid)
}

function markStationIconBroken(station) {
  if (!station?.stationuuid) return
  brokenStationIcons.value.add(station.stationuuid)
}

onMounted(() => {
  if (!stations.value.length && !stationsRefreshing.value) {
    radioStore.refreshStations()
  }
})
</script>

<template>
  <main class="mt-8 w-full">
    <h2 class="font-retro text-6xl text-paper-900">国际电台直播</h2>

    <div class="mt-5">
      <LiveVisualStage
        :is-playing="isPlaying && !!currentStationId"
        :has-station="!!currentStationId"
        :program-title="currentStation()?.name || ''"
        :host="currentStation()?.country || ''"
        :listeners="0"
        @toggle="handleToggle"
      >
        <!-- Integrated station panel inside the stage -->
        <div class="station-panel">
          <div class="panel-header">
            <h3 class="panel-title">Global Stations</h3>
            <div class="panel-header-actions">
              <button
                type="button"
                class="panel-refresh-btn"
                :disabled="stationsRefreshing"
                @click="radioStore.refreshStations()"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  class="panel-refresh-icon"
                  :class="{ 'is-spinning': stationsRefreshing }"
                >
                  <path
                    fill-rule="evenodd"
                    d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-2.033l.312.311a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-9.624-2.848a.75.75 0 00.726.943h3.634a.75.75 0 000-1.5H7.615l.312-.311a7 7 0 0111.712 3.138.75.75 0 001.449-.39 5.5 5.5 0 00-9.201-2.466l-.312.311V4.268a.75.75 0 00-1.5 0v3.634a.75.75 0 00.113.674z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>{{ stationsRefreshing ? '更新中...' : '换一批' }}</span>
              </button>
              <span v-if="currentStationId && currentStation()" class="panel-badge">
                <span class="badge-dot" />
                LIVE
              </span>
              <span v-else class="panel-badge panel-badge--idle">
                <span class="badge-dot badge-dot--idle" />
                IDLE
              </span>
            </div>
          </div>

          <!-- Current station info -->
          <div v-if="currentStationId && currentStation()" class="panel-now">
            <p class="now-label">NOW PLAYING</p>
            <p class="now-name">{{ currentStation().name }}</p>
            <p class="now-meta">
              {{ currentStation().country }} · {{ currentStation().codec }}
              {{ currentStation().bitrate }}kbps
            </p>
            <p v-if="currentStation().language" class="now-meta">
              {{ currentStation().language }}
              <span v-if="currentStation().tags">
                · {{ currentStation().tags.split(',').slice(0, 3).join(', ') }}</span
              >
            </p>
            <button type="button" class="now-stop" @click="radioStore.stopStation()">Stop</button>
          </div>
          <div v-else class="panel-hint">Pick a station to start listening</div>

          <!-- Station list -->
          <div class="panel-list">
            <div
              v-for="station in stations.slice(0, 20)"
              :key="station.stationuuid"
              class="station-item"
              :class="{ 'station-item--active': currentStationId === station.stationuuid }"
            >
              <button type="button" class="station-main" @click="radioStore.playStation(station)">
                <div
                  v-if="
                    !station.favicon ||
                    isStationIconBroken(station) ||
                    !isStationIconLoaded(station)
                  "
                  class="station-icon station-icon--fallback"
                >
                  FM
                </div>
                <img
                  v-if="station.favicon && !isStationIconBroken(station)"
                  :src="station.favicon"
                  class="station-icon"
                  :class="
                    isStationIconLoaded(station) ? 'station-icon--show' : 'station-icon--hide'
                  "
                  alt=""
                  loading="lazy"
                  referrerpolicy="no-referrer"
                  @load="markStationIconLoaded(station)"
                  @error="markStationIconBroken(station)"
                />
                <div class="station-info">
                  <p class="station-name">{{ station.name }}</p>
                  <p class="station-meta">{{ station.country }} · {{ station.codec }}</p>
                </div>
              </button>
              <div class="station-actions">
                <button
                  type="button"
                  class="station-action-btn"
                  :class="{
                    'station-action-btn--active': favoriteStations.has(station.stationuuid),
                  }"
                  @click.stop="radioStore.toggleFavoriteStation(station.stationuuid)"
                >
                  {{ favoriteStations.has(station.stationuuid) ? '已收藏' : '收藏' }}
                </button>
                <button
                  type="button"
                  class="station-action-btn"
                  :class="{
                    'station-action-btn--subscribed': subscribedStations.has(station.stationuuid),
                  }"
                  @click.stop="radioStore.toggleSubscribeStation(station.stationuuid)"
                >
                  {{ subscribedStations.has(station.stationuuid) ? '已订阅' : '订阅' }}
                </button>
              </div>
              <span v-if="currentStationId === station.stationuuid" class="station-live-dot" />
            </div>
          </div>
        </div>
      </LiveVisualStage>
    </div>
  </main>
</template>

<style scoped>
/* Station panel inside the visual stage */
.station-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: rgba(15, 9, 5, 0.55);
  backdrop-filter: blur(8px);
  border-left: 1px solid rgba(122, 80, 47, 0.25);
  border-radius: 0 2rem 2rem 0;
  padding: 20px;
}

@media (max-width: 1000px) {
  .station-panel {
    border-left: none;
    border-top: 1px solid rgba(122, 80, 47, 0.25);
    border-radius: 0 0 2rem 2rem;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.panel-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-refresh-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 14px;
  border: 1px solid rgba(122, 80, 47, 0.4);
  background: rgba(60, 35, 18, 0.5);
  color: rgba(250, 244, 232, 0.7);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
}
.panel-refresh-btn:hover {
  background: rgba(80, 45, 25, 0.7);
  color: rgba(250, 244, 232, 0.95);
}
.panel-refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.panel-refresh-icon {
  width: 13px;
  height: 13px;
}
.panel-refresh-icon.is-spinning {
  animation: spin 1s linear infinite;
}

.panel-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 20px;
  font-weight: 700;
  color: rgba(250, 244, 232, 0.85);
}

.panel-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: #e86050;
  background: rgba(164, 59, 42, 0.2);
  border: 1px solid rgba(164, 59, 42, 0.4);
  padding: 3px 10px;
  border-radius: 20px;
  animation: badge-flicker 2s ease-in-out infinite;
}

.panel-badge--idle {
  color: rgba(250, 244, 232, 0.4);
  background: rgba(250, 244, 232, 0.05);
  border-color: rgba(250, 244, 232, 0.15);
  animation: none;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e86050;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

.badge-dot--idle {
  background: rgba(250, 244, 232, 0.3);
  animation: none;
}

/* Current station now-playing card */
.panel-now {
  flex-shrink: 0;
  background: rgba(40, 25, 15, 0.6);
  border: 1px solid rgba(122, 80, 47, 0.3);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
}

.now-label {
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(212, 160, 80, 0.7);
  margin-bottom: 4px;
}

.now-name {
  font-family: 'Noto Serif SC', serif;
  font-size: 16px;
  font-weight: 600;
  color: rgba(250, 244, 232, 0.9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.now-meta {
  font-size: 12px;
  color: rgba(250, 244, 232, 0.4);
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.now-stop {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(250, 244, 232, 0.6);
  background: rgba(80, 40, 25, 0.5);
  border: 1px solid rgba(122, 80, 47, 0.3);
  border-radius: 6px;
  padding: 4px 12px;
  cursor: pointer;
  transition: background 0.2s;
}
.now-stop:hover {
  background: rgba(100, 50, 30, 0.6);
  color: rgba(250, 244, 232, 0.85);
}

.panel-hint {
  font-size: 14px;
  color: rgba(250, 244, 232, 0.35);
  margin-bottom: 12px;
  flex-shrink: 0;
}

/* Station list */
.panel-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 4px;
}

.panel-list::-webkit-scrollbar {
  width: 4px;
}
.panel-list::-webkit-scrollbar-track {
  background: transparent;
}
.panel-list::-webkit-scrollbar-thumb {
  background: rgba(122, 80, 47, 0.3);
  border-radius: 2px;
}

.station-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  transition:
    background 0.2s,
    border-color 0.2s;
}
.station-item:hover {
  background: rgba(100, 60, 30, 0.2);
  border-color: rgba(122, 80, 47, 0.2);
}
.station-item--active {
  background: rgba(120, 70, 35, 0.25);
  border-color: rgba(212, 160, 80, 0.3);
}

.station-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  padding: 2px 0;
}

.station-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.station-action-btn {
  font-size: 11px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 12px;
  border: 1px solid rgba(122, 80, 47, 0.35);
  background: rgba(60, 35, 18, 0.4);
  color: rgba(250, 244, 232, 0.55);
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s,
    border-color 0.2s;
  white-space: nowrap;
}
.station-action-btn:hover {
  background: rgba(80, 45, 25, 0.6);
  color: rgba(250, 244, 232, 0.85);
  border-color: rgba(122, 80, 47, 0.5);
}
.station-action-btn--active {
  background: rgba(212, 160, 80, 0.2);
  border-color: rgba(212, 160, 80, 0.5);
  color: rgba(212, 160, 80, 0.95);
}
.station-action-btn--active:hover {
  background: rgba(212, 160, 80, 0.3);
}
.station-action-btn--subscribed {
  background: rgba(164, 59, 42, 0.2);
  border-color: rgba(164, 59, 42, 0.5);
  color: rgba(232, 96, 80, 0.95);
}
.station-action-btn--subscribed:hover {
  background: rgba(164, 59, 42, 0.3);
}

.station-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.station-icon--hide {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.station-icon--show {
  position: static;
  opacity: 1;
}
.station-icon--fallback {
  background: rgba(120, 70, 35, 0.3);
  color: rgba(212, 160, 80, 0.7);
  display: grid;
  place-content: center;
  font-size: 11px;
  font-weight: 700;
}

.station-info {
  min-width: 0;
  flex: 1;
}

.station-name {
  font-size: 13px;
  font-weight: 500;
  color: rgba(250, 244, 232, 0.8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.station-meta {
  font-size: 11px;
  color: rgba(250, 244, 232, 0.35);
  margin-top: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.station-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #c04030;
  flex-shrink: 0;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

@keyframes badge-flicker {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  52% {
    opacity: 1;
  }
  54% {
    opacity: 0.75;
  }
  56% {
    opacity: 1;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
