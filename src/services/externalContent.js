const ITUNES_KEYWORDS = ['音乐', '电台', '故事', '睡前', '爵士', '怀旧', '城市', '深夜', '情感', '播客']

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickRandom(list, count) {
  const copied = [...list]
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copied[i], copied[j]] = [copied[j], copied[i]]
  }
  return copied.slice(0, count)
}

function toDateLabel(value) {
  if (!value) {
    return new Date().toISOString().slice(0, 10)
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10)
  }
  return date.toISOString().slice(0, 10)
}

function normalizeDuration(value) {
  if (!value) {
    return ''
  }
  if (typeof value === 'number') {
    const m = Math.floor(value / 60)
    const s = value % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  const text = String(value).trim()
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(text)) {
    const parts = text.split(':').map((num) => Number.parseInt(num, 10))
    if (parts.length === 2) {
      return `${String(parts[0]).padStart(2, '0')}:${String(parts[1]).padStart(2, '0')}`
    }
    return `${String(parts[1]).padStart(2, '0')}:${String(parts[2]).padStart(2, '0')}`
  }
  return ''
}

function safeId(text, prefix) {
  return `${prefix}_${String(text || Date.now())}`.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 64)
}

function createFallbackEpisode(podcast, externalId) {
  return {
    id: safeId(`fallback_${externalId}`, 'episode'),
    guid: `fallback_${externalId}`,
    title: `${podcast.collectionName || podcast.trackName || '节目'} 预告`,
    description: podcast.description || '该节目暂无可解析分集，已生成占位分集用于播放体验。',
    pubDate: toDateLabel(podcast.releaseDate),
    duration: '',
    audioUrl: '',
    image: podcast.artworkUrl600 || podcast.artworkUrl100 || '',
  }
}

function mapPodcastToProgram(podcast, items) {
  const externalId = String(podcast.collectionId || podcast.trackId || podcast.collectionName || Date.now())
  const coverUrl = podcast.artworkUrl600 || podcast.artworkUrl100 || ''
  const parsedEpisodes = items.map((item, index) => ({
    id: safeId(item.trackId || item.guid || `${externalId}_${index}`, 'episode'),
    guid: String(item.trackId || item.guid || `${externalId}_${index}`),
    title: item.trackName || item.title || `第 ${index + 1} 集`,
    description: item.description || item.shortDescription || '暂无简介',
    pubDate: toDateLabel(item.releaseDate || item.pubDate),
    duration: item.trackTimeMillis ? normalizeDuration(Math.floor(item.trackTimeMillis / 1000)) : normalizeDuration(item['itunes:duration'] || item.duration),
    audioUrl: item.episodeUrl || item.enclosure?.link || item.enclosure?.url || '',
    image: item.artworkUrl160 || item.artworkUrl600 || coverUrl,
  }))

  const episodes = parsedEpisodes.length ? parsedEpisodes : [createFallbackEpisode(podcast, externalId)]

  return {
    id: safeId(`program_${externalId}`, 'program'),
    externalId,
    source: 'itunes',
    title: podcast.collectionName || podcast.trackName || '未命名节目',
    host: podcast.artistName || '未知主播',
    description: podcast.description || podcast.primaryGenreName || '来自外部更新的节目内容',
    category: podcast.primaryGenreName || '播客',
    cover: {
      tone: 'from-[#3a2618] to-[#1f130d]',
      frequency: podcast.collectionId ? `${String(podcast.collectionId).slice(-3, -1)}.${String(podcast.collectionId).slice(-1)} FM` : '88.0 FM',
      image: coverUrl,
    },
    feedUrl: podcast.feedUrl || '',
    listeners: podcast.trackCount || 0,
    isLive: false,
    date: toDateLabel(podcast.releaseDate),
    duration: episodes[0]?.duration || '',
    episodes,
  }
}

export async function fetchItunesPodcasts() {
  const keyword = ITUNES_KEYWORDS[randomInt(0, ITUNES_KEYWORDS.length - 1)]
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}&media=podcast&entity=podcast&limit=50&country=CN`
  try {
    console.log('[update-programs] fetching', url)
    const response = await fetch(url)
    if (!response.ok) {
      console.error('[update-programs] itunes bad response', response.status)
      return []
    }
    const data = await response.json()
    return Array.isArray(data.results) ? data.results : []
  } catch (error) {
    console.error('[update-programs] itunes request failed', error)
    return []
  }
}

export async function fetchEpisodesByItunes(collectionId) {
  if (!collectionId) return []
  const url = `https://itunes.apple.com/lookup?id=${collectionId}&media=podcast&entity=podcastEpisode&limit=10&country=CN`
  try {
    const response = await fetch(url)
    if (!response.ok) return []
    const data = await response.json()
    const results = data.results || []
    return results.filter((r) => r.wrapperType === 'podcastEpisode')
  } catch {
    return []
  }
}

export async function fetchRadioBrowserStations() {
  const url = 'https://de1.api.radio-browser.info/json/stations/bytag/music?limit=50'
  try {
    console.log('[update-programs] fetching', url)
    const response = await fetch(url)
    if (!response.ok) {
      console.error('[update-programs] radio browser bad response', response.status)
      return []
    }
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('[update-programs] radio browser request failed', error)
    return []
  }
}

export async function fetchProgramsFromExternal() {
  const podcasts = await fetchItunesPodcasts()
  const selected = pickRandom(
    podcasts.filter((item) => item.feedUrl || item.collectionName || item.trackName),
    6,
  )

  const programs = []
  for (const podcast of selected) {
    const collectionId = podcast.collectionId || podcast.trackId
    const items = await fetchEpisodesByItunes(collectionId)
    programs.push(mapPodcastToProgram(podcast, items))
  }
  return programs
}

export function mergeProgramsKeepUnique(currentPrograms, incomingPrograms) {
  const merged = []
  const keySet = new Set()

  const pushWithKey = (program) => {
    const key = `${program.externalId || ''}::${program.feedUrl || ''}::${program.title}`
    if (keySet.has(key)) {
      return
    }
    keySet.add(key)

    const episodeGuidSet = new Set()
    const uniqueEpisodes = (program.episodes || []).filter((episode) => {
      const guidKey = episode.guid || episode.id || `${episode.title}_${episode.pubDate}`
      if (episodeGuidSet.has(guidKey)) {
        return false
      }
      episodeGuidSet.add(guidKey)
      return true
    })

    merged.push({ ...program, episodes: uniqueEpisodes })
  }

  currentPrograms.forEach(pushWithKey)
  incomingPrograms.forEach(pushWithKey)

  return merged
}
