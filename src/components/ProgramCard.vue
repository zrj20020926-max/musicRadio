<script setup>
const props = defineProps({
  program: { type: Object, required: true },
  isSubscribed: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
})

const emit = defineEmits(['play', 'subscribe', 'favorite', 'detail'])
</script>

<template>
  <article class="archive-card" :class="{ 'archive-card--active': isActive }">
    <!-- Cover Area -->
    <div class="card-cover">
      <img
        v-if="props.program.cover?.image"
        :src="props.program.cover.image"
        alt=""
        class="cover-img"
      />
      <div v-else class="cover-placeholder">
        <svg viewBox="0 0 48 48" fill="none" class="cover-icon">
          <circle cx="24" cy="24" r="14" stroke="currentColor" stroke-width="1.5" />
          <circle cx="24" cy="24" r="5" stroke="currentColor" stroke-width="1.5" />
          <circle cx="24" cy="24" r="1.5" fill="currentColor" />
          <path d="M24 10 V6 M24 42 V38" stroke="currentColor" stroke-width="1" opacity="0.4" />
          <path d="M10 24 H6 M42 24 H38" stroke="currentColor" stroke-width="1" opacity="0.4" />
        </svg>
        <div class="cover-freq">{{ props.program.cover?.frequency || 'FM' }}</div>
      </div>
      <div class="cover-overlay" />
      <!-- ON AIR badge -->
      <span v-if="props.program.isLive" class="card-onair">LIVE</span>
      <!-- Active waveform bars -->
      <div v-if="isActive" class="card-wave">
        <span
          v-for="i in 4"
          :key="i"
          class="wave-bar"
          :style="{ animationDelay: `${i * 0.12}s` }"
        />
      </div>
    </div>

    <!-- Info Area -->
    <div class="card-body">
      <!-- Tag + Date row -->
      <div class="card-tag-row">
        <span class="card-category" :title="props.program.category">{{
          props.program.category
        }}</span>
        <span v-if="props.program.date" class="card-date">{{ props.program.date }}</span>
      </div>

      <!-- Title -->
      <button
        type="button"
        class="card-title"
        :title="props.program.title"
        @click="emit('detail', props.program.id)"
      >
        {{ props.program.title }}
      </button>

      <!-- Host -->
      <p class="card-host" :title="props.program.host">{{ props.program.host }}</p>

      <!-- Description -->
      <p class="card-desc" :title="props.program.description">{{ props.program.description }}</p>

      <!-- Stats -->
      <div class="card-stats">
        <span>{{ props.program.listeners }} 收听</span>
        <span v-if="props.program.episodes?.length">{{ props.program.episodes.length }} 集</span>
      </div>

      <!-- Actions -->
      <div class="card-actions">
        <button type="button" class="action-play" @click="emit('play', props.program.id)">
          <svg viewBox="0 0 16 16" fill="currentColor" class="action-icon">
            <path d="M4 2l10 6-10 6z" />
          </svg>
          <span>播放</span>
        </button>
        <button type="button" class="action-detail" @click="emit('detail', props.program.id)">
          详情
        </button>
        <button
          type="button"
          class="action-fav"
          :class="{ 'action-fav--active': props.isFavorite }"
          @click="emit('favorite', props.program.id)"
          :title="props.isFavorite ? '取消收藏' : '收藏'"
        >
          收藏
        </button>
        <button
          type="button"
          class="action-sub"
          :class="{ 'action-sub--active': props.isSubscribed }"
          @click="emit('subscribe', props.program.id)"
        >
          {{ props.isSubscribed ? '已订阅' : '订阅' }}
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.archive-card {
  display: flex;
  flex-direction: column;
  border-radius: 1rem;
  border: 1px solid rgba(110, 74, 43, 0.3);
  background: rgba(244, 234, 216, 0.9);
  overflow: hidden;
  transition:
    transform 0.15s,
    border-color 0.15s,
    box-shadow 0.15s;
}
.archive-card:hover {
  transform: translateY(-2px);
  border-color: rgba(110, 74, 43, 0.5);
  box-shadow: 0 6px 20px rgba(60, 40, 20, 0.12);
}
.archive-card--active {
  border-color: rgba(180, 130, 70, 0.6);
  box-shadow:
    0 0 0 2px rgba(180, 130, 70, 0.15),
    0 6px 20px rgba(60, 40, 20, 0.1);
}

/* --- Cover --- */
.card-cover {
  position: relative;
  height: 140px;
  background: linear-gradient(135deg, #1c1210, #2a1a12);
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
  gap: 6px;
}
.cover-icon {
  width: 48px;
  height: 48px;
  color: rgba(180, 130, 70, 0.4);
}
.cover-freq {
  font-size: 11px;
  font-family: 'Courier New', monospace;
  color: rgba(180, 130, 70, 0.5);
  letter-spacing: 0.1em;
}
.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(10, 6, 4, 0.4), transparent 50%);
  pointer-events: none;
}
.card-onair {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  border-radius: 3px;
  background: rgba(164, 59, 42, 0.9);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #faf4e8;
  box-shadow: 0 0 6px rgba(164, 59, 42, 0.4);
}
.card-wave {
  position: absolute;
  bottom: 8px;
  left: 12px;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 16px;
}
.wave-bar {
  width: 3px;
  height: 4px;
  border-radius: 1px;
  background: rgba(212, 160, 80, 0.85);
  animation: wave-bounce 0.7s ease-in-out infinite alternate;
}
.wave-bar:nth-child(1) {
  height: 6px;
}
.wave-bar:nth-child(2) {
  height: 12px;
}
.wave-bar:nth-child(3) {
  height: 8px;
}
.wave-bar:nth-child(4) {
  height: 14px;
}

/* --- Body --- */
.card-body {
  display: flex;
  flex-direction: column;
  padding: 14px 16px 16px;
  min-width: 0;
  flex: 1;
}

.card-tag-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.card-category {
  display: inline-block;
  max-width: 120px;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(110, 74, 43, 0.25);
  font-size: 11px;
  color: #9a6c3a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-date {
  font-size: 11px;
  color: #9a6c3a;
  opacity: 0.7;
  font-family: 'Courier New', monospace;
  flex-shrink: 0;
}

.card-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 16px;
  font-weight: 600;
  color: #2c1b10;
  text-align: left;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.15s;
}
.card-title:hover {
  color: #9a6c3a;
}

.card-host {
  margin-top: 3px;
  font-size: 13px;
  color: #704c2b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-desc {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.5;
  color: #9a6c3a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.card-stats {
  margin-top: 8px;
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #9a6c3a;
  opacity: 0.8;
}

/* --- Actions --- */
.card-actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.action-play {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 6px;
  background: #2c1b10;
  border: none;
  color: #faf4e8;
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}
.action-play:hover {
  background: #3a2418;
}
.action-icon {
  width: 12px;
  height: 12px;
}
.action-detail {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(110, 74, 43, 0.35);
  background: transparent;
  font-size: 13px;
  color: #704c2b;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}
.action-detail:hover {
  background: rgba(110, 74, 43, 0.06);
}
.action-fav {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(110, 74, 43, 0.25);
  background: transparent;
  font-size: 12px;
  color: #704c2b;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}
.action-fav:hover {
  border-color: rgba(110, 74, 43, 0.5);
}
.action-fav--active {
  background: rgba(212, 160, 80, 0.12);
  border-color: rgba(180, 130, 70, 0.5);
  color: #c28f4e;
}
.action-sub {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(110, 74, 43, 0.25);
  background: transparent;
  font-size: 12px;
  color: #704c2b;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}
.action-sub:hover {
  border-color: rgba(110, 74, 43, 0.5);
}
.action-sub--active {
  background: rgba(127, 46, 32, 0.08);
  border-color: rgba(127, 46, 32, 0.4);
  color: #7f2e20;
}

/* --- Animations --- */
@keyframes wave-bounce {
  0% {
    height: 4px;
  }
  50% {
    height: 14px;
  }
  100% {
    height: 8px;
  }
}
</style>
