<script setup>
import { computed } from 'vue'

const props = defineProps({
  program: { type: Object, default: null },
  isPlaying: { type: Boolean, default: false },
})

const emit = defineEmits(['play'])

const frequency = computed(() => props.program?.cover?.frequency || '89.6 FM')
</script>

<template>
  <section v-if="props.program" class="freq-console" :class="{ 'freq-console--playing': props.isPlaying }">
    <div class="console-texture" />
    <!-- Left: Frequency -->
    <div class="console-freq">
      <span class="freq-label">FREQUENCY</span>
      <span class="freq-number">{{ frequency }}</span>
      <span class="freq-band">STEREO</span>
    </div>
    <!-- Center: Program info -->
    <div class="console-info">
      <div class="info-onair">
        <span class="onair-dot" />
        <span class="onair-text">NOW BROADCASTING</span>
      </div>
      <h3 class="info-title">{{ props.program.title }}</h3>
      <p class="info-host">{{ props.program.host }}</p>
      <div class="info-meta">
        <span class="meta-listeners">
          <span class="meta-dot" />
          {{ props.program.listeners }} 收听
        </span>
        <span class="meta-category">{{ props.program.category }}</span>
      </div>
      <!-- Golden waveform -->
      <div class="golden-wave">
        <span v-for="i in 24" :key="i" class="wave-bar" :style="{ animationDelay: `${i * 0.08}s` }" />
      </div>
    </div>
    <!-- Right: Play control -->
    <div class="console-control">
      <button type="button" class="play-knob" @click="emit('play', props.program.id)">
        <svg v-if="!props.isPlaying" viewBox="0 0 24 24" fill="currentColor" class="knob-icon">
          <path d="M8 5v14l11-7z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor" class="knob-icon">
          <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
        </svg>
      </button>
      <span class="control-label">{{ props.isPlaying ? 'PAUSE' : 'PLAY' }}</span>
    </div>
  </section>
</template>

<style scoped>
.freq-console {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 28px;
  align-items: center;
  margin-top: 28px;
  padding: 28px 32px;
  border-radius: 1rem;
  background:
    repeating-linear-gradient(
      90deg,
      rgba(80, 50, 30, 0.04) 0px,
      rgba(80, 50, 30, 0.07) 2px,
      transparent 2px,
      transparent 6px
    ),
    linear-gradient(135deg, #2e1e14 0%, #1e1410 40%, #2a1a12 70%, #1c1210 100%);
  border: 1px solid rgba(180, 130, 70, 0.3);
  box-shadow:
    0 8px 32px rgba(20, 10, 5, 0.25),
    inset 0 1px 0 rgba(180, 130, 70, 0.06),
    inset 0 -2px 8px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  transition: box-shadow 0.4s ease;
}

.freq-console--playing {
  box-shadow:
    0 8px 32px rgba(20, 10, 5, 0.25),
    inset 0 1px 0 rgba(180, 130, 70, 0.06),
    inset 0 -2px 8px rgba(0, 0, 0, 0.2),
    0 0 20px rgba(180, 130, 70, 0.08);
  animation: console-breathe 3s ease-in-out infinite;
}

.console-texture {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 3px,
    rgba(0, 0, 0, 0.03) 3px,
    rgba(0, 0, 0, 0.03) 4px
  );
  pointer-events: none;
}

/* Left: Frequency */
.console-freq {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 20px;
  border-radius: 8px;
  background: rgba(10, 8, 6, 0.5);
  border: 1px solid rgba(80, 60, 40, 0.3);
}

.freq-label {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: rgba(180, 130, 70, 0.5);
}

.freq-number {
  font-family: 'Courier New', monospace;
  font-size: clamp(24px, 3vw, 36px);
  font-weight: 700;
  color: rgba(212, 172, 112, 0.9);
  letter-spacing: 0.05em;
  text-shadow: 0 0 8px rgba(212, 172, 112, 0.2);
}

.freq-band {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  letter-spacing: 0.15em;
  color: rgba(180, 130, 70, 0.4);
}

/* Center: Info */
.console-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.info-onair {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
}

.onair-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(196, 64, 48, 0.9);
  box-shadow: 0 0 6px rgba(196, 64, 48, 0.5);
  animation: dot-pulse 1.5s ease-in-out infinite;
}

.onair-text {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: rgba(196, 64, 48, 0.8);
}

.info-title {
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(18px, 2.5vw, 26px);
  font-weight: 700;
  color: rgba(250, 244, 232, 0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-host {
  font-size: 14px;
  color: rgba(250, 244, 232, 0.5);
}

.info-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-listeners {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: rgba(250, 244, 232, 0.5);
}

.meta-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(120, 200, 120, 0.8);
  box-shadow: 0 0 3px rgba(120, 200, 120, 0.4);
}

.meta-category {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  background: rgba(180, 130, 70, 0.12);
  border: 1px solid rgba(180, 130, 70, 0.25);
  color: rgba(250, 244, 232, 0.45);
}

/* Golden waveform */
.golden-wave {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 20px;
  margin-top: 8px;
}

.golden-wave .wave-bar {
  width: 3px;
  height: 4px;
  border-radius: 1.5px;
  background: linear-gradient(to top, rgba(180, 130, 70, 0.4), rgba(212, 172, 112, 0.7));
  animation: wave-dance 1.2s ease-in-out infinite alternate;
}

/* Right: Play control */
.console-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.play-knob {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #5a4030, #2a1a12);
  border: 2px solid rgba(180, 130, 70, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.1s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.play-knob:hover {
  border-color: rgba(212, 172, 112, 0.7);
  transform: scale(1.05);
}

.knob-icon {
  width: 22px;
  height: 22px;
  color: rgba(212, 172, 112, 0.85);
}

.control-label {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  letter-spacing: 0.15em;
  color: rgba(180, 130, 70, 0.5);
}

/* Animations */
@keyframes console-breathe {
  0%, 100% { box-shadow: 0 8px 32px rgba(20, 10, 5, 0.25), inset 0 1px 0 rgba(180, 130, 70, 0.06), inset 0 -2px 8px rgba(0, 0, 0, 0.2), 0 0 20px rgba(180, 130, 70, 0.08); }
  50% { box-shadow: 0 8px 32px rgba(20, 10, 5, 0.25), inset 0 1px 0 rgba(180, 130, 70, 0.06), inset 0 -2px 8px rgba(0, 0, 0, 0.2), 0 0 30px rgba(180, 130, 70, 0.12); }
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes wave-dance {
  0% { height: 3px; }
  50% { height: 16px; }
  100% { height: 6px; }
}
</style>
