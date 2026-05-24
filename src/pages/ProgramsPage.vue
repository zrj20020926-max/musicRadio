<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Waveform from '../components/Waveform.vue'
import ProgramCard from '../components/ProgramCard.vue'
import { useRadioStore } from '../stores/radio'

const router = useRouter()
const radioStore = useRadioStore()
const {
  programs,
  currentProgram,
  isPlaying,
  liveProgram,
  favorites,
  subscribed,
  updateStatus,
  updateMessage,
  lastUpdatedAt,
  loadingMore,
} = storeToRefs(radioStore)

const activeTag = ref('全部')
const keyword = ref('')
const tags = ['全部', '早安', '午后', '深夜', '故事', '音乐', '收藏']

const filteredItems = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase()

  return programs.value.filter((item) => {
    if (activeTag.value === '收藏') {
      if (!favorites.value.has(item.id)) return false
    } else if (activeTag.value !== '全部') {
      const tag = activeTag.value.toLowerCase()
      const fields = [item.category, item.title, item.description, item.host].filter(Boolean)
      const matchTag = fields.some((f) => String(f).toLowerCase().includes(tag))
      if (!matchTag) return false
    }

    if (!normalizedKeyword) return true

    return [item.title, item.host, item.category, item.description]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(normalizedKeyword))
  })
})

const sentinel = ref(null)
let observer = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !loadingMore.value) {
        radioStore.loadMorePrograms()
      }
    },
    { rootMargin: '200px' },
  )
  if (sentinel.value) observer.observe(sentinel.value)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})

function goProgramDetail(programId) {
  router.push(`/programs/${programId}`)
}

async function handleUpdatePrograms() {
  await radioStore.updateExternalContent()
}

function handlePlayNow(programId) {
  radioStore.playProgram(programId)
}

function handleFavorite(programId) {
  radioStore.toggleFavorite(programId)
}

function handleSubscribe(programId) {
  radioStore.toggleSubscribe(programId)
}
</script>

<template>
  <main class="archive-page">
    <!-- 1. Archive Header -->
    <header class="archive-header">
      <div class="min-w-0 flex-1">
        <h2 class="archive-title">节目档案馆</h2>
        <p class="archive-subtitle">收录正在直播与往期节目档案</p>
        <p class="archive-stats">
          共 {{ programs.length }} 个节目 · 上次更新：{{ lastUpdatedAt || '尚未更新' }}
        </p>
      </div>
      <div class="header-actions">
        <button
          type="button"
          class="update-btn"
          :class="{ 'update-btn--loading': updateStatus === 'loading' }"
          :disabled="updateStatus === 'loading'"
          @click="handleUpdatePrograms"
        >
          <svg v-if="updateStatus === 'loading'" class="update-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="9" stroke-dasharray="40 20" />
          </svg>
          <span>{{ updateStatus === 'loading' ? '整理档案中...' : '更新节目' }}</span>
        </button>
        <p v-if="updateMessage" class="update-msg" :class="{ 'update-msg--ok': updateStatus === 'success', 'update-msg--err': updateStatus === 'error' }">
          {{ updateMessage }}
        </p>
      </div>
    </header>

    <!-- 2. Filter Bar -->
    <div class="filter-bar">
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" stroke-linecap="round" />
        </svg>
        <input
          v-model="keyword"
          type="text"
          class="search-input"
          placeholder="检索节目 / 主播 / 分类..."
        />
      </div>
      <div class="tag-row">
        <button
          v-for="tag in tags"
          :key="tag"
          type="button"
          class="tag-pill"
          :class="{ 'tag-pill--active': activeTag === tag }"
          @click="activeTag = tag"
        >
          {{ tag }}
        </button>
      </div>
    </div>

    <!-- 3. NOW BROADCASTING Hero -->
    <section v-if="liveProgram && activeTag !== '收藏'" class="hero-broadcast">
      <div class="hero-cover">
        <img
          v-if="liveProgram.cover?.image"
          :src="liveProgram.cover.image"
          alt=""
          class="hero-cover-img"
        />
        <div v-else class="hero-cover-placeholder">
          <svg viewBox="0 0 64 64" fill="none" class="hero-radio-icon">
            <rect x="8" y="20" width="48" height="32" rx="4" stroke="currentColor" stroke-width="2" />
            <circle cx="24" cy="36" r="8" stroke="currentColor" stroke-width="2" />
            <rect x="38" y="28" width="12" height="3" rx="1.5" fill="currentColor" opacity="0.5" />
            <rect x="38" y="34" width="12" height="3" rx="1.5" fill="currentColor" opacity="0.5" />
            <rect x="38" y="40" width="8" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
            <path d="M20 20 L28 8 L30 8 L24 20" fill="currentColor" opacity="0.6" />
          </svg>
        </div>
        <div class="hero-cover-overlay" />
        <span class="hero-onair-badge">ON AIR</span>
      </div>
      <div class="hero-info">
        <p class="hero-label">正在直播</p>
        <h3 class="hero-title" :title="liveProgram.title">{{ liveProgram.title }}</h3>
        <p class="hero-host">{{ liveProgram.host }}</p>
        <div class="hero-meta">
          <span class="hero-listeners">
            <span class="hero-dot" />
            {{ liveProgram.listeners }} 收听
          </span>
          <span class="hero-category">{{ liveProgram.category }}</span>
        </div>
        <Waveform :animated="isPlaying && currentProgram?.id === liveProgram.id" />
        <button
          type="button"
          class="hero-play-btn"
          @click="handlePlayNow(liveProgram.id)"
        >
          {{ isPlaying && currentProgram?.id === liveProgram.id ? '暂停' : '立即收听' }}
        </button>
      </div>
    </section>

    <!-- 4. Program Grid -->
    <section v-if="filteredItems.length" class="program-grid">
      <ProgramCard
        v-for="item in filteredItems"
        :key="item.id"
        :program="item"
        :is-active="currentProgram?.id === item.id && isPlaying"
        :is-favorite="favorites.has(item.id)"
        :is-subscribed="subscribed.has(item.id)"
        @play="handlePlayNow"
        @detail="goProgramDetail"
        @favorite="handleFavorite"
        @subscribe="handleSubscribe"
      />
    </section>

    <!-- 5. Empty State -->
    <section v-else class="empty-state">
      <div class="empty-folder">
        <svg viewBox="0 0 80 80" fill="none" class="empty-icon">
          <rect x="10" y="20" width="60" height="50" rx="3" stroke="currentColor" stroke-width="2" />
          <path d="M10 20 L20 8 H60 L70 20" stroke="currentColor" stroke-width="2" fill="none" />
          <line x1="28" y1="40" x2="52" y2="40" stroke="currentColor" stroke-width="1.5" opacity="0.4" />
          <line x1="32" y1="48" x2="48" y2="48" stroke="currentColor" stroke-width="1.5" opacity="0.3" />
        </svg>
      </div>
      <p class="empty-title">没有找到匹配的节目档案</p>
      <p class="empty-hint">换个关键词试试，或清空筛选查看全部内容</p>
      <button type="button" class="empty-reset" @click="activeTag = '全部'; keyword = ''">
        清空筛选
      </button>
    </section>

    <!-- 6. Infinite scroll sentinel + loading -->
    <div ref="sentinel" class="scroll-sentinel" />
    <div v-if="loadingMore" class="load-more">
      <div class="load-more-inner">
        <div class="load-spinner">
          <span v-for="i in 5" :key="i" class="spinner-bar" :style="{ animationDelay: `${i * 0.12}s` }" />
        </div>
        <p class="load-text">正在整理更多节目档案...</p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.archive-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 32px 160px;
}

/* === Header === */
.archive-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(110, 74, 43, 0.2);
}
.archive-title {
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  color: #2c1b10;
}
.archive-subtitle {
  margin-top: 4px;
  font-size: 15px;
  color: #704c2b;
}
.archive-stats {
  margin-top: 6px;
  font-size: 13px;
  color: #9a6c3a;
  font-family: 'Courier New', monospace;
}
.header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}
.update-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  background: linear-gradient(to bottom, #3a2418, #2c1b10);
  border: 1px solid rgba(180, 130, 70, 0.4);
  color: rgba(250, 244, 232, 0.9);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.1s;
}
.update-btn:hover:not(:disabled) {
  border-color: rgba(212, 160, 80, 0.7);
  transform: translateY(-1px);
}
.update-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.update-btn--loading {
  border-color: rgba(212, 160, 80, 0.5);
}
.update-spinner {
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}
.update-msg {
  font-size: 12px;
  color: #704c2b;
}
.update-msg--ok { color: #1f6b43; }
.update-msg--err { color: #8a2c1d; }

/* === Filter Bar === */
.filter-bar {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(110, 74, 43, 0.35);
  background: rgba(244, 234, 216, 0.7);
  transition: border-color 0.2s;
}
.search-box:focus-within {
  border-color: rgba(180, 130, 70, 0.6);
}
.search-icon {
  width: 18px;
  height: 18px;
  color: #9a6c3a;
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-size: 15px;
  color: #2c1b10;
  outline: none;
}
.search-input::placeholder {
  color: #9a6c3a;
  opacity: 0.7;
}
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag-pill {
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid rgba(110, 74, 43, 0.35);
  background: transparent;
  font-size: 14px;
  color: #704c2b;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.tag-pill:hover {
  background: rgba(110, 74, 43, 0.08);
  border-color: rgba(110, 74, 43, 0.5);
}
.tag-pill--active {
  background: #2c1b10;
  border-color: #2c1b10;
  color: #faf4e8;
}

/* === Hero Broadcast === */
.hero-broadcast {
  margin-top: 28px;
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 28px;
  padding: 24px;
  border-radius: 1.2rem;
  background:
    repeating-linear-gradient(
      90deg,
      rgba(80, 50, 30, 0.03) 0px,
      rgba(80, 50, 30, 0.06) 2px,
      transparent 2px,
      transparent 8px
    ),
    repeating-linear-gradient(
      0deg,
      rgba(60, 35, 20, 0.02) 0px,
      rgba(60, 35, 20, 0.04) 1px,
      transparent 1px,
      transparent 12px
    ),
    linear-gradient(135deg, #3a2618 0%, #2c1b10 40%, #3a2418 70%, #2a1812 100%);
  border: 1px solid rgba(180, 130, 70, 0.35);
  box-shadow: 0 8px 32px rgba(30, 15, 8, 0.2), inset 0 1px 0 rgba(180, 130, 70, 0.08);
}
.hero-cover {
  position: relative;
  border-radius: 0.8rem;
  overflow: hidden;
  aspect-ratio: 1;
  border: 2px solid rgba(180, 130, 70, 0.4);
}
.hero-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hero-cover-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-content: center;
  background: linear-gradient(135deg, #0f0a07, #1a1210);
}
.hero-radio-icon {
  width: 64px;
  height: 64px;
  color: rgba(180, 130, 70, 0.5);
}
.hero-cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(10, 6, 4, 0.5), transparent 60%);
}
.hero-onair-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 3px 10px;
  border-radius: 4px;
  background: rgba(164, 59, 42, 0.9);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #faf4e8;
  box-shadow: 0 0 8px rgba(164, 59, 42, 0.4);
  animation: onair-pulse 2s ease-in-out infinite;
}
.hero-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  gap: 6px;
}
.hero-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: rgba(196, 64, 48, 0.8);
  text-transform: uppercase;
}
.hero-title {
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(22px, 3vw, 30px);
  font-weight: 700;
  color: rgba(250, 244, 232, 0.95);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hero-host {
  font-size: 15px;
  color: rgba(250, 244, 232, 0.5);
}
.hero-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}
.hero-listeners {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: rgba(250, 244, 232, 0.6);
}
.hero-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(120, 200, 120, 0.8);
  box-shadow: 0 0 4px rgba(120, 200, 120, 0.4);
}
.hero-category {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(180, 130, 70, 0.15);
  border: 1px solid rgba(180, 130, 70, 0.3);
  color: rgba(250, 244, 232, 0.5);
}
.hero-play-btn {
  margin-top: 12px;
  align-self: flex-start;
  padding: 10px 24px;
  border-radius: 8px;
  background: linear-gradient(to bottom, #4a3020, #3a2418);
  border: 1px solid rgba(180, 130, 70, 0.5);
  color: rgba(250, 244, 232, 0.9);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.1s;
}
.hero-play-btn:hover {
  border-color: rgba(212, 160, 80, 0.7);
  transform: translateY(-1px);
}

/* === Program Grid === */
.program-grid {
  margin-top: 28px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
@media (min-width: 1280px) {
  .program-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* === Empty State === */
.empty-state {
  margin-top: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  border-radius: 1.2rem;
  border: 1px dashed rgba(110, 74, 43, 0.3);
  background: rgba(244, 234, 216, 0.5);
}
.empty-folder {
  margin-bottom: 16px;
}
.empty-icon {
  width: 64px;
  height: 64px;
  color: #9a6c3a;
  opacity: 0.5;
}
.empty-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 20px;
  font-weight: 600;
  color: #2c1b10;
}
.empty-hint {
  margin-top: 6px;
  font-size: 14px;
  color: #9a6c3a;
}
.empty-reset {
  margin-top: 16px;
  padding: 8px 20px;
  border-radius: 6px;
  border: 1px solid rgba(110, 74, 43, 0.4);
  background: transparent;
  font-size: 14px;
  color: #704c2b;
  cursor: pointer;
  transition: background 0.15s;
}
.empty-reset:hover {
  background: rgba(110, 74, 43, 0.08);
}

/* === Animations === */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes onair-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* === Infinite scroll loading === */
.scroll-sentinel {
  height: 1px;
  width: 100%;
}
.load-more {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}
.load-more-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 40px;
  border-radius: 1rem;
  background: rgba(244, 234, 216, 0.6);
  border: 1px solid rgba(110, 74, 43, 0.2);
}
.load-spinner {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 24px;
}
.spinner-bar {
  width: 4px;
  border-radius: 2px;
  background: linear-gradient(to top, #7d4f28, #d8b16d);
  animation: spinner-wave 0.9s ease-in-out infinite alternate;
}
.spinner-bar:nth-child(1) { height: 8px; }
.spinner-bar:nth-child(2) { height: 16px; }
.spinner-bar:nth-child(3) { height: 12px; }
.spinner-bar:nth-child(4) { height: 20px; }
.spinner-bar:nth-child(5) { height: 10px; }
.load-text {
  font-size: 13px;
  color: #9a6c3a;
  animation: text-fade 1.5s ease-in-out infinite;
}
@keyframes spinner-wave {
  0% { transform: scaleY(0.4); }
  50% { transform: scaleY(1); }
  100% { transform: scaleY(0.6); }
}
@keyframes text-fade {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
