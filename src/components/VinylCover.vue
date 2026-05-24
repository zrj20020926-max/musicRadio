<script setup>
const props = defineProps({
  title: { type: String, default: '' },
  frequency: { type: String, default: 'FM' },
  spinning: { type: Boolean, default: false },
})
</script>

<template>
  <div class="vinyl-wrap">
    <div class="vinyl-sleeve">
      <div class="sleeve-texture" />
      <div class="sleeve-label">
        <span class="sleeve-freq">{{ props.frequency }}</span>
        <span class="sleeve-title">{{ props.title }}</span>
      </div>
    </div>
    <div class="vinyl-disc" :class="{ 'vinyl-disc--spin': props.spinning }">
      <div class="disc-grooves" />
      <div class="disc-center">
        <div class="center-hole" />
        <span class="center-text">{{ props.frequency }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vinyl-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vinyl-sleeve {
  position: absolute;
  inset: 0;
  border-radius: 4px;
  background: linear-gradient(145deg, #3a2a1e, #2a1c14);
  border: 1px solid rgba(180, 130, 70, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 10px;
}

.sleeve-texture {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(180, 130, 70, 0.03) 3px,
      rgba(180, 130, 70, 0.03) 4px
    );
  pointer-events: none;
}

.sleeve-label {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.sleeve-freq {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: rgba(180, 130, 70, 0.5);
  letter-spacing: 0.1em;
}

.sleeve-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 11px;
  color: rgba(250, 244, 232, 0.4);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
}

.vinyl-disc {
  position: relative;
  width: 72%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, #1a1a1a 0%, #0d0d0d 100%);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.4),
    inset 0 0 2px rgba(255, 255, 255, 0.05);
  z-index: 2;
  transition: transform 0.3s ease;
}

.vinyl-disc--spin {
  animation: vinyl-rotate 4s linear infinite;
}

.disc-grooves {
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  background: repeating-radial-gradient(
    circle at center,
    transparent 0px,
    transparent 2px,
    rgba(60, 60, 60, 0.3) 2.5px,
    transparent 3px
  );
}

.disc-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, #5a3a20 0%, #3a2415 60%, #2a1a10 100%);
  border: 1px solid rgba(180, 130, 70, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.center-hole {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #0a0a0a;
  border: 1px solid rgba(180, 130, 70, 0.2);
}

.center-text {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  color: rgba(212, 172, 112, 0.7);
  letter-spacing: 0.05em;
}

@keyframes vinyl-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
