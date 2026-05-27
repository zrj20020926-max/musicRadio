<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import FrequencyConsole from '../components/FrequencyConsole.vue'
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

const tags = computed(() => {
  const categories = [...new Set(programs.value.map((p) => p.category).filter(Boolean))]
  return ['全部', ...categories, '收藏']
})

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
  if (!programs.value.length && updateStatus.value !== 'loading') {
    radioStore.updateExternalContent()
  }

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

function clearFilters() {
  activeTag.value = '全部'
  keyword.value = ''
}

const isLivePlaying = computed(() => {
  return isPlaying.value && currentProgram.value?.id === liveProgram.value?.id
})
</script>

<template>
  <main class="archive-page">
    <!-- 1. Archive Header -->
    <header class="archive-header">
      <div class="header-left">
        <h2 class="archive-title">节目档案馆</h2>
        <p class="archive-subtitle">正在整理来自深夜、午后和故事频道的声音档案</p>
      </div>
      <div class="header-right">
        <button
          type="button"
          class="update-btn"
          :disabled="updateStatus === 'loading'"
          @click="handleUpdatePrograms"
        >
          <svg
            v-if="updateStatus === 'loading'"
            class="update-spinner"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <circle cx="12" cy="12" r="9" stroke-dasharray="40 20" />
          </svg>
          <span>{{ updateStatus === 'loading' ? '整理中...' : '更新节目' }}</span>
        </button>
        <p
          v-if="updateMessage"
          class="update-msg"
          :class="{
            'update-msg--ok': updateStatus === 'success',
            'update-msg--err': updateStatus === 'error',
          }"
        >
          {{ updateMessage }}
        </p>
        <p class="header-meta">{{ programs.length }} 个节目 · {{ lastUpdatedAt || '尚未更新' }}</p>
      </div>
    </header>

    <!-- 2. Frequency Console (Live Program) -->
    <FrequencyConsole
      v-if="liveProgram && activeTag !== '收藏'"
      :program="liveProgram"
      :is-playing="isLivePlaying"
      @play="handlePlayNow"
    />

    <!-- 3. Search & Filter -->
    <div class="filter-section">
      <div class="search-box">
        <svg
          class="search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
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
          class="tag-tab"
          :class="{ 'tag-tab--active': activeTag === tag }"
          @click="activeTag = tag"
        >
          {{ tag }}
        </button>
      </div>
    </div>

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
      <div class="empty-visual">
        <svg viewBox="0 0 80 80" fill="none" class="empty-icon">
          <rect
            x="10"
            y="20"
            width="60"
            height="50"
            rx="3"
            stroke="currentColor"
            stroke-width="2"
          />
          <path d="M10 20 L20 8 H60 L70 20" stroke="currentColor" stroke-width="2" fill="none" />
          <line
            x1="28"
            y1="40"
            x2="52"
            y2="40"
            stroke="currentColor"
            stroke-width="1.5"
            opacity="0.4"
          />
          <line
            x1="32"
            y1="48"
            x2="48"
            y2="48"
            stroke="currentColor"
            stroke-width="1.5"
            opacity="0.3"
          />
        </svg>
      </div>
      <p class="empty-title">没有找到匹配的节目档案</p>
      <p class="empty-hint">换个关键词试试，或清空筛选查看全部内容</p>
      <button type="button" class="empty-reset" @click="clearFilters">清空筛选</button>
    </section>

    <!-- 6. Infinite scroll sentinel + loading -->
    <div ref="sentinel" class="scroll-sentinel" />
    <div v-if="loadingMore" class="load-more">
      <div class="load-inner">
        <span
          v-for="i in 5"
          :key="i"
          class="load-bar"
          :style="{ animationDelay: `${i * 0.12}s` }"
        />
      </div>
      <p class="load-text">正在整理更多节目档案...</p>
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

.header-left {
  min-width: 0;
  flex: 1;
}

.archive-title {
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(26px, 3.5vw, 38px);
  font-weight: 700;
  color: #2c1b10;
}

.archive-subtitle {
  margin-top: 4px;
  font-size: 14px;
  color: #704c2b;
}

.header-right {
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
  transition:
    border-color 0.2s,
    transform 0.1s;
}
.update-btn:hover:not(:disabled) {
  border-color: rgba(212, 160, 80, 0.7);
  transform: translateY(-1px);
}
.update-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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
.update-msg--ok {
  color: #1f6b43;
}
.update-msg--err {
  color: #8a2c1d;
}

.header-meta {
  font-size: 12px;
  color: #9a6c3a;
  font-family: 'Courier New', monospace;
}

/* === Filter Section === */
.filter-section {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid rgba(110, 74, 43, 0.3);
  background: rgba(244, 234, 216, 0.6);
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
  gap: 6px;
}

.tag-tab {
  padding: 5px 14px;
  border-radius: 4px;
  border: 1px solid rgba(110, 74, 43, 0.25);
  background: transparent;
  font-size: 13px;
  color: #704c2b;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  position: relative;
}
.tag-tab:hover {
  background: rgba(110, 74, 43, 0.06);
  border-color: rgba(110, 74, 43, 0.4);
}
.tag-tab--active {
  background: #2c1b10;
  border-color: #2c1b10;
  color: #faf4e8;
  box-shadow: 0 2px 6px rgba(44, 27, 16, 0.2);
}

/* === Program Grid === */
.program-grid {
  margin-top: 28px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
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
  border-radius: 1rem;
  border: 1px dashed rgba(110, 74, 43, 0.3);
  background: rgba(244, 234, 216, 0.5);
}

.empty-visual {
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

/* === Loading === */
.scroll-sentinel {
  height: 1px;
  width: 100%;
}

.load-more {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.load-inner {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 24px;
}

.load-bar {
  width: 4px;
  height: 8px;
  border-radius: 2px;
  background: linear-gradient(to top, #7d4f28, #d8b16d);
  animation: load-wave 0.9s ease-in-out infinite alternate;
}
.load-bar:nth-child(1) {
  height: 8px;
}
.load-bar:nth-child(2) {
  height: 16px;
}
.load-bar:nth-child(3) {
  height: 12px;
}
.load-bar:nth-child(4) {
  height: 20px;
}
.load-bar:nth-child(5) {
  height: 10px;
}

.load-text {
  font-size: 13px;
  color: #9a6c3a;
  animation: text-fade 1.5s ease-in-out infinite;
}

/* === Animations === */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes load-wave {
  0% {
    transform: scaleY(0.4);
  }
  50% {
    transform: scaleY(1);
  }
  100% {
    transform: scaleY(0.6);
  }
}

@keyframes text-fade {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
