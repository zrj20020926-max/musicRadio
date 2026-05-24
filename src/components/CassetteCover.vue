<script setup>
const props = defineProps({
  title: { type: String, default: '' },
  host: { type: String, default: '' },
  spinning: { type: Boolean, default: false },
})
</script>

<template>
  <div class="cassette-wrap">
    <div class="cassette-body">
      <div class="cassette-texture" />
      <!-- Screws -->
      <div class="screw screw-tl" />
      <div class="screw screw-tr" />
      <div class="screw screw-bl" />
      <div class="screw screw-br" />
      <!-- Window -->
      <div class="cassette-window">
        <div class="reel reel-left" :class="{ 'reel--spin': props.spinning }">
          <div class="reel-hub" />
        </div>
        <div class="tape-strip" />
        <div class="reel reel-right" :class="{ 'reel--spin': props.spinning }">
          <div class="reel-hub" />
        </div>
      </div>
      <!-- Label -->
      <div class="cassette-label">
        <span class="label-title">{{ props.title }}</span>
        <span class="label-host">{{ props.host }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cassette-wrap {
  width: 100%;
  aspect-ratio: 1.6;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.cassette-body {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 8px 8px 4px 4px;
  background: linear-gradient(180deg, #3d2e24 0%, #2a1e16 100%);
  border: 1px solid rgba(180, 130, 70, 0.2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 2px 6px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.cassette-texture {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.05) 2px,
    rgba(0, 0, 0, 0.05) 3px
  );
  pointer-events: none;
}

.screw {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: radial-gradient(circle, #8a7a6a, #5a4a3a);
  border: 0.5px solid rgba(0, 0, 0, 0.3);
}
.screw-tl { top: 6px; left: 6px; }
.screw-tr { top: 6px; right: 6px; }
.screw-bl { bottom: 6px; left: 6px; }
.screw-br { bottom: 6px; right: 6px; }

.cassette-window {
  position: absolute;
  top: 18%;
  left: 15%;
  right: 15%;
  height: 36%;
  border-radius: 4px;
  background: rgba(20, 14, 10, 0.8);
  border: 1px solid rgba(80, 60, 40, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12%;
}

.reel {
  width: 28%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, #4a3a2a 0%, #2a1e14 70%);
  border: 1.5px solid rgba(120, 90, 60, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.reel--spin {
  animation: reel-rotate 2s linear infinite;
}

.reel-hub {
  width: 40%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, #6a5a4a, #3a2a1e);
  border: 1px solid rgba(180, 130, 70, 0.2);
}

.tape-strip {
  flex: 1;
  height: 2px;
  margin: 0 6%;
  background: rgba(80, 50, 30, 0.6);
  border-radius: 1px;
}

.cassette-label {
  position: absolute;
  bottom: 12%;
  left: 12%;
  right: 12%;
  padding: 6px 8px;
  background: rgba(250, 244, 232, 0.08);
  border: 1px solid rgba(180, 130, 70, 0.15);
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.label-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 10px;
  color: rgba(212, 172, 112, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.label-host {
  font-size: 9px;
  color: rgba(180, 130, 70, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes reel-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
