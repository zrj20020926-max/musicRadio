<script setup>
const props = defineProps({
  spinning: { type: Boolean, default: false },
})
</script>

<template>
  <div class="vinyl-container">
    <div class="vinyl-disc" :class="{ 'vinyl-disc--spinning': spinning }">
      <!-- Grooves -->
      <div class="vinyl-grooves" />
      <!-- Label -->
      <div class="vinyl-label">
        <div class="vinyl-label-dot" />
      </div>
      <!-- Shine highlight -->
      <div class="vinyl-shine" />
    </div>
    <!-- Tonearm -->
    <div class="vinyl-arm" :class="{ 'vinyl-arm--active': spinning }" />
  </div>
</template>

<style scoped>
.vinyl-container {
  position: relative;
  width: clamp(140px, 22vw, 240px);
  height: clamp(140px, 22vw, 240px);
}

.vinyl-disc {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    #1a1a1a 0%,
    #111 20%,
    #1a1a1a 21%,
    #0f0f0f 40%,
    #1a1a1a 41%,
    #0d0d0d 60%,
    #1a1a1a 61%,
    #111 80%,
    #1a1a1a 100%
  );
  box-shadow:
    0 0 0 3px rgba(80, 60, 40, 0.3),
    0 8px 32px rgba(0, 0, 0, 0.6),
    inset 0 0 30px rgba(0, 0, 0, 0.4);
  position: relative;
  animation: vinyl-spin 4s linear infinite;
  animation-play-state: paused;
}

.vinyl-disc--spinning {
  animation-play-state: running;
}

.vinyl-grooves {
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  background: repeating-radial-gradient(
    circle,
    transparent 0px,
    transparent 2px,
    rgba(60, 60, 60, 0.15) 2px,
    rgba(60, 60, 60, 0.15) 3px
  );
}

.vinyl-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30%;
  height: 30%;
  border-radius: 50%;
  background: radial-gradient(circle, #8b3a2a 0%, #6b2a1a 60%, #4a1a0a 100%);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4);
  display: grid;
  place-content: center;
}

.vinyl-label-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #222;
  box-shadow: 0 0 0 2px rgba(100, 80, 60, 0.4);
}

.vinyl-shine {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    transparent 40%,
    transparent 60%,
    rgba(255, 255, 255, 0.02) 100%
  );
}

.vinyl-arm {
  position: absolute;
  top: 8%;
  right: 5%;
  width: 4px;
  height: 45%;
  background: linear-gradient(to bottom, #8a6a4a, #5a3a20);
  border-radius: 2px;
  transform-origin: top right;
  transform: rotate(-25deg);
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.4);
}
.vinyl-arm::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: -2px;
  width: 8px;
  height: 8px;
  background: #5a3a20;
  border-radius: 50%;
}
.vinyl-arm--active {
  transform: rotate(-10deg);
}

@keyframes vinyl-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
