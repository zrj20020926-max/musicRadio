import { ref, watch } from 'vue'

const STORAGE_KEY = 'retro-radio-atmosphere'

export const EFFECTS = [
  { id: 'none', label: '关闭', icon: 'none' },
  { id: 'rain', label: '雨滴', icon: 'rain' },
  { id: 'snow', label: '飘雪', icon: 'snow' },
  { id: 'fog', label: '迷雾', icon: 'fog' },
  { id: 'firefly', label: '萤火', icon: 'firefly' },
]

function loadSaved() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'none'
  } catch {
    return 'none'
  }
}

export function useAtmosphere() {
  const activeEffect = ref(loadSaved())

  watch(activeEffect, (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, val)
    } catch { /* storage unavailable */ }
  })

  function setEffect(id) {
    activeEffect.value = id
  }

  return { activeEffect, setEffect, effects: EFFECTS }
}
