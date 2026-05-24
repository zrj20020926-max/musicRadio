import { ref, computed, watch, onUnmounted } from 'vue'

const FM_MIN = 87.0
const FM_MAX = 108.0
const LOCK_THRESHOLD = 0.15
const SCAN_INTERVAL = 80

function parseFrequencyFromName(name, url) {
  if (!name && !url) return null
  const patterns = [
    /FM\s*(\d{2,3}(?:\.\d)?)/i,
    /(\d{2,3}(?:\.\d)?)\s*FM/i,
  ]
  if (name) {
    for (const re of patterns) {
      const m = name.match(re)
      if (m) {
        const f = parseFloat(m[1])
        if (f >= FM_MIN && f <= FM_MAX) return Math.round(f * 10) / 10
        if (f >= 870 && f <= 1080) return Math.round(f / 10 * 10) / 10
      }
    }
  }
  if (url) {
    const urlMatch = url.match(/\/fm(\d{2,4})\//i)
    if (urlMatch) {
      let f = parseFloat(urlMatch[1])
      if (f >= 870 && f <= 1080) f = f / 10
      if (f >= FM_MIN && f <= FM_MAX) return Math.round(f * 10) / 10
    }
  }
  return null
}

function stableHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function assignFrequencies(stations) {
  const occupied = new Set()
  const result = []

  for (const s of stations) {
    let freq = parseFrequencyFromName(s.name, s.url_resolved || s.url)
    if (freq !== null) {
      const key = freq.toFixed(1)
      if (occupied.has(key)) {
        freq = null
      } else {
        occupied.add(key)
      }
    }
    if (freq === null) {
      const base = stableHash(s.stationuuid) % 210
      freq = Math.round((FM_MIN + base * 0.1) * 10) / 10
      let key = freq.toFixed(1)
      let attempts = 0
      while (occupied.has(key) && attempts < 210) {
        freq = Math.round((freq + 0.1 - FM_MIN) * 10) / 10
        freq = FM_MIN + (freq % 21.0)
        freq = Math.round(freq * 10) / 10
        key = freq.toFixed(1)
        attempts++
      }
      occupied.add(key)
    }
    result.push({ ...s, frequency: freq })
  }

  return result.sort((a, b) => a.frequency - b.frequency)
}

export function useFrequencyDial() {
  const currentFrequency = ref(87.0)
  const lockedStation = ref(null)
  const isScanning = ref(false)
  const stationsWithFreq = ref([])
  let scanTimer = null

  const knobAngle = computed(() => {
    return ((currentFrequency.value - FM_MIN) / (FM_MAX - FM_MIN)) * 270
  })

  const isLocked = computed(() => lockedStation.value !== null)

  function findNearestStation(freq) {
    let nearest = null
    let minDist = Infinity
    for (const s of stationsWithFreq.value) {
      const dist = Math.abs(s.frequency - freq)
      if (dist < minDist) {
        minDist = dist
        nearest = s
      }
    }
    if (minDist <= LOCK_THRESHOLD) return nearest
    return null
  }

  function checkLock() {
    const station = findNearestStation(currentFrequency.value)
    if (station && (!lockedStation.value || lockedStation.value.stationuuid !== station.stationuuid)) {
      lockedStation.value = station
      currentFrequency.value = station.frequency
    } else if (!station) {
      lockedStation.value = null
    }
  }

  function setFrequency(freq) {
    currentFrequency.value = Math.round(Math.max(FM_MIN, Math.min(FM_MAX, freq)) * 10) / 10
    checkLock()
  }

  function nudgeFrequency(delta) {
    setFrequency(currentFrequency.value + delta)
  }

  function tuneToStation(station) {
    if (station && station.frequency) {
      currentFrequency.value = station.frequency
      lockedStation.value = station
    }
  }

  function autoScan(direction = 1) {
    if (isScanning.value) { stopScan(); return }
    isScanning.value = true
    const startFreq = currentFrequency.value
    let steps = 0
    const maxSteps = 210

    scanTimer = setInterval(() => {
      steps++
      let next = Math.round((currentFrequency.value + direction * 0.1) * 10) / 10
      if (next > FM_MAX) next = FM_MIN
      if (next < FM_MIN) next = FM_MAX
      currentFrequency.value = next

      const station = findNearestStation(next)
      if (station && station.frequency !== startFreq) {
        lockedStation.value = station
        currentFrequency.value = station.frequency
        stopScan()
        return
      }
      if (steps >= maxSteps) stopScan()
    }, SCAN_INTERVAL)
  }

  function stopScan() {
    isScanning.value = false
    if (scanTimer) { clearInterval(scanTimer); scanTimer = null }
  }

  function setStations(stations) {
    stationsWithFreq.value = assignFrequencies(stations)
  }

  onUnmounted(() => { stopScan() })

  return {
    currentFrequency,
    lockedStation,
    isLocked,
    isScanning,
    knobAngle,
    stationsWithFreq,
    setFrequency,
    nudgeFrequency,
    tuneToStation,
    autoScan,
    stopScan,
    setStations,
    FM_MIN,
    FM_MAX,
  }
}
