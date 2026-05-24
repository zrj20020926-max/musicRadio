<script setup>
const props = defineProps({
  frequency: { type: String, default: '89.6 FM' },
  isLive: { type: Boolean, default: false },
  spinning: { type: Boolean, default: false },
})
</script>

<template>
  <div class="radio-panel-wrap">
    <div class="radio-panel">
      <div class="panel-texture" />
      <!-- ON AIR lamp -->
      <div v-if="props.isLive" class="onair-lamp">
        <span class="lamp-dot" />
        <span class="lamp-text">ON AIR</span>
      </div>
      <!-- Frequency display -->
      <div class="freq-display">
        <span class="freq-number">{{ props.frequency }}</span>
      </div>
      <!-- Dial scale -->
      <div class="dial-scale">
        <div class="scale-marks">
          <span v-for="i in 9" :key="i" class="scale-tick" />
        </div>
        <div class="dial-pointer" :class="{ 'dial-pointer--active': props.spinning }" />
      </div>
      <!-- Knob -->
      <div class="panel-knob">
        <div class="knob-inner" :class="{ 'knob-inner--spin': props.spinning }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.radio-panel-wrap {
  width: 100%;
  aspect-ratio: 1.5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
}

.radio-panel {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  background: linear-gradient(180deg, #2e2018 0%, #1e1410 100%);
  border: 1px solid rgba(180, 130, 70, 0.2);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 10% 8%;
  overflow: hidden;
}

.panel-texture {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 4px,
    rgba(180, 130, 70, 0.02) 4px,
    rgba(180, 130, 70, 0.02) 5px
  );
  pointer-events: none;
}

.onair-lamp {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 3px;
  background: rgba(100, 30, 20, 0.8);
  border: 1px solid rgba(164, 59, 42, 0.5);
}

.lamp-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #c44030;
  box-shadow: 0 0 4px rgba(196, 64, 48, 0.6);
  animation: lamp-blink 1.5s ease-in-out infinite;
}

.lamp-text {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: rgba(250, 200, 180, 0.9);
}

.freq-display {
  padding: 4px 12px;
  border-radius: 4px;
  background: rgba(10, 8, 6, 0.6);
  border: 1px solid rgba(80, 60, 40, 0.3);
}

.freq-number {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 700;
  color: rgba(212, 172, 112, 0.85);
  letter-spacing: 0.08em;
}

.dial-scale {
  position: relative;
  width: 80%;
  height: 16px;
}

.scale-marks {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 100%;
  padding: 0 4px;
}

.scale-tick {
  width: 1px;
  height: 8px;
  background: rgba(180, 130, 70, 0.35);
}
.scale-tick:nth-child(odd) {
  height: 5px;
}
.scale-tick:nth-child(5) {
  height: 10px;
  background: rgba(212, 172, 112, 0.6);
}

.dial-pointer {
  position: absolute;
  bottom: 0;
  left: 55%;
  width: 2px;
  height: 14px;
  background: rgba(196, 64, 48, 0.8);
  border-radius: 1px;
  transition: left 0.3s ease;
}

.dial-pointer--active {
  animation: pointer-sweep 3s ease-in-out infinite alternate;
}

.panel-knob {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(circle, #5a4a3a 0%, #3a2a1e 100%);
  border: 1.5px solid rgba(180, 130, 70, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.knob-inner {
  width: 8px;
  height: 2px;
  background: rgba(180, 130, 70, 0.5);
  border-radius: 1px;
}

.knob-inner--spin {
  animation: knob-turn 3s ease-in-out infinite alternate;
}

@keyframes lamp-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes pointer-sweep {
  0% { left: 30%; }
  100% { left: 70%; }
}

@keyframes knob-turn {
  0% { transform: rotate(-30deg); }
  100% { transform: rotate(30deg); }
}
</style>
