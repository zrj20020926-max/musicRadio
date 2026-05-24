<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Waveform from '../components/Waveform.vue'
import ProgramCard from '../components/ProgramCard.vue'
import { useRadioStore } from '../stores/radio'

const route = useRoute()
const router = useRouter()
const radioStore = useRadioStore()
const {
  programs,
  subscribed,
  favorites,
  isPlaying,
  playbackStatus,
  currentEpisodeIndex,
  durationLabel,
} = storeToRefs(radioStore)

const program = computed(() => radioStore.getProgramById(route.params.id))
const hasProgram = computed(() => Boolean(program.value))
const episodeList = computed(() => program.value?.episodes || [])
const isCurrentProgram = computed(
  () => program.value && radioStore.currentProgram?.id === program.value.id,
)

const showAllEpisodes = ref(false)
const descExpanded = ref(false)

const visibleEpisodes = computed(() => {
  if (showAllEpisodes.value) return episodeList.value
  return episodeList.value.slice(0, 6)
})

const relatedPrograms = computed(() =>
  programs.value.filter((p) => p.id !== program.value?.id).slice(0, 3),
)

const statusText = computed(() => {
  if (!isCurrentProgram.value) return '点击播放'
  switch (playbackStatus.value) {
    case 'loading':
      return '正在连接...'
    case 'buffering':
      return '缓冲中...'
    case 'playing':
      return '正在播放'
    case 'error':
      return '连接失败'
    default:
      return '已暂停'
  }
})

function formatEpisodeDuration(duration) {
  if (!duration || duration === '直播中') return '00:00'
  const text = String(duration).trim()
  if (/^\d{1,2}:\d{2}$/.test(text)) {
    const [m, s] = text.split(':')
    return `${String(Number.parseInt(m, 10)).padStart(2, '0')}:${String(Number.parseInt(s, 10)).padStart(2, '0')}`
  }
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(text)) {
    const [h, m, s] = text.split(':').map((item) => Number.parseInt(item, 10))
    const minute = h * 60 + m
    return `${String(minute).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return '00:00'
}

function displayDuration(episode, index) {
  if (isCurrentProgram.value && index === currentEpisodeIndex.value) {
    return durationLabel.value
  }
  if (!episode.duration || episode.duration === '直播中') return episode.duration || '--:--'
  return formatEpisodeDuration(episode.duration) || '--:--'
}

function handlePlay() {
  radioStore.togglePlay(program.value.id)
}

function handlePlayEpisode(index) {
  radioStore.playProgram(program.value.id, { episodeIndex: index })
}

function handleSubscribe() {
  radioStore.toggleSubscribe(program.value.id)
}

function handleFavorite() {
  radioStore.toggleFavorite(program.value.id)
}

function goPrograms() {
  router.push('/programs')
}

function goRelatedDetail(id) {
  router.push(`/programs/${id}`)
}

function playRelated(id) {
  radioStore.playProgram(id)
}

function favoriteRelated(id) {
  radioStore.toggleFavorite(id)
}

function subscribeRelated(id) {
  radioStore.toggleSubscribe(id)
}
</script>

<template>
  <main class="detail-page">
    <template v-if="hasProgram">
      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <button type="button" class="crumb-link" @click="goPrograms">节目档案馆</button>
        <span class="crumb-sep">/</span>
        <span class="crumb-current" :title="program.title">{{ program.title }}</span>
      </nav>

      <!-- Two-column layout -->
      <div class="detail-grid">
        <!-- Left Column -->
        <aside class="left-col">
          <!-- Cover Panel -->
          <div class="cover-panel">
            <div class="cover-frame">
              <img
                v-if="program.cover?.image"
                :src="program.cover.image"
                alt=""
                class="cover-img"
              />
              <div v-else class="cover-placeholder">
                <svg viewBox="0 0 64 64" fill="none" class="cover-vinyl">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="1.5" />
                  <circle
                    cx="32"
                    cy="32"
                    r="18"
                    stroke="currentColor"
                    stroke-width="1"
                    opacity="0.4"
                  />
                  <circle cx="32" cy="32" r="8" stroke="currentColor" stroke-width="1.5" />
                  <circle cx="32" cy="32" r="2.5" fill="currentColor" />
                </svg>
                <span class="cover-freq">{{ program.cover?.frequency || 'FM' }}</span>
              </div>
              <div class="cover-gradient" />
              <span v-if="program.isLive || (isCurrentProgram && isPlaying)" class="cover-onair"
                >ON AIR</span
              >
              <!-- Frequency dial decoration -->
              <div class="cover-dial">
                <span v-for="i in 12" :key="i" class="dial-tick" />
              </div>
            </div>
          </div>

          <!-- Playback Control -->
          <div class="control-panel">
            <button
              type="button"
              class="play-btn"
              :class="{ 'play-btn--active': isCurrentProgram && isPlaying }"
              @click="handlePlay"
            >
              <svg
                v-if="!isCurrentProgram || !isPlaying"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="play-icon"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor" class="play-icon">
                <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
              </svg>
            </button>
            <span
              class="control-status"
              :class="{
                'control-status--live': isCurrentProgram && isPlaying,
                'control-status--err': isCurrentProgram && playbackStatus === 'error',
              }"
            >
              {{ statusText }}
            </span>
            <div class="control-wave">
              <Waveform :animated="isCurrentProgram && isPlaying" />
            </div>
          </div>

          <!-- Host Info Card -->
          <div class="host-card">
            <p class="host-label">主播</p>
            <p class="host-name" :title="program.host">{{ program.host }}</p>
            <div class="host-stats">
              <span>{{ episodeList.length }} 集</span>
              <span>{{ program.listeners }} 次收听</span>
            </div>
            <div class="host-tags">
              <span class="host-tag" :title="program.category">{{ program.category }}</span>
              <span v-if="program.source" class="host-tag host-tag--dim">{{ program.source }}</span>
            </div>
          </div>
        </aside>

        <!-- Right Column -->
        <section class="right-col">
          <!-- Header -->
          <div class="detail-header">
            <div class="header-tags">
              <span class="htag" :title="program.category">{{ program.category }}</span>
              <span v-if="program.isLive" class="htag htag--live">LIVE</span>
              <span v-if="program.date" class="htag htag--date">{{ program.date }}</span>
            </div>
            <h1 class="detail-title" :title="program.title">{{ program.title }}</h1>
            <p class="detail-meta">
              {{ program.host }} · {{ program.listeners }} 次收听 · {{ episodeList.length }} 集
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="action-bar">
            <button type="button" class="act-primary" @click="handlePlay">
              <svg viewBox="0 0 16 16" fill="currentColor" class="act-icon">
                <path d="M4 2l10 6-10 6z" />
              </svg>
              <span>{{ isCurrentProgram && isPlaying ? '暂停' : '播放最新' }}</span>
            </button>
            <button
              type="button"
              class="act-secondary"
              :class="{ 'act-secondary--active': subscribed.has(program.id) }"
              @click="handleSubscribe"
            >
              {{ subscribed.has(program.id) ? '已订阅' : '订阅' }}
            </button>
            <button
              type="button"
              class="act-secondary"
              :class="{ 'act-secondary--active': favorites.has(program.id) }"
              @click="handleFavorite"
            >
              {{ favorites.has(program.id) ? '已收藏' : '收藏' }}
            </button>
          </div>

          <!-- Description -->
          <div class="desc-section">
            <h3 class="section-title">节目简介</h3>
            <div
              v-if="program.description"
              class="desc-body"
              :class="{ 'desc-body--expanded': descExpanded }"
            >
              <p class="desc-text">{{ program.description }}</p>
            </div>
            <p v-else class="desc-empty">暂无节目简介</p>
            <button
              v-if="program.description && program.description.length > 120"
              type="button"
              class="desc-toggle"
              @click="descExpanded = !descExpanded"
            >
              {{ descExpanded ? '收起' : '展开全部' }}
            </button>
          </div>

          <!-- Episode Timeline -->
          <div class="episode-section">
            <h3 class="section-title">节目单</h3>
            <ul v-if="episodeList.length" class="episode-list">
              <li
                v-for="(episode, index) in visibleEpisodes"
                :key="episode.id"
                class="ep-item"
                :class="{ 'ep-item--active': isCurrentProgram && index === currentEpisodeIndex }"
              >
                <div class="ep-left">
                  <span
                    class="ep-dot"
                    :class="{
                      'ep-dot--active': isCurrentProgram && index === currentEpisodeIndex,
                      'ep-dot--live': episode.duration === '直播中',
                    }"
                  />
                  <span class="ep-date">{{ episode.pubDate || '--' }}</span>
                  <button
                    type="button"
                    class="ep-title"
                    :title="episode.title"
                    @click="handlePlayEpisode(index)"
                  >
                    {{ episode.title }}
                  </button>
                </div>
                <div class="ep-right">
                  <div
                    v-if="isCurrentProgram && index === currentEpisodeIndex && isPlaying"
                    class="ep-wave"
                  >
                    <span
                      v-for="i in 3"
                      :key="i"
                      class="ep-wave-bar"
                      :style="{ animationDelay: `${i * 0.15}s` }"
                    />
                  </div>
                  <span
                    class="ep-duration"
                    :class="{ 'ep-duration--live': episode.duration === '直播中' }"
                  >
                    {{ displayDuration(episode, index) }}
                  </span>
                  <button
                    type="button"
                    class="ep-play-btn"
                    @click="handlePlayEpisode(index)"
                    title="播放"
                  >
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2l10 6-10 6z" /></svg>
                  </button>
                </div>
              </li>
            </ul>
            <p v-else class="ep-empty">暂无单集内容</p>
            <button
              v-if="episodeList.length > 6 && !showAllEpisodes"
              type="button"
              class="ep-expand"
              @click="showAllEpisodes = true"
            >
              展开全部 ({{ episodeList.length }} 集)
            </button>
            <button
              v-if="showAllEpisodes && episodeList.length > 6"
              type="button"
              class="ep-expand"
              @click="showAllEpisodes = false"
            >
              收起
            </button>
          </div>
        </section>
      </div>

      <!-- Related Programs -->
      <section v-if="relatedPrograms.length >= 2" class="related-section">
        <h3 class="section-title">相关节目</h3>
        <div class="related-grid">
          <ProgramCard
            v-for="rp in relatedPrograms"
            :key="rp.id"
            :program="rp"
            :is-active="radioStore.currentProgram?.id === rp.id && isPlaying"
            :is-favorite="favorites.has(rp.id)"
            :is-subscribed="subscribed.has(rp.id)"
            @play="playRelated"
            @detail="goRelatedDetail"
            @favorite="favoriteRelated"
            @subscribe="subscribeRelated"
          />
        </div>
      </section>
    </template>

    <!-- Not Found -->
    <section v-else class="not-found">
      <svg viewBox="0 0 80 80" fill="none" class="nf-icon">
        <rect x="10" y="20" width="60" height="50" rx="3" stroke="currentColor" stroke-width="2" />
        <path d="M10 20 L20 8 H60 L70 20" stroke="currentColor" stroke-width="2" fill="none" />
        <line
          x1="30"
          y1="42"
          x2="50"
          y2="42"
          stroke="currentColor"
          stroke-width="1.5"
          opacity="0.4"
        />
        <line
          x1="34"
          y1="50"
          x2="46"
          y2="50"
          stroke="currentColor"
          stroke-width="1.5"
          opacity="0.3"
        />
      </svg>
      <h2 class="nf-title">这份节目档案暂时缺页了</h2>
      <p class="nf-hint">请返回节目列表继续收听</p>
      <button type="button" class="nf-back" @click="goPrograms">返回档案馆</button>
    </section>
  </main>
</template>

<style scoped>
.detail-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 32px 160px;
}

/* === Breadcrumb === */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}
.crumb-link {
  font-size: 14px;
  color: #9a6c3a;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}
.crumb-link:hover {
  color: #704c2b;
}
.crumb-sep {
  font-size: 13px;
  color: #9a6c3a;
  opacity: 0.5;
}
.crumb-current {
  font-size: 14px;
  color: #2c1b10;
  font-weight: 500;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* === Grid === */
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.38fr) minmax(0, 0.62fr);
  gap: 32px;
  align-items: start;
}
@media (max-width: 1024px) {
  .detail-grid {
    grid-template-columns: minmax(0, 0.42fr) minmax(0, 0.58fr);
    gap: 24px;
  }
}

/* === Left Column === */
.left-col {
  position: sticky;
  top: 100px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Cover Panel */
.cover-panel {
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid rgba(180, 130, 70, 0.35);
  background: linear-gradient(135deg, #1c1210, #2a1a12);
}
.cover-frame {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
}
.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #0f0a07, #1c1210);
}
.cover-vinyl {
  width: 80px;
  height: 80px;
  color: rgba(180, 130, 70, 0.4);
  animation: vinyl-spin 8s linear infinite;
}
.cover-freq {
  font-size: 12px;
  font-family: 'Courier New', monospace;
  color: rgba(180, 130, 70, 0.5);
  letter-spacing: 0.12em;
}
.cover-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(10, 6, 4, 0.5), transparent 50%);
  pointer-events: none;
}
.cover-onair {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 3px 10px;
  border-radius: 4px;
  background: rgba(164, 59, 42, 0.9);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #faf4e8;
  box-shadow: 0 0 8px rgba(164, 59, 42, 0.4);
  animation: onair-blink 2s ease-in-out infinite;
}
.cover-dial {
  position: absolute;
  bottom: 12px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.dial-tick {
  width: 1px;
  height: 6px;
  background: rgba(180, 130, 70, 0.35);
  border-radius: 1px;
}
.dial-tick:nth-child(3n) {
  height: 10px;
  background: rgba(180, 130, 70, 0.5);
}

/* Control Panel */
.control-panel {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 0.8rem;
  background: #1c1210;
  border: 1px solid rgba(80, 55, 30, 0.4);
}
.play-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: grid;
  place-content: center;
  background: linear-gradient(135deg, #3a2418, #241610);
  border: 2px solid rgba(180, 130, 70, 0.5);
  color: rgba(250, 244, 232, 0.9);
  cursor: pointer;
  flex-shrink: 0;
  transition:
    border-color 0.2s,
    transform 0.1s;
}
.play-btn:hover {
  border-color: rgba(212, 160, 80, 0.7);
  transform: scale(1.05);
}
.play-btn--active {
  border-color: rgba(196, 64, 48, 0.6);
}
.play-icon {
  width: 18px;
  height: 18px;
}
.control-status {
  font-size: 12px;
  color: rgba(250, 244, 232, 0.5);
  white-space: nowrap;
}
.control-status--live {
  color: rgba(120, 200, 120, 0.8);
}
.control-status--err {
  color: rgba(196, 64, 48, 0.8);
}
.control-wave {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  max-height: 32px;
  transform: scale(0.5);
  transform-origin: left center;
}

/* Host Card */
.host-card {
  padding: 14px 16px;
  border-radius: 0.8rem;
  background: rgba(244, 234, 216, 0.9);
  border: 1px solid rgba(110, 74, 43, 0.25);
}
.host-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: #9a6c3a;
  text-transform: uppercase;
}
.host-name {
  margin-top: 4px;
  font-family: 'Noto Serif SC', serif;
  font-size: 16px;
  font-weight: 600;
  color: #2c1b10;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.host-stats {
  margin-top: 8px;
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #9a6c3a;
}
.host-tags {
  margin-top: 8px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.host-tag {
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(110, 74, 43, 0.25);
  font-size: 11px;
  color: #9a6c3a;
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.host-tag--dim {
  opacity: 0.6;
}

/* === Right Column === */
.right-col {
  min-width: 0;
}

/* Header */
.detail-header {
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(110, 74, 43, 0.15);
}
.header-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.htag {
  padding: 3px 10px;
  border-radius: 4px;
  border: 1px solid rgba(110, 74, 43, 0.25);
  font-size: 11px;
  color: #9a6c3a;
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.htag--live {
  background: rgba(164, 59, 42, 0.9);
  border-color: rgba(164, 59, 42, 0.9);
  color: #faf4e8;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.htag--date {
  font-family: 'Courier New', monospace;
  opacity: 0.7;
}
.detail-title {
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(24px, 3.5vw, 34px);
  font-weight: 700;
  color: #2c1b10;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}
.detail-meta {
  margin-top: 8px;
  font-size: 14px;
  color: #704c2b;
}

/* Action Bar */
.action-bar {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.act-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 8px;
  background: #2c1b10;
  border: none;
  color: #faf4e8;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background 0.15s,
    transform 0.1s;
}
.act-primary:hover {
  background: #3a2418;
  transform: translateY(-1px);
}
.act-icon {
  width: 14px;
  height: 14px;
}
.act-secondary {
  padding: 9px 16px;
  border-radius: 8px;
  border: 1px solid rgba(110, 74, 43, 0.35);
  background: transparent;
  font-size: 14px;
  color: #704c2b;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;
  transition: all 0.15s;
}
.act-secondary:hover {
  border-color: rgba(110, 74, 43, 0.6);
  background: rgba(110, 74, 43, 0.05);
}
.act-secondary--active {
  background: rgba(180, 130, 70, 0.1);
  border-color: rgba(180, 130, 70, 0.5);
  color: #9a6c3a;
}

/* Section Title */
.section-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 18px;
  font-weight: 600;
  color: #2c1b10;
  margin-bottom: 12px;
}

/* Description */
.desc-section {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid rgba(110, 74, 43, 0.1);
}
.desc-body {
  position: relative;
}
.desc-text {
  font-size: 14px;
  line-height: 1.7;
  color: #4c321e;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}
.desc-body--expanded .desc-text {
  display: block;
  -webkit-line-clamp: unset;
}
.desc-empty {
  font-size: 14px;
  color: #9a6c3a;
  opacity: 0.7;
  font-style: italic;
}
.desc-toggle {
  margin-top: 8px;
  font-size: 13px;
  color: #9a6c3a;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}
.desc-toggle:hover {
  color: #704c2b;
}

/* Episode Section */
.episode-section {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid rgba(110, 74, 43, 0.1);
}
.episode-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ep-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  border-left: 3px solid transparent;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.ep-item:hover {
  background: rgba(244, 234, 216, 0.6);
}
.ep-item--active {
  background: rgba(244, 234, 216, 0.8);
  border-left-color: rgba(180, 130, 70, 0.7);
}
.ep-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}
.ep-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d2ac70;
  flex-shrink: 0;
}
.ep-dot--active {
  background: #c28f4e;
  box-shadow: 0 0 4px rgba(194, 143, 78, 0.5);
}
.ep-dot--live {
  background: #a43b2a;
  box-shadow: 0 0 4px rgba(164, 59, 42, 0.4);
}
.ep-date {
  font-size: 12px;
  font-family: 'Courier New', monospace;
  color: #9a6c3a;
  opacity: 0.7;
  white-space: nowrap;
  flex-shrink: 0;
}
.ep-title {
  font-size: 14px;
  font-weight: 500;
  color: #2c1b10;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  transition: color 0.15s;
}
.ep-title:hover {
  color: #9a6c3a;
}
.ep-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.ep-wave {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
}
.ep-wave-bar {
  width: 2px;
  height: 4px;
  border-radius: 1px;
  background: rgba(180, 130, 70, 0.8);
  animation: ep-bounce 0.6s ease-in-out infinite alternate;
}
.ep-wave-bar:nth-child(1) {
  height: 5px;
}
.ep-wave-bar:nth-child(2) {
  height: 10px;
}
.ep-wave-bar:nth-child(3) {
  height: 7px;
}
.ep-duration {
  font-size: 12px;
  font-family: 'Courier New', monospace;
  color: #9a6c3a;
  white-space: nowrap;
}
.ep-duration--live {
  color: #a43b2a;
  font-weight: 600;
}
.ep-play-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: grid;
  place-content: center;
  background: rgba(44, 27, 16, 0.08);
  border: 1px solid rgba(110, 74, 43, 0.25);
  color: #704c2b;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.ep-play-btn svg {
  width: 10px;
  height: 10px;
}
.ep-play-btn:hover {
  background: rgba(44, 27, 16, 0.15);
  border-color: rgba(110, 74, 43, 0.5);
}
.ep-empty {
  font-size: 14px;
  color: #9a6c3a;
  opacity: 0.7;
  font-style: italic;
}
.ep-expand {
  margin-top: 12px;
  font-size: 13px;
  color: #9a6c3a;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.15s;
}
.ep-expand:hover {
  color: #704c2b;
}

/* === Related === */
.related-section {
  margin-top: 48px;
  padding-top: 28px;
  border-top: 1px solid rgba(110, 74, 43, 0.15);
}
.related-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

/* === Not Found === */
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 24px;
  text-align: center;
}
.nf-icon {
  width: 64px;
  height: 64px;
  color: #9a6c3a;
  opacity: 0.5;
  margin-bottom: 16px;
}
.nf-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 22px;
  font-weight: 600;
  color: #2c1b10;
}
.nf-hint {
  margin-top: 6px;
  font-size: 14px;
  color: #9a6c3a;
}
.nf-back {
  margin-top: 20px;
  padding: 10px 24px;
  border-radius: 8px;
  background: #2c1b10;
  border: none;
  color: #faf4e8;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.nf-back:hover {
  background: #3a2418;
}

/* === Animations === */
@keyframes vinyl-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes onair-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
@keyframes ep-bounce {
  0% {
    transform: scaleY(0.5);
  }
  100% {
    transform: scaleY(1.4);
  }
}
</style>
