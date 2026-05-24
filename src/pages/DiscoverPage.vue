<script setup>
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useRadioStore } from '../stores/radio'

const router = useRouter()
const radioStore = useRadioStore()
const { isPlaying, liveProgram, featuredPrograms } = storeToRefs(radioStore)

const featureList = [
  { title: '真人播报', meanings: ['温暖陪伴', '贴近表达'] },
  { title: '背景音乐', meanings: ['精选 BGM', '氛围营造'] },
  { title: '主题节目', meanings: ['多元话题', '深度陪伴'] },
  { title: '陪伴时刻', meanings: ['早安时段', '睡前时段'] },
]

function goProgramDetail(programId) {
  router.push(`/programs/${programId}`)
}
</script>

<template>
  <main class="mt-8 w-full">
    <h2 class="font-retro text-6xl text-paper-900">发现</h2>

    <section
      class="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.85fr)_minmax(240px,0.62fr)] xl:items-stretch xl:gap-6 2xl:grid-cols-[minmax(0,2fr)_minmax(250px,0.58fr)] 2xl:gap-8"
    >
      <!-- Broadcasting Console Hero -->
      <article
        class="console-hero min-w-0 overflow-hidden rounded-[2rem] border border-[#4a3020]/60 shadow-soft"
      >
        <!-- Console body -->
        <div class="console-body">
          <!-- Top panel: frequency display -->
          <div class="console-top">
            <div class="freq-display">
              <div class="freq-screen">
                <span class="freq-band">FM</span>
                <span class="freq-number">{{ liveProgram.cover?.frequency || '89.6' }}</span>
                <span class="freq-unit">MHz</span>
              </div>
              <div class="freq-dial">
                <div class="dial-markers">
                  <span v-for="i in 9" :key="i" class="dial-mark" />
                </div>
                <div class="dial-needle" :class="{ 'needle-active': isPlaying }" />
              </div>
            </div>
            <!-- Signal indicators -->
            <div class="signal-lamps">
              <span class="lamp lamp--red" :class="{ 'lamp--on': isPlaying }" />
              <span class="lamp lamp--amber" :class="{ 'lamp--on': isPlaying }" />
              <span class="lamp lamp--green" :class="{ 'lamp--on': true }" />
            </div>
          </div>

          <!-- Middle panel: VU meters + program info -->
          <div class="console-mid">
            <!-- Left VU meter -->
            <div class="vu-meter">
              <div class="vu-label">L</div>
              <div class="vu-track">
                <div class="vu-fill vu-fill--l" :class="{ 'vu-animated': isPlaying }" />
              </div>
            </div>

            <!-- Center: program info -->
            <div class="console-info">
              <h3 class="info-title" :title="liveProgram.title">
                {{ liveProgram.title }}
              </h3>
              <p class="info-host" :title="liveProgram.host">
                {{ liveProgram.host }}
              </p>
              <div class="info-stats">
                <span class="stat-chip">
                  <span class="stat-dot" />
                  {{ liveProgram.listeners }} 收听
                </span>
                <span class="stat-chip stat-chip--dim">STEREO</span>
              </div>
            </div>

            <!-- Right VU meter -->
            <div class="vu-meter">
              <div class="vu-label">R</div>
              <div class="vu-track">
                <div class="vu-fill vu-fill--r" :class="{ 'vu-animated': isPlaying }" />
              </div>
            </div>
          </div>

          <!-- Bottom panel: controls -->
          <div class="console-bottom">
            <!-- Fader knobs (decorative) -->
            <div class="fader-group">
              <div v-for="i in 5" :key="i" class="fader-slot">
                <div class="fader-track" />
                <div class="fader-knob" :style="{ bottom: `${20 + Math.random() * 50}%` }" />
              </div>
            </div>

            <!-- Play control: big illuminated toggle -->
            <button
              type="button"
              class="broadcast-toggle"
              :class="{ 'is-on': isPlaying }"
              @click="radioStore.togglePlay(liveProgram.id)"
            >
              <span class="toggle-light" />
              <span class="toggle-label">{{ isPlaying ? 'BROADCASTING' : 'START' }}</span>
            </button>

            <!-- EQ dots (decorative) -->
            <div class="eq-dots">
              <div v-for="i in 8" :key="i" class="eq-col">
                <span
                  v-for="j in 5"
                  :key="j"
                  class="eq-dot"
                  :class="{ 'eq-dot--lit': isPlaying && j <= 3 + Math.floor(Math.random() * 2) }"
                />
              </div>
            </div>
          </div>
        </div>
      </article>

      <aside
        class="min-w-0 rounded-[2rem] border border-paper-600/50 bg-paper-200/90 p-5 shadow-soft sm:p-6 xl:p-7"
      >
        <h3 class="text-center font-retro text-4xl text-paper-900 sm:text-5xl">电台特色</h3>
        <div class="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:mt-8 sm:gap-x-6 sm:gap-y-8">
          <div
            v-for="item in featureList"
            :key="item.title"
            class="flex flex-col items-center text-center"
          >
            <span class="h-4 w-4 rounded-full bg-[#d4a45d]" />
            <div class="mt-3">
              <p class="text-3xl font-bold text-paper-900">{{ item.title }}</p>
              <p
                v-for="meaning in item.meanings"
                :key="meaning"
                class="mt-1 text-base text-paper-700 sm:text-lg"
              >
                {{ meaning }}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </section>

    <section class="mt-10">
      <h3 class="font-retro text-5xl text-paper-900">节目推荐</h3>
      <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <article
          v-for="program in featuredPrograms"
          :key="program.id"
          class="flex min-w-0 items-center gap-4 overflow-hidden rounded-2xl border border-paper-600/50 bg-paper-200/90 px-5 py-4 transition hover:-translate-y-1"
        >
          <div
            class="grid h-14 w-14 shrink-0 place-content-center rounded-2xl bg-paper-900 text-xl text-paper-100"
          >
            📻
          </div>
          <div class="min-w-0 flex-1">
            <button
              type="button"
              class="block w-full truncate text-left text-[28px] font-bold text-paper-900 hover:underline"
              :title="program.title"
              @click="goProgramDetail(program.id)"
            >
              {{ program.title }}↗
            </button>
            <p
              class="mt-1 truncate text-xl text-paper-700"
              :title="`${program.duration} · ${program.listeners} 次收听`"
            >
              {{ program.duration }} · {{ program.listeners }} 次收听
            </p>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* === Console Hero === */
.console-hero {
  background: linear-gradient(170deg, #1c1210 0%, #0f0a07 100%);
}

.console-body {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* --- Top Panel: Frequency Display --- */
.console-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(80, 55, 30, 0.3);
}

.freq-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.freq-screen {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 8px 16px;
  background: #0a0604;
  border: 1px solid rgba(80, 55, 30, 0.4);
  border-radius: 8px;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);
}
.freq-band {
  font-size: 11px;
  color: rgba(120, 200, 120, 0.7);
  letter-spacing: 0.1em;
}
.freq-number {
  font-family: 'Courier New', monospace;
  font-size: clamp(24px, 4vw, 36px);
  font-weight: 700;
  color: rgba(120, 220, 120, 0.9);
  text-shadow: 0 0 8px rgba(120, 200, 120, 0.4);
}
.freq-unit {
  font-size: 11px;
  color: rgba(120, 200, 120, 0.5);
}

/* Dial */
.freq-dial {
  position: relative;
  height: 6px;
  background: rgba(40, 28, 18, 0.8);
  border-radius: 3px;
  border: 1px solid rgba(80, 55, 30, 0.3);
}
.dial-markers {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}
.dial-mark {
  width: 1px;
  height: 4px;
  background: rgba(180, 140, 80, 0.3);
  border-radius: 1px;
}
.dial-needle {
  position: absolute;
  top: -2px;
  left: 45%;
  width: 3px;
  height: 10px;
  background: #c44030;
  border-radius: 2px;
  box-shadow: 0 0 4px rgba(196, 64, 48, 0.5);
  transition: left 1.5s ease-in-out;
}
.dial-needle.needle-active {
  animation: needle-drift 4s ease-in-out infinite alternate;
}

/* Signal lamps */
.signal-lamps {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}
.lamp {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid rgba(80, 60, 40, 0.5);
  opacity: 0.25;
  transition:
    opacity 0.3s,
    box-shadow 0.3s;
}
.lamp--red {
  background: #c44030;
}
.lamp--amber {
  background: #c4a030;
}
.lamp--green {
  background: #40a040;
}
.lamp--on.lamp--red {
  opacity: 1;
  box-shadow: 0 0 8px rgba(196, 64, 48, 0.6);
}
.lamp--on.lamp--amber {
  opacity: 1;
  box-shadow: 0 0 8px rgba(196, 160, 48, 0.5);
}
.lamp--on.lamp--green {
  opacity: 1;
  box-shadow: 0 0 8px rgba(64, 160, 64, 0.5);
}

/* --- Middle Panel: VU + Info --- */
.console-mid {
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  gap: 16px;
  align-items: center;
  padding: 24px;
  min-height: 140px;
}
@media (min-width: 640px) {
  .console-mid {
    grid-template-columns: 52px 1fr 52px;
    gap: 24px;
    padding: 28px 32px;
  }
}

/* VU Meter */
.vu-meter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.vu-label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(180, 140, 80, 0.6);
  letter-spacing: 0.15em;
}
.vu-track {
  width: 8px;
  height: 80px;
  background: #0a0604;
  border-radius: 4px;
  border: 1px solid rgba(80, 55, 30, 0.3);
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.5);
}
.vu-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20%;
  border-radius: 0 0 3px 3px;
  background: linear-gradient(
    to top,
    rgba(64, 180, 64, 0.8),
    rgba(180, 180, 48, 0.8) 70%,
    rgba(196, 64, 48, 0.8)
  );
  transition: height 0.3s ease;
}
.vu-fill.vu-animated {
  animation: vu-bounce 0.8s ease-in-out infinite alternate;
}
.vu-fill--l.vu-animated {
  animation-delay: 0s;
}
.vu-fill--r.vu-animated {
  animation-delay: 0.15s;
}

/* Center info */
.console-info {
  text-align: center;
  min-width: 0;
}
.info-title {
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(20px, 3vw, 32px);
  font-weight: 700;
  color: rgba(250, 244, 232, 0.92);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.info-host {
  margin-top: 6px;
  font-size: clamp(13px, 1.8vw, 16px);
  color: rgba(250, 244, 232, 0.45);
}
.info-stats {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}
.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  color: rgba(250, 244, 232, 0.7);
  border: 1px solid rgba(180, 140, 80, 0.25);
  background: rgba(40, 28, 18, 0.5);
}
.stat-chip--dim {
  color: rgba(250, 244, 232, 0.35);
  border-color: rgba(80, 60, 40, 0.25);
}
.stat-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(120, 200, 120, 0.7);
  box-shadow: 0 0 4px rgba(120, 200, 120, 0.4);
}

/* --- Bottom Panel: Controls --- */
.console-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px 20px;
  border-top: 1px solid rgba(80, 55, 30, 0.3);
  background: rgba(10, 6, 4, 0.4);
}

/* Fader group */
.fader-group {
  display: flex;
  gap: 6px;
  align-items: flex-end;
}
.fader-slot {
  position: relative;
  width: 8px;
  height: 48px;
}
.fader-track {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 100%;
  background: rgba(80, 55, 30, 0.4);
  border-radius: 1px;
}
.fader-knob {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 12px;
  background: linear-gradient(to bottom, #6a5030, #4a3020);
  border-radius: 2px;
  border: 1px solid rgba(120, 90, 50, 0.4);
}

/* Broadcast toggle button */
.broadcast-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid rgba(80, 55, 30, 0.5);
  background: linear-gradient(to bottom, #1a1210, #0f0a07);
  cursor: pointer;
  transition:
    border-color 0.2s,
    transform 0.1s;
}
.broadcast-toggle:hover {
  border-color: rgba(120, 90, 50, 0.6);
}
.broadcast-toggle:active {
  transform: scale(0.97);
}
.toggle-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3a2820;
  border: 1px solid rgba(80, 55, 30, 0.4);
  transition:
    background 0.3s,
    box-shadow 0.3s;
}
.broadcast-toggle.is-on .toggle-light {
  background: #c44030;
  box-shadow:
    0 0 10px rgba(196, 64, 48, 0.6),
    0 0 20px rgba(196, 64, 48, 0.3);
}
.toggle-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: rgba(250, 244, 232, 0.4);
  transition: color 0.3s;
}
.broadcast-toggle.is-on .toggle-label {
  color: rgba(250, 244, 232, 0.85);
}

/* EQ dots */
.eq-dots {
  display: flex;
  gap: 4px;
  align-items: flex-end;
}
.eq-col {
  display: flex;
  flex-direction: column-reverse;
  gap: 3px;
}
.eq-dot {
  width: 5px;
  height: 5px;
  border-radius: 1px;
  background: rgba(40, 28, 18, 0.6);
  border: 1px solid rgba(60, 40, 25, 0.4);
  transition:
    background 0.2s,
    box-shadow 0.2s;
}
.eq-dot--lit {
  background: rgba(120, 200, 120, 0.7);
  box-shadow: 0 0 3px rgba(120, 200, 120, 0.3);
}
.eq-col:nth-child(n + 6) .eq-dot--lit {
  background: rgba(200, 180, 60, 0.7);
  box-shadow: 0 0 3px rgba(200, 180, 60, 0.3);
}
.eq-col:nth-child(n + 8) .eq-dot--lit {
  background: rgba(196, 64, 48, 0.7);
  box-shadow: 0 0 3px rgba(196, 64, 48, 0.3);
}

/* --- Animations --- */
@keyframes needle-drift {
  0% {
    left: 38%;
  }
  100% {
    left: 52%;
  }
}
@keyframes vu-bounce {
  0% {
    height: 35%;
  }
  50% {
    height: 72%;
  }
  100% {
    height: 50%;
  }
}
</style>
