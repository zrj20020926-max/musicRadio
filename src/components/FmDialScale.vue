<template>
  <div class="dial-panel">
    <div class="dial-glass">
      <div class="dial-inner">
        <!-- Frequency labels -->
        <div class="dial-labels">
          <span
            v-for="label in majorLabels"
            :key="label.freq"
            class="dial-freq-label"
            :class="{ 'dial-freq-label--near': Math.abs(label.freq - frequency) < 2 }"
            :style="{ left: label.pct + '%' }"
          >{{ label.freq }}</span>
        </div>

        <!-- Tick marks -->
        <div class="dial-ticks">
          <span
            v-for="tick in ticks"
            :key="tick.freq"
            class="tick"
            :class="{ 'tick--major': tick.major, 'tick--mid': tick.mid }"
            :style="{ left: tick.pct + '%' }"
          ></span>
        </div>

        <!-- Station markers -->
        <div class="dial-stations">
          <span
            v-for="s in stations"
            :key="s.stationuuid"
            class="station-mark"
            :class="{ 'station-mark--active': lockedId === s.stationuuid }"
            :style="{ left: freqToPct(s.frequency) + '%' }"
          ></span>
        </div>

        <!-- Pointer -->
        <div class="dial-pointer-track">
          <div
            class="dial-pointer"
            :class="{ 'dial-pointer--locked': isLocked }"
            :style="{ left: pointerPct + '%' }"
          >
            <div class="pointer-line"></div>
            <div class="pointer-head"></div>
          </div>
        </div>
      </div>
      <div class="glass-reflection"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  frequency: { type: Number, default: 87.0 },
  stations: { type: Array, default: () => [] },
  isLocked: { type: Boolean, default: false },
  lockedId: { type: String, default: '' },
})

const FM_MIN = 87.0
const FM_MAX = 108.0

function freqToPct(f) {
  return ((f - FM_MIN) / (FM_MAX - FM_MIN)) * 100
}

const pointerPct = computed(() => freqToPct(props.frequency))

const majorLabels = computed(() => {
  const freqs = [88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108]
  return freqs.map(f => ({ freq: f, pct: freqToPct(f) }))
})

const ticks = computed(() => {
  const arr = []
  for (let f = FM_MIN; f <= FM_MAX; f += 0.5) {
    const freq = Math.round(f * 10) / 10
    const isWhole = freq === Math.round(freq)
    const isMajor = isWhole && freq % 2 === 0
    arr.push({
      freq,
      major: isMajor,
      mid: isWhole && !isMajor,
      pct: freqToPct(freq),
    })
  }
  return arr
})
</script>

<style scoped>
.dial-panel {
  width: 100%;
  padding: 4px 0;
}

.dial-glass {
  position: relative;
  height: 72px;
  background: linear-gradient(180deg, #1a0f00 0%, #0d0800 50%, #0a0500 100%);
  border: 1px solid #5a3d25;
  border-radius: 6px;
  overflow: hidden;
  box-shadow:
    inset 0 2px 10px rgba(0,0,0,0.9),
    inset 0 -1px 4px rgba(255,220,160,0.02),
    0 1px 0 rgba(255,220,160,0.05);
}

.dial-inner {
  position: relative;
  height: 100%;
  padding: 0 14px;
}

.glass-reflection {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    165deg,
    rgba(255,200,100,0.04) 0%,
    transparent 35%,
    transparent 65%,
    rgba(255,200,100,0.02) 100%
  );
  pointer-events: none;
  border-radius: 6px;
}

.dial-labels {
  position: absolute;
  top: 8px;
  left: 14px;
  right: 14px;
  height: 16px;
}

.dial-freq-label {
  position: absolute;
  transform: translateX(-50%);
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: #6a4a2a;
  transition: color 0.3s, text-shadow 0.3s;
}

.dial-freq-label--near {
  color: #c8a040;
  text-shadow: 0 0 4px rgba(200,160,64,0.4);
}

.dial-ticks {
  position: absolute;
  bottom: 10px;
  left: 14px;
  right: 14px;
  height: 26px;
}

.tick {
  position: absolute;
  bottom: 0;
  width: 1px;
  height: 7px;
  background: #4a3520;
  transform: translateX(-50%);
}

.tick--mid {
  height: 12px;
  background: #6a4a2a;
}

.tick--major {
  height: 20px;
  background: #8b6838;
  width: 1.5px;
}

.dial-stations {
  position: absolute;
  top: 28px;
  left: 14px;
  right: 14px;
  height: 10px;
}

.station-mark {
  position: absolute;
  top: 50%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #4a3520;
  transform: translate(-50%, -50%);
  transition: all 0.4s;
}

.station-mark--active {
  background: #e8a030;
  width: 6px;
  height: 6px;
  box-shadow: 0 0 6px rgba(232,160,48,0.6), 0 0 12px rgba(232,160,48,0.3);
}

.dial-pointer-track {
  position: absolute;
  top: 24px;
  bottom: 6px;
  left: 14px;
  right: 14px;
}

.dial-pointer {
  position: absolute;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
  transition: left 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.pointer-line {
  position: absolute;
  top: 6px;
  bottom: 0;
  left: 50%;
  width: 1.5px;
  margin-left: -0.75px;
  background: linear-gradient(180deg, #cc3333, #aa2222);
  box-shadow: 0 0 4px rgba(204,51,51,0.5);
}

.pointer-head {
  position: absolute;
  top: 0;
  left: 50%;
  width: 6px;
  height: 6px;
  margin-left: -3px;
  background: #cc3333;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(204,51,51,0.7), 0 0 12px rgba(204,51,51,0.3);
}

.dial-pointer--locked .pointer-line {
  background: linear-gradient(180deg, #e8a030, #c88020);
  box-shadow: 0 0 6px rgba(232,160,48,0.6);
}

.dial-pointer--locked .pointer-head {
  background: #e8a030;
  box-shadow: 0 0 8px rgba(232,160,48,0.8), 0 0 16px rgba(232,160,48,0.4);
}
</style>
