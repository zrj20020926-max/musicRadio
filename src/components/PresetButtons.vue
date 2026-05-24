<template>
  <div class="presets-panel">
    <div class="presets-header">
      <span class="presets-label">PRESET STATIONS</span>
      <span class="presets-divider"></span>
    </div>
    <div class="presets-row">
      <button
        v-for="(s, idx) in stations"
        :key="s.stationuuid"
        class="preset-key"
        :class="{ 'preset-key--active': activeId === s.stationuuid }"
        @click="$emit('select', s)"
      >
        <span class="preset-top">
          <span class="preset-num">{{ idx + 1 }}</span>
          <span class="preset-freq">{{ s.frequency.toFixed(1) }}</span>
        </span>
        <span class="preset-name">{{ s.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stations: { type: Array, default: () => [] },
  activeId: { type: String, default: '' },
})
defineEmits(['select'])
</script>

<style scoped>
.presets-panel {
  margin-top: 24px;
}

.presets-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding: 0 4px;
}

.presets-label {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  letter-spacing: 3px;
  color: #8b7355;
  white-space: nowrap;
}

.presets-divider {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, #5a3d25, transparent);
}

.presets-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(115px, 1fr));
  gap: 10px;
}

.preset-key {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  padding: 10px 10px 8px;
  background:
    linear-gradient(180deg, #4a3520 0%, #3b2814 40%, #2e1f0d 100%);
  border: 1px solid #5a3d25;
  border-bottom: 3px solid #1a1008;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow:
    0 4px 10px rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,220,160,0.06);
  position: relative;
  overflow: hidden;
}

.preset-key::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 0%, rgba(255,220,160,0.04), transparent 60%);
  pointer-events: none;
}

.preset-key:hover {
  border-color: #8b6838;
  transform: translateY(-1px);
  box-shadow:
    0 6px 14px rgba(0,0,0,0.6),
    inset 0 1px 0 rgba(255,220,160,0.08);
}

.preset-key:active {
  transform: translateY(2px);
  border-bottom-width: 1px;
  box-shadow:
    0 1px 3px rgba(0,0,0,0.5),
    inset 0 2px 8px rgba(0,0,0,0.4);
}

.preset-key--active {
  border-color: #c8a040;
  box-shadow:
    0 4px 10px rgba(0,0,0,0.5),
    0 0 14px rgba(200,160,64,0.12),
    inset 0 1px 0 rgba(255,220,160,0.08);
}

.preset-key--active .preset-freq {
  color: #e8a030;
  text-shadow: 0 0 6px rgba(232,160,48,0.5);
}

.preset-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preset-num {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  color: #5a3d25;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #4a3520;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preset-freq {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: bold;
  color: #b8944a;
  transition: color 0.2s, text-shadow 0.2s;
}

.preset-name {
  font-size: 9px;
  color: #8b7355;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}
</style>
