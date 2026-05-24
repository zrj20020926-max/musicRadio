<script setup>
import { computed } from 'vue'
import VinylCover from './VinylCover.vue'
import CassetteCover from './CassetteCover.vue'
import RadioFrequencyCover from './RadioFrequencyCover.vue'

const props = defineProps({
  program: { type: Object, required: true },
  isSubscribed: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
})

const emit = defineEmits(['play', 'subscribe', 'favorite', 'detail'])

const visualType = computed(() => {
  const cat = (props.program.category || '').toLowerCase()
  if (props.program.isLive || cat.includes('早安') || cat.includes('午后')) return 'radio'
  if (cat.includes('故事') || cat.includes('访谈') || cat.includes('怀旧') || cat.includes('播客')) return 'cassette'
  return 'vinyl'
})
</script>

<template>
  <article
    class="visual-card"
    :class="[
      `visual-card--${visualType}`,
      { 'visual-card--active': isActive }
    ]"
  >
    <!-- Cover Area -->
    <div class="card-cover-area">
      <VinylCover
        v-if="visualType === 'vinyl'"
        :title="props.program.title"
        :frequency="props.program.cover?.frequency || 'FM'"
        :spinning="isActive"
      />
      <CassetteCover
        v-else-if="visualType === 'cassette'"
        :title="props.program.title"
        :host="props.program.host"
        :spinning="isActive"
      />
      <RadioFrequencyCover
        v-else
        :frequency="props.program.cover?.frequency || 'FM'"
        :is-live="props.program.isLive"
        :spinning="isActive"
      />
      <!-- Active waveform overlay -->
      <div v-if="isActive" class="active-wave-overlay">
        <span v-for="i in 5" :key="i" class="aw-bar" :style="{ animationDelay: `${i * 0.1}s` }" />
      </div>
    </div>

    <!-- Info Area -->
    <div class="card-info">
      <div class="info-top">
        <span class="card-category" :title="props.program.category">{{ props.program.category }}</span>
        <span v-if="props.program.isLive" class="card-live-badge">LIVE</span>
        <span class="card-date">{{ props.program.date }}</span>
      </div>

      <button type="button" class="card-title" :title="props.program.title" @click="emit('detail', props.program.id)">
        {{ props.program.title }}
      </button>

      <p class="card-host" :title="props.program.host">{{ props.program.host }}</p>

      <p class="card-desc" :title="props.program.description">{{ props.program.description }}</p>

      <div class="card-stats">
        <span>{{ props.program.listeners }} 收听</span>
        <span v-if="props.program.episodes?.length">{{ props.program.episodes.length }} 集</span>
      </div>

      <div class="card-actions">
        <button type="button" class="act-play" @click="emit('play', props.program.id)">
          <svg viewBox="0 0 16 16" fill="currentColor" class="act-icon">
            <path v-if="!isActive" d="M4 2l10 6-10 6z" />
            <path v-else d="M3 2h4v12H3zM9 2h4v12H9z" />
          </svg>
          <span>{{ isActive ? '暂停' : '播放' }}</span>
        </button>
        <button type="button" class="act-detail" @click="emit('detail', props.program.id)">详情</button>
        <button
          type="button"
          class="act-fav"
          :class="{ 'act-fav--on': props.isFavorite }"
          :title="props.isFavorite ? '取消收藏' : '收藏'"
          @click="emit('favorite', props.program.id)"
        >收藏</button>
        <button
          type="button"
          class="act-sub"
          :class="{ 'act-sub--on': props.isSubscribed }"
          @click="emit('subscribe', props.program.id)"
        >{{ props.isSubscribed ? '已订阅' : '订阅' }}</button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.visual-card {
  display: flex;
  flex-direction: column;
  border-radius: 0.8rem;
  border: 1px solid rgba(110, 74, 43, 0.3);
  background:
    repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(110, 74, 43, 0.015) 5px, rgba(110, 74, 43, 0.015) 6px),
    rgba(244, 234, 216, 0.92);
  overflow: hidden;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.visual-card:hover {
  transform: translateY(-3px);
  border-color: rgba(180, 130, 70, 0.5);
  box-shadow: 0 8px 24px rgba(40, 25, 12, 0.12);
}

.visual-card--active {
  border-color: rgba(180, 130, 70, 0.6);
  box-shadow: 0 0 0 2px rgba(180, 130, 70, 0.12), 0 6px 20px rgba(40, 25, 12, 0.1);
  animation: card-glow 3s ease-in-out infinite;
}

/* Cover area */
.card-cover-area {
  position: relative;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, rgba(30, 20, 14, 0.04), rgba(30, 20, 14, 0.08));
  border-bottom: 1px solid rgba(110, 74, 43, 0.15);
}

.active-wave-overlay {
  position: absolute;
  bottom: 8px;
  left: 16px;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
}

.aw-bar {
  width: 3px;
  border-radius: 1.5px;
  background: linear-gradient(to top, rgba(180, 130, 70, 0.5), rgba(212, 172, 112, 0.8));
  animation: aw-bounce 0.8s ease-in-out infinite alternate;
}
.aw-bar:nth-child(1) { height: 5px; }
.aw-bar:nth-child(2) { height: 11px; }
.aw-bar:nth-child(3) { height: 7px; }
.aw-bar:nth-child(4) { height: 13px; }
.aw-bar:nth-child(5) { height: 9px; }

/* Info area */
.card-info {
  display: flex;
  flex-direction: column;
  padding: 14px 16px 16px;
  min-width: 0;
  flex: 1;
}

.info-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.card-category {
  display: inline-block;
  max-width: 100px;
  padding: 2px 8px;
  border-radius: 3px;
  border: 1px solid rgba(110, 74, 43, 0.25);
  font-size: 11px;
  color: #9a6c3a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-live-badge {
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(100, 30, 20, 0.8);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgba(250, 200, 180, 0.9);
  box-shadow: 0 0 4px rgba(164, 59, 42, 0.3);
}

.card-date {
  margin-left: auto;
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  transition: color 0.15s;
}
.card-title:hover { color: #9a6c3a; }

.card-host {
  margin-top: 4px;
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

/* Actions */
.card-actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.act-play {
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
.act-play:hover { background: #3a2418; }

.act-icon {
  width: 12px;
  height: 12px;
}

.act-detail {
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
.act-detail:hover { background: rgba(110, 74, 43, 0.06); }

.act-fav {
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
.act-fav:hover { border-color: rgba(110, 74, 43, 0.5); }
.act-fav--on {
  background: rgba(212, 160, 80, 0.12);
  border-color: rgba(180, 130, 70, 0.5);
  color: #c28f4e;
}

.act-sub {
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
.act-sub:hover { border-color: rgba(110, 74, 43, 0.5); }
.act-sub--on {
  background: rgba(127, 46, 32, 0.08);
  border-color: rgba(127, 46, 32, 0.4);
  color: #7f2e20;
}

/* Animations */
@keyframes aw-bounce {
  0% { height: 3px; }
  50% { height: 13px; }
  100% { height: 6px; }
}

@keyframes card-glow {
  0%, 100% { box-shadow: 0 0 0 2px rgba(180, 130, 70, 0.12), 0 6px 20px rgba(40, 25, 12, 0.1); }
  50% { box-shadow: 0 0 0 2px rgba(180, 130, 70, 0.2), 0 6px 20px rgba(40, 25, 12, 0.15); }
}
</style>
