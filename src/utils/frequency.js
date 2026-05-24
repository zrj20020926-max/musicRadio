const FM_MIN = 87.0
const FM_MAX = 108.0

export function parseFrequencyFromName(name, url) {
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

export function stableFrequencyFromId(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  }
  const base = Math.abs(hash) % 210
  return Math.round((FM_MIN + base * 0.1) * 10) / 10
}

export function normalizeStation(raw) {
  return {
    stationuuid: raw.stationuuid,
    name: raw.name || 'Unknown Station',
    url_resolved: raw.url_resolved || '',
    url: raw.url || '',
    country: raw.country || '',
    countrycode: raw.countrycode || '',
    state: raw.state || '',
    language: raw.language || '',
    tags: raw.tags || '',
    codec: raw.codec || '',
    bitrate: raw.bitrate || 0,
    votes: raw.votes || 0,
    clickcount: raw.clickcount || 0,
    favicon: raw.favicon || '',
    lastcheckok: raw.lastcheckok || 0,
    streamUrl: raw.url_resolved || raw.url || '',
  }
}

export function frequencyToKnobAngle(frequency) {
  return ((frequency - FM_MIN) / (FM_MAX - FM_MIN)) * 270
}

export function frequencyToScalePosition(frequency) {
  return ((frequency - FM_MIN) / (FM_MAX - FM_MIN)) * 100
}

export function findNearestStation(frequency, stations, threshold = 0.15) {
  let nearest = null
  let minDist = Infinity
  for (const s of stations) {
    const dist = Math.abs(s.frequency - frequency)
    if (dist < minDist) {
      minDist = dist
      nearest = s
    }
  }
  return minDist <= threshold ? nearest : null
}

export { FM_MIN, FM_MAX }
