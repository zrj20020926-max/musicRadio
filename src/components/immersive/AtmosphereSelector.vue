<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { EFFECTS } from '../../composables/useAtmosphere'

defineProps({
  modelValue: { type: String, default: 'none' },
})
const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const panelRef = ref(null)
const btnRef = ref(null)

function toggle() {
  isOpen.value = !isOpen.value
}

function select(id) {
  emit('update:modelValue', id)
  isOpen.value = false
}

function handleOutside(e) {
  if (!isOpen.value) return
  if (panelRef.value?.contains(e.target)) return
  if (btnRef.value?.contains(e.target)) return
  isOpen.value = false
}

function handleEsc(e) {
  if (e.key === 'Escape' && isOpen.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleOutside)
  document.addEventListener('keydown', handleEsc)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleOutside)
  document.removeEventListener('keydown', handleEsc)
})
</script>

<template>
  <div class="atmo-selector">
    <button
      ref="btnRef"
      type="button"
      class="atmo-btn"
      :class="{ 'atmo-btn--active': modelValue !== 'none' }"
      aria-label="氛围效果"
      @click="toggle"
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3v1m0 16v1m-7.07-2.93l.7-.7m12.73-12.73l.7-.7M3 12h1m16 0h1m-2.93 7.07l-.7-.7M5.64 5.64l-.7-.7"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        />
        <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.6" />
      </svg>
    </button>

    <Transition name="atmo-pop">
      <div v-if="isOpen" ref="panelRef" class="atmo-panel" role="radiogroup" aria-label="选择氛围效果">
        <button
          v-for="eff in EFFECTS"
          :key="eff.id"
          type="button"
          class="atmo-option"
          :class="{ 'atmo-option--active': modelValue === eff.id }"
          role="radio"
          :aria-checked="modelValue === eff.id"
          @click="select(eff.id)"
        >
          <span class="atmo-icon">
            <svg v-if="eff.icon === 'none'" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4" />
              <path d="M5 15L15 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
            </svg>
            <svg v-else-if="eff.icon === 'rain'" viewBox="0 0 20 20" fill="none">
              <path d="M5 13c0-3.3 2.7-5 5-5s5 1.7 5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
              <path d="M7 16l-.5 2M10 16l-.5 2M13 16l-.5 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
            </svg>
            <svg v-else-if="eff.icon === 'snow'" viewBox="0 0 20 20" fill="none">
              <path d="M10 2v16M4 6l6 4-6 4M16 6l-6 4 6 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <svg v-else-if="eff.icon === 'fog'" viewBox="0 0 20 20" fill="none">
              <path d="M3 8h14M5 11h10M4 14h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
            </svg>
            <svg v-else-if="eff.icon === 'firefly'" viewBox="0 0 20 20" fill="none">
              <circle cx="6" cy="8" r="1.5" fill="currentColor" />
              <circle cx="14" cy="6" r="1" fill="currentColor" />
              <circle cx="10" cy="13" r="1.8" fill="currentColor" />
              <circle cx="15" cy="14" r="1.2" fill="currentColor" />
              <circle cx="4" cy="14" r="0.8" fill="currentColor" />
            </svg>
          </span>
          <span class="atmo-label">{{ eff.label }}</span>
          <span class="atmo-check" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.atmo-selector {
  position: relative;
}

.atmo-btn {
  display: grid;
  place-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(212, 160, 80, 0.34);
  border-radius: 50%;
  background: rgba(22, 14, 10, 0.56);
  color: rgba(250, 244, 232, 0.68);
  cursor: pointer;
  backdrop-filter: blur(14px);
  transition: transform 0.16s ease, border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}
.atmo-btn svg {
  width: 18px;
  height: 18px;
}
.atmo-btn:hover {
  border-color: rgba(232, 190, 116, 0.76);
  background: rgba(54, 34, 20, 0.82);
  color: rgba(255, 250, 238, 0.98);
  transform: translateY(-1px);
}
.atmo-btn--active {
  border-color: rgba(232, 190, 116, 0.6);
  color: rgba(232, 190, 116, 0.95);
}

.atmo-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 160px;
  padding: 8px;
  border: 1px solid rgba(212, 160, 80, 0.24);
  border-radius: 14px;
  background: rgba(18, 12, 8, 0.88);
  backdrop-filter: blur(20px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.atmo-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(250, 244, 232, 0.72);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.atmo-option:hover {
  background: rgba(212, 160, 80, 0.1);
  color: rgba(250, 244, 232, 0.95);
}
.atmo-option--active {
  background: rgba(212, 160, 80, 0.14);
  color: rgba(232, 190, 116, 0.95);
}

.atmo-icon {
  display: grid;
  place-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
.atmo-icon svg {
  width: 18px;
  height: 18px;
}

.atmo-label {
  flex: 1;
  text-align: left;
}

.atmo-check {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid rgba(212, 160, 80, 0.4);
  transition: background 0.15s ease, border-color 0.15s ease;
}
.atmo-option--active .atmo-check {
  background: rgba(232, 190, 116, 0.9);
  border-color: rgba(232, 190, 116, 0.9);
}

.atmo-pop-enter-active,
.atmo-pop-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.atmo-pop-enter-from,
.atmo-pop-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
