const PROGRAMS_KEY = 'retro-radio-programs-content'
const STATIONS_KEY = 'retro-radio-stations-content'
const LAST_UPDATED_KEY = 'retro-radio-content-last-updated-at'

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function safeReadJSON(key, fallback) {
  if (!canUseStorage()) {
    return fallback
  }
  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return fallback
  }
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function safeWriteJSON(key, value) {
  if (!canUseStorage()) {
    return
  }
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function hasProgramsContent() {
  const localPrograms = safeReadJSON(PROGRAMS_KEY, null)
  return Array.isArray(localPrograms) && localPrograms.length > 0
}

export function loadProgramsContent(fallbackPrograms) {
  const localPrograms = safeReadJSON(PROGRAMS_KEY, null)
  if (!Array.isArray(localPrograms) || !localPrograms.length) {
    return fallbackPrograms
  }
  return localPrograms
}

export function saveProgramsContent(programs) {
  safeWriteJSON(PROGRAMS_KEY, programs)
}

export function loadStationsContent() {
  return safeReadJSON(STATIONS_KEY, [])
}

export function saveStationsContent(stations) {
  safeWriteJSON(STATIONS_KEY, stations)
}

export function loadLastUpdatedAt() {
  if (!canUseStorage()) {
    return ''
  }
  return window.localStorage.getItem(LAST_UPDATED_KEY) || ''
}

export function saveLastUpdatedAt(value) {
  if (!canUseStorage()) {
    return
  }
  window.localStorage.setItem(LAST_UPDATED_KEY, value)
}
