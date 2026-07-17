import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import Hls from 'hls.js'
import {
  fetchProgramsFromExternal,
  fetchRadioBrowserStations,
  mergeProgramsKeepUnique,
} from '../services/externalContent'
import {
  hasProgramsContent,
  loadLastUpdatedAt,
  loadProgramsContent,
  loadStationsContent,
  saveLastUpdatedAt,
  saveProgramsContent,
  saveStationsContent,
} from '../storage/localContent'
import { programs as seedPrograms } from '../data/programs'

let audio = null
let hls = null
let hasRealSource = false
const REVMA_TOKEN_PARAMS = ['rj-ttl', 'rj-tok', '_revmaSession']
const REVMA_PROXY_PATH = '/__revma_stream__'
const STATION_BUFFER_GRACE_MS = 8000
const STATION_STABLE_PLAY_MS = 30000
const STATION_RECONNECT_DELAYS = [1000, 2500, 5000, 10000, 15000]
const REVMA_MSE_MIME = 'audio/aac'
const REVMA_MSE_APPEND_BYTES = 32 * 1024
const REVMA_MSE_KEEP_BEHIND_SEC = 45
if (typeof window !== 'undefined') {
  audio = new Audio()
  audio.preload = 'auto'
}

function destroyHls() {
  if (hls) {
    hls.destroy()
    hls = null
  }
}

function isHlsUrl(url) {
  return url && (url.includes('.m3u8') || url.includes('m3u8'))
}

function parseAbsoluteUrl(url) {
  if (!url) return null
  try {
    return new URL(url)
  } catch {
    return null
  }
}

function isRevmaRcsUrl(url) {
  const parsed = parseAbsoluteUrl(url)
  return Boolean(parsed && /(^|\.)rcs\.revma\.com$/i.test(parsed.hostname))
}

function hasRevmaTokenParams(url) {
  const parsed = parseAbsoluteUrl(url)
  if (!parsed) return false
  return REVMA_TOKEN_PARAMS.some((param) => parsed.searchParams.has(param))
}

function stripRevmaTokenParams(url) {
  if (!isRevmaRcsUrl(url)) return url
  const parsed = parseAbsoluteUrl(url)
  if (!parsed) return url
  REVMA_TOKEN_PARAMS.forEach((param) => parsed.searchParams.delete(param))
  return parsed.toString()
}

function toRevmaEntryUrl(url) {
  const parsed = parseAbsoluteUrl(stripRevmaTokenParams(url))
  if (!parsed || !isRevmaRcsUrl(parsed.toString())) return url
  parsed.protocol = 'http:'
  parsed.hostname = 'stream.rcs.revma.com'
  parsed.port = ''
  parsed.search = ''
  parsed.hash = ''
  return parsed.toString()
}

function shouldUseLocalRevmaProxy() {
  if (typeof window === 'undefined') return false
  const { hostname, port } = window.location
  return (
    ['localhost', '127.0.0.1', '::1'].includes(hostname) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    (port && !['80', '443'].includes(port))
  )
}

function toLocalRevmaProxyUrl(url) {
  return `${REVMA_PROXY_PATH}?url=${encodeURIComponent(url)}`
}

function isLocalRevmaProxyUrl(url) {
  return typeof url === 'string' && url.startsWith(REVMA_PROXY_PATH)
}

function supportsRevmaMse() {
  if (typeof window === 'undefined') return false
  return Boolean(window.MediaSource?.isTypeSupported?.(REVMA_MSE_MIME))
}

function preferPageProtocol(url) {
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    /^http:\/\//i.test(url)
  ) {
    return url.replace(/^http:\/\//i, 'https://')
  }
  return url
}

function getPlayableUrl(station) {
  const originalUrl = station?.url || ''
  const resolvedUrl = station?.url_resolved || ''
  const shouldUseOriginalUrl =
    originalUrl && isRevmaRcsUrl(resolvedUrl) && hasRevmaTokenParams(resolvedUrl)
  const url = shouldUseOriginalUrl ? originalUrl : resolvedUrl || originalUrl
  if (isRevmaRcsUrl(url)) {
    const entryUrl = toRevmaEntryUrl(url)
    return shouldUseLocalRevmaProxy() ? toLocalRevmaProxyUrl(entryUrl) : preferPageProtocol(entryUrl)
  }
  return preferPageProtocol(stripRevmaTokenParams(url))
}

const FAVORITES_KEY = 'retro-radio-favorites'
const SUBSCRIBED_KEY = 'retro-radio-subscribed'
const CURRENT_KEY = 'retro-radio-current-program'
const CURRENT_STATION_KEY = 'retro-radio-current-station'
const PLAY_HISTORY_KEY = 'retro-radio-play-history'
const QUEUE_KEY = 'retro-radio-play-queue'
const FAVORITE_STATIONS_KEY = 'retro-radio-favorite-stations'
const FAVORITE_FM_STATIONS_KEY = 'retro-radio-favorite-fm-stations'
const SUBSCRIBED_STATIONS_KEY = 'retro-radio-subscribed-stations'
const STATION_CACHE_KEY = 'retro-radio-station-cache'
const LISTENING_SECONDS_KEY = 'retro-radio-listening-seconds'
const VOLUME_KEY = 'retro-radio-volume'

const EMPTY_PROGRAM = {
  id: '',
  title: '暂无节目',
  host: '待更新',
  category: '未分类',
  description: '请点击“更新节目”获取外部内容。',
  duration: '00:00',
  listeners: 0,
  isLive: false,
  cover: { tone: 'from-[#3a2618] to-[#1f130d]', frequency: '00.0 FM' },
  episodes: [],
}

function loadArray(key, fallback = []) {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(key)
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function loadString(key, fallback) {
  if (typeof window === 'undefined') return fallback
  return window.localStorage.getItem(key) || fallback
}

function loadNumber(key, fallback = 0) {
  if (typeof window === 'undefined') return fallback
  const value = Number(window.localStorage.getItem(key))
  return Number.isFinite(value) ? value : fallback
}

function clampVolume(value) {
  const nextValue = Number(value)
  if (!Number.isFinite(nextValue)) return 0.75
  return Math.max(0, Math.min(nextValue, 1))
}

function parseDurationToSec(duration) {
  if (!duration || duration === '直播中') return 45 * 60
  const [m = '0', s = '0'] = String(duration).split(':')
  const minute = Number.parseInt(m, 10)
  const second = Number.parseInt(s, 10)
  if (Number.isNaN(minute) || Number.isNaN(second)) return 45 * 60
  return minute * 60 + second
}

export const useRadioStore = defineStore('radio', () => {
  const programs = ref(loadProgramsContent(seedPrograms))
  if (!hasProgramsContent()) {
    saveProgramsContent(seedPrograms)
  }
  const stations = ref(loadStationsContent())
  const lastUpdatedAt = ref(loadLastUpdatedAt())
  const updateStatus = ref('idle')
  const updateMessage = ref('')

  const playbackStatus = ref('idle')
  const playbackError = ref('')
  let loadTimeoutId = null
  let stationBufferTimeoutId = null
  let stationReconnectTimeoutId = null
  let stationStableTimeoutId = null
  let stationReconnectAttempts = 0
  let revmaAbortController = null
  let revmaMediaSource = null
  let revmaSourceBuffer = null
  let revmaObjectUrl = ''
  let revmaMseRequestId = 0
  let currentRequestId = 0

  const isPlaying = computed(() => playbackStatus.value === 'playing')
  const isBuffering = computed(
    () => playbackStatus.value === 'loading' || playbackStatus.value === 'buffering',
  )
  const currentProgramId = ref(loadString(CURRENT_KEY, programs.value[0]?.id || ''))
  const savedStation = loadString(CURRENT_STATION_KEY, '')
  const currentStationId = ref(savedStation || null)
  const currentStationObj = ref(null)
  const favorites = ref(new Set(loadArray(FAVORITES_KEY)))
  const subscribed = ref(new Set(loadArray(SUBSCRIBED_KEY)))
  const favoriteStations = ref(new Set(loadArray(FAVORITE_STATIONS_KEY)))
  const favoriteFmStations = ref(new Set(loadArray(FAVORITE_FM_STATIONS_KEY)))
  const subscribedStations = ref(new Set(loadArray(SUBSCRIBED_STATIONS_KEY)))
  const stationCache = ref(new Map(loadArray(STATION_CACHE_KEY).map((s) => [s.stationuuid || s.name, s])))

  // Migrate: move CN/FM stations from international favorites to FM favorites
  for (const id of favoriteStations.value) {
    const obj = stationCache.value.get(id)
    if (id.startsWith('known-') || (obj && obj.countrycode === 'CN')) {
      favoriteFmStations.value.add(id)
      favoriteStations.value.delete(id)
    }
  }
  const playHistory = ref(loadArray(PLAY_HISTORY_KEY))
  const queue = ref(
    loadArray(QUEUE_KEY).filter((id) => programs.value.some((item) => item.id === id)),
  )
  const playedStack = ref([])
  const progress = ref(0)
  const currentEpisodeIndex = ref(0)
  const audioDuration = ref(0)
  const sleepDeadline = ref(null)
  const listeningSeconds = ref(loadNumber(LISTENING_SECONDS_KEY))
  const volume = ref(clampVolume(loadNumber(VOLUME_KEY, 0.75)))

  const programMap = computed(() => new Map(programs.value.map((item) => [item.id, item])))

  const currentProgram = computed(() => {
    return programMap.value.get(currentProgramId.value) ?? programs.value[0] ?? EMPTY_PROGRAM
  })

  const currentEpisode = computed(() => {
    const episodes = currentProgram.value?.episodes || []
    if (!episodes.length) return null
    const index = Math.min(currentEpisodeIndex.value, episodes.length - 1)
    return episodes[index]
  })

  const durationSec = computed(() => {
    if (audioDuration.value > 0) return Math.floor(audioDuration.value)
    if (currentEpisode.value) return parseDurationToSec(currentEpisode.value.duration)
    return parseDurationToSec(currentProgram.value.duration)
  })

  const progressRatio = computed(() =>
    durationSec.value ? Math.min(progress.value / durationSec.value, 1) : 0,
  )
  const progressLabel = computed(() => {
    const minute = Math.floor(progress.value / 60)
    const second = progress.value % 60
    return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
  })

  const durationLabel = computed(() => {
    const minute = Math.floor(durationSec.value / 60)
    const second = durationSec.value % 60
    return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
  })

  const nextProgram = computed(() => {
    const nextId = queue.value[0]
    return nextId ? programMap.value.get(nextId) || null : null
  })

  const nextEpisodeTitle = computed(() => {
    const episodes = currentProgram.value?.episodes || []
    const nextEpisode = episodes[currentEpisodeIndex.value + 1]
    if (nextEpisode) return nextEpisode.title
    if (nextProgram.value) return nextProgram.value.title
    return '暂无下一集'
  })

  const sleepRemainingSec = computed(() => {
    if (!sleepDeadline.value) return 0
    return Math.max(0, Math.ceil((sleepDeadline.value - Date.now()) / 1000))
  })

  const sleepRemainingLabel = computed(() => {
    if (!sleepDeadline.value) return '未设置'
    const total = sleepRemainingSec.value
    const minute = Math.floor(total / 60)
    const second = total % 60
    return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
  })

  const listeningMinutes = computed(() => Math.floor(listeningSeconds.value / 60))
  const listeningHourPart = computed(() => Math.floor(listeningMinutes.value / 60))
  const listeningMinutePart = computed(() => listeningMinutes.value % 60)

  const featuredPrograms = computed(() => programs.value.slice(0, 3))

  const liveProgram = computed(
    () => programs.value.find((item) => item.isLive) ?? programs.value[0] ?? null,
  )

  const todaySchedulePrograms = computed(() => {
    if (!programs.value.length) {
      return []
    }
    return programs.value.slice(0, 4).map((program, index) => ({
      time: `${String(7 + index * 4).padStart(2, '0')}:00`,
      program,
    }))
  })

  const favoritePrograms = computed(() =>
    programs.value.filter((item) => favorites.value.has(item.id)),
  )
  const subscribedPrograms = computed(() =>
    programs.value.filter((item) => subscribed.value.has(item.id)),
  )
  const favoriteStationList = computed(() => {
    const result = []
    for (const id of favoriteStations.value) {
      const s = stations.value.find((st) => st.stationuuid === id) || stationCache.value.get(id)
      if (s) result.push(s)
    }
    return result
  })
  const favoriteFmStationList = computed(() => {
    const result = []
    for (const id of favoriteFmStations.value) {
      const s = stations.value.find((st) => st.stationuuid === id) || stationCache.value.get(id)
      if (s) result.push(s)
    }
    return result
  })
  const subscribedStationList = computed(() => {
    const result = []
    for (const id of subscribedStations.value) {
      const s = stations.value.find((st) => st.stationuuid === id) || stationCache.value.get(id)
      if (s) result.push(s)
    }
    return result
  })
  const recentPrograms = computed(() =>
    playHistory.value
      .map((id) => programMap.value.get(id))
      .filter(Boolean)
      .slice(0, 5),
  )

  const stats = computed(() => ({
    subscribedCount: subscribed.value.size + subscribedStations.value.size,
    favoriteCount: favorites.value.size + favoriteStations.value.size,
    listenHours: Math.floor(listeningMinutes.value / 60),
  }))

  const feedbackMessage = ref('')
  let feedbackTimer = null

  let strumCtx = null
  function playStrum() {
    try {
      if (!strumCtx) strumCtx = new (window.AudioContext || window.webkitAudioContext)()
      if (strumCtx.state === 'suspended') strumCtx.resume()
      const notes = [329.63, 392.0, 493.88, 659.25]
      notes.forEach((freq, i) => {
        const osc = strumCtx.createOscillator()
        const gain = strumCtx.createGain()
        osc.type = 'triangle'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.5, strumCtx.currentTime + i * 0.04)
        gain.gain.exponentialRampToValueAtTime(0.001, strumCtx.currentTime + i * 0.04 + 0.5)
        osc.connect(gain).connect(strumCtx.destination)
        osc.start(strumCtx.currentTime + i * 0.04)
        osc.stop(strumCtx.currentTime + i * 0.04 + 0.55)
      })
    } catch (error) {
      console.error('Error playing strum:', error)
    }
  }

  function pushToast(message) {
    feedbackMessage.value = message
    playStrum()
    clearTimeout(feedbackTimer)
    feedbackTimer = setTimeout(() => {
      feedbackMessage.value = ''
    }, 2200)
  }

  function getHistoryKey(item) {
    return typeof item === 'string' ? `program:${item}` : `${item.type}:${item.id}`
  }

  function updatePlayHistory(item) {
    const entry = typeof item === 'string' ? { type: 'program', id: item } : item
    const entryKey = getHistoryKey(entry)
    playHistory.value = [
      entry,
      ...playHistory.value.filter((historyItem) => getHistoryKey(historyItem) !== entryKey),
    ].slice(0, 20)
  }

  function ensureCurrentProgramValid() {
    if (!programMap.value.has(currentProgramId.value)) {
      currentProgramId.value = programs.value[0]?.id || ''
    }
  }

  function loadAudioSource() {
    if (!audio) return
    currentRequestId += 1
    clearTimeout(loadTimeoutId)
    clearStationRecoveryTimers()
    currentStationId.value = null
    currentStationObj.value = null
    destroyHls()
    cleanupRevmaMseStream()
    audioDuration.value = 0
    const episode = currentEpisode.value
    const url = episode?.audioUrl || ''
    if (url && url.startsWith('http')) {
      audio.src = url
      audio.load()
      hasRealSource = true
    } else {
      audio.src = ''
      hasRealSource = false
    }
  }

  function playProgram(programId, options = {}) {
    if (!programMap.value.has(programId)) return
    if (currentProgramId.value !== programId) {
      playedStack.value.unshift(currentProgramId.value)
      playedStack.value = playedStack.value.slice(0, 30)
    }
    currentProgramId.value = programId
    currentEpisodeIndex.value = Number.isInteger(options.episodeIndex) ? options.episodeIndex : 0
    progress.value = options.resume ? progress.value : 0
    playbackStatus.value = 'playing'
    playbackError.value = ''
    clearTimeout(loadTimeoutId)
    updatePlayHistory({ type: 'program', id: programId })
    queue.value = queue.value.filter((id) => id !== programId)
    loadAudioSource()
    if (audio && audio.src) {
      audio.play().catch(() => {})
    }
  }

  function togglePlay(programId) {
    if (
      programId &&
      programMap.value.has(programId) &&
      (currentProgramId.value !== programId || currentStationId.value)
    ) {
      playProgram(programId)
      return
    }
    if (isPlaying.value) {
      playbackStatus.value = 'paused'
      if (audio && audio.src) audio.pause()
    } else {
      playbackStatus.value = 'playing'
      if (audio && audio.src) audio.play().catch(() => {})
    }
  }

  function setProgress(nextProgress) {
    progress.value = Math.max(0, Math.min(Math.floor(nextProgress), durationSec.value))
    if (audio && audio.src && Number.isFinite(audio.duration)) {
      audio.currentTime = progress.value
    }
  }

  function addToQueue(programId) {
    if (!programMap.value.has(programId) || programId === currentProgramId.value) return
    queue.value = [...queue.value.filter((id) => id !== programId), programId]
    pushToast('已加入播放队列')
  }

  function playNext() {
    const episodes = currentProgram.value?.episodes || []
    if (currentEpisodeIndex.value < episodes.length - 1) {
      currentEpisodeIndex.value += 1
      progress.value = 0
      loadAudioSource()
      if (audio && audio.src) audio.play().catch(() => {})
      return
    }
    const nextId = queue.value[0]
    if (nextId) {
      queue.value = queue.value.slice(1)
      playProgram(nextId)
      return
    }
    playbackStatus.value = 'paused'
    progress.value = durationSec.value
    if (audio) audio.pause()
  }

  function playPrevious() {
    if (progress.value > 3) {
      progress.value = 0
      if (audio && audio.src && Number.isFinite(audio.duration)) audio.currentTime = 0
      return
    }
    const previousId = playedStack.value.shift()
    if (!previousId || !programMap.value.has(previousId)) {
      progress.value = 0
      if (audio && audio.src && Number.isFinite(audio.duration)) audio.currentTime = 0
      return
    }
    currentProgramId.value = previousId
    currentEpisodeIndex.value = 0
    progress.value = 0
    playbackStatus.value = 'playing'
    updatePlayHistory(previousId)
    loadAudioSource()
    if (audio && audio.src) audio.play().catch(() => {})
  }

  function setSleepTimer(minutes) {
    if (!minutes) {
      sleepDeadline.value = null
      return
    }
    sleepDeadline.value = Date.now() + minutes * 60 * 1000
    pushToast(`已设置 ${minutes} 分钟后关闭`)
  }

  function setVolume(nextVolume) {
    volume.value = clampVolume(nextVolume)
  }

  function toggleFavorite(programId) {
    if (!programMap.value.has(programId)) return
    if (favorites.value.has(programId)) {
      favorites.value.delete(programId)
      pushToast('已取消收藏')
    } else {
      favorites.value.add(programId)
      pushToast('已收藏节目')
    }
  }

  function toggleSubscribe(programId) {
    if (!programMap.value.has(programId)) return
    if (subscribed.value.has(programId)) {
      subscribed.value.delete(programId)
      pushToast('已取消订阅')
    } else {
      subscribed.value.add(programId)
      pushToast('订阅成功')
    }
  }

  function toggleFavoriteFmStation(stationuuid) {
    if (favoriteFmStations.value.has(stationuuid)) {
      favoriteFmStations.value.delete(stationuuid)
      pushToast('已取消收藏FM电台')
    } else {
      favoriteFmStations.value.add(stationuuid)
      cacheStation(stationuuid)
      pushToast('已收藏FM电台')
    }
  }

  function toggleFavoriteStation(stationuuid) {
    if (favoriteStations.value.has(stationuuid)) {
      favoriteStations.value.delete(stationuuid)
      pushToast('已取消收藏电台')
    } else {
      favoriteStations.value.add(stationuuid)
      cacheStation(stationuuid)
      pushToast('已收藏电台')
    }
  }

  function toggleSubscribeStation(stationuuid) {
    if (subscribedStations.value.has(stationuuid)) {
      subscribedStations.value.delete(stationuuid)
      pushToast('已取消订阅电台')
    } else {
      subscribedStations.value.add(stationuuid)
      cacheStation(stationuuid)
      pushToast('已订阅电台')
    }
  }

  function cacheStation(stationuuid) {
    if (stationCache.value.has(stationuuid)) return
    const obj = stations.value.find((s) => s.stationuuid === stationuuid)
    if (obj) {
      stationCache.value.set(stationuuid, obj)
    }
  }

  const stationsRefreshing = ref(false)

  async function refreshStations() {
    stationsRefreshing.value = true
    try {
      const incoming = await fetchRadioBrowserStations()
      if (incoming.length) {
        stations.value = incoming
        saveStationsContent(incoming)
        pushToast(`已更新 ${incoming.length} 个电台`)
      } else {
        pushToast('电台更新失败')
      }
    } catch {
      pushToast('电台更新失败')
    } finally {
      stationsRefreshing.value = false
    }
  }

  function getProgramById(programId) {
    return programMap.value.get(programId)
  }

  function getStationById(stationId) {
    return stations.value.find((s) => (s.stationuuid || s.name) === stationId)
      || stationCache.value.get(stationId)
      || null
  }

  async function updateExternalContent() {
    console.log('[update-programs] clicked')
    updateStatus.value = 'loading'
    updateMessage.value = '更新中...'

    try {
      const [incomingPrograms, incomingStations] = await Promise.all([
        fetchProgramsFromExternal(),
        fetchRadioBrowserStations(),
      ])

      if (!incomingPrograms.length && !incomingStations.length) {
        updateStatus.value = 'error'
        updateMessage.value = '更新失败，已保留本地内容'
        pushToast('更新失败，已保留本地内容')
        return
      }

      if (incomingPrograms.length) {
        programs.value = incomingPrograms
        saveProgramsContent(incomingPrograms)
      }

      if (incomingStations.length) {
        stations.value = incomingStations
        saveStationsContent(incomingStations)
      }

      ensureCurrentProgramValid()
      lastUpdatedAt.value = new Date().toLocaleString('zh-CN', { hour12: false })
      saveLastUpdatedAt(lastUpdatedAt.value)

      updateStatus.value = 'success'
      updateMessage.value = `更新成功：已更新 ${incomingPrograms.length} 个节目`
      pushToast(`已更新 ${incomingPrograms.length} 个节目`)
    } catch (error) {
      console.error('[update-programs] update flow failed', error)
      updateStatus.value = 'error'
      updateMessage.value = '更新失败，已保留本地内容'
      pushToast('更新失败，已保留本地内容')
    }
  }

  const loadingMore = ref(false)

  async function loadMorePrograms() {
    if (loadingMore.value) return
    loadingMore.value = true
    try {
      const incoming = await fetchProgramsFromExternal()
      if (incoming.length) {
        programs.value = mergeProgramsKeepUnique(programs.value, incoming)
        saveProgramsContent(programs.value)
        ensureCurrentProgramValid()
      }
    } catch (error) {
      console.error('[load-more] failed', error)
    } finally {
      loadingMore.value = false
    }
  }

  function clearStationBufferTimeout() {
    if (stationBufferTimeoutId) {
      clearTimeout(stationBufferTimeoutId)
      stationBufferTimeoutId = null
    }
  }

  function clearStationReconnectTimeout() {
    if (stationReconnectTimeoutId) {
      clearTimeout(stationReconnectTimeoutId)
      stationReconnectTimeoutId = null
    }
  }

  function clearStationStableTimeout() {
    if (stationStableTimeoutId) {
      clearTimeout(stationStableTimeoutId)
      stationStableTimeoutId = null
    }
  }

  function clearStationRecoveryTimers() {
    clearStationBufferTimeout()
    clearStationReconnectTimeout()
    clearStationStableTimeout()
  }

  function beginStationStableWatch() {
    if (!currentStationId.value) return
    clearStationStableTimeout()
    stationStableTimeoutId = setTimeout(() => {
      stationReconnectAttempts = 0
      stationStableTimeoutId = null
    }, STATION_STABLE_PLAY_MS)
  }

  function beginStationBufferWatch() {
    if (!currentStationId.value) return
    clearStationBufferTimeout()
    const requestId = currentRequestId
    stationBufferTimeoutId = setTimeout(() => {
      stationBufferTimeoutId = null
      if (currentRequestId !== requestId || !currentStationId.value) return
      if (playbackStatus.value === 'loading' || playbackStatus.value === 'buffering') {
        handleStationPlaybackFailure('直播流连接中断')
      }
    }, STATION_BUFFER_GRACE_MS)
  }

  function scheduleStationReconnect(message = '直播流连接中断') {
    if (!currentStationId.value || !currentStationObj.value) return
    clearTimeout(loadTimeoutId)
    loadTimeoutId = null
    clearStationBufferTimeout()
    clearStationStableTimeout()
    if (stationReconnectTimeoutId) return

    if (stationReconnectAttempts >= STATION_RECONNECT_DELAYS.length) {
      destroyHls()
      if (audio) audio.pause()
      playbackStatus.value = 'error'
      playbackError.value = message
      return
    }

    const station = currentStationObj.value
    const stationId = station.stationuuid || station.name
    const delay = STATION_RECONNECT_DELAYS[stationReconnectAttempts]
    stationReconnectAttempts += 1
    playbackStatus.value = 'buffering'
    playbackError.value = ''
    destroyHls()
    cleanupRevmaMseStream()
    if (audio) audio.pause()

    stationReconnectTimeoutId = setTimeout(() => {
      stationReconnectTimeoutId = null
      if (!currentStationId.value || currentStationId.value !== stationId) return
      playStation(station, { resetReconnectAttempts: false, silent: true })
    }, delay)
  }

  function handleStationPlaybackFailure(message = '直播流连接中断') {
    if (currentStationId.value && currentStationObj.value) {
      scheduleStationReconnect(message)
    }
  }

  function waitForSourceBufferUpdate(sourceBuffer) {
    if (!sourceBuffer.updating) return Promise.resolve()
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        sourceBuffer.removeEventListener('updateend', onUpdateEnd)
        sourceBuffer.removeEventListener('error', onError)
        sourceBuffer.removeEventListener('abort', onAbort)
      }
      const onUpdateEnd = () => {
        cleanup()
        resolve()
      }
      const onError = () => {
        cleanup()
        reject(new Error('SourceBuffer update failed'))
      }
      const onAbort = () => {
        cleanup()
        reject(new DOMException('SourceBuffer update aborted', 'AbortError'))
      }
      sourceBuffer.addEventListener('updateend', onUpdateEnd, { once: true })
      sourceBuffer.addEventListener('error', onError, { once: true })
      sourceBuffer.addEventListener('abort', onAbort, { once: true })
    })
  }

  async function appendRevmaMseBuffer(chunk, requestId) {
    const sourceBuffer = revmaSourceBuffer
    const mediaSource = revmaMediaSource
    if (
      !chunk?.byteLength ||
      !sourceBuffer ||
      !mediaSource ||
      mediaSource.readyState !== 'open' ||
      currentRequestId !== requestId ||
      revmaMseRequestId !== requestId
    ) {
      return
    }

    await waitForSourceBufferUpdate(sourceBuffer)
    if (currentRequestId !== requestId || revmaMseRequestId !== requestId) return
    sourceBuffer.appendBuffer(chunk)
    await waitForSourceBufferUpdate(sourceBuffer)
    trimRevmaMseBuffer()
  }

  function trimRevmaMseBuffer() {
    const sourceBuffer = revmaSourceBuffer
    if (!audio || !sourceBuffer || sourceBuffer.updating || !sourceBuffer.buffered.length) return
    const trimEnd = audio.currentTime - REVMA_MSE_KEEP_BEHIND_SEC
    if (trimEnd <= 0) return
    const trimStart = sourceBuffer.buffered.start(0)
    const bufferedEnd = sourceBuffer.buffered.end(0)
    const safeTrimEnd = Math.min(trimEnd, bufferedEnd - 1)
    if (safeTrimEnd <= trimStart) return
    try {
      sourceBuffer.remove(trimStart, safeTrimEnd)
    } catch {
      // Trimming is best-effort; playback can continue with a larger buffer.
    }
  }

  function cleanupRevmaMseStream() {
    revmaMseRequestId = 0
    if (revmaAbortController) {
      revmaAbortController.abort()
      revmaAbortController = null
    }
    if (revmaSourceBuffer?.updating) {
      try {
        revmaSourceBuffer.abort()
      } catch {
        // Ignore cleanup races while replacing the media source.
      }
    }
    revmaSourceBuffer = null
    if (revmaMediaSource?.readyState === 'open') {
      try {
        revmaMediaSource.endOfStream()
      } catch {
        // The media source may already be closing.
      }
    }
    revmaMediaSource = null
    if (revmaObjectUrl) {
      URL.revokeObjectURL(revmaObjectUrl)
      revmaObjectUrl = ''
    }
  }

  async function pumpRevmaMseStream(streamUrl, requestId) {
    const controller = revmaAbortController
    try {
      const response = await fetch(streamUrl, {
        cache: 'no-store',
        signal: controller?.signal,
      })
      if (!response.ok || !response.body) {
        throw new Error(`Revma stream failed: ${response.status}`)
      }

      const reader = response.body.getReader()
      let chunks = []
      let chunkBytes = 0

      while (currentRequestId === requestId && revmaMseRequestId === requestId) {
        const { value, done } = await reader.read()
        if (done) throw new Error('Revma stream ended')
        chunks.push(value)
        chunkBytes += value.byteLength
        if (chunkBytes < REVMA_MSE_APPEND_BYTES) continue

        const appendChunk = new Uint8Array(chunkBytes)
        let offset = 0
        for (const chunk of chunks) {
          appendChunk.set(chunk, offset)
          offset += chunk.byteLength
        }
        chunks = []
        chunkBytes = 0
        await appendRevmaMseBuffer(appendChunk, requestId)
      }
    } catch (error) {
      if (error?.name === 'AbortError') return
      if (currentRequestId === requestId && revmaMseRequestId === requestId) {
        handleStationPlaybackFailure('Revma 流式播放中断')
      }
    }
  }

  function startRevmaMseStream(streamUrl, requestId, onPlayBlocked = () => {}) {
    if (!audio || !isLocalRevmaProxyUrl(streamUrl) || !supportsRevmaMse()) return false

    cleanupRevmaMseStream()
    const mediaSource = new MediaSource()
    const objectUrl = URL.createObjectURL(mediaSource)
    const controller = new AbortController()
    revmaMediaSource = mediaSource
    revmaObjectUrl = objectUrl
    revmaAbortController = controller
    revmaMseRequestId = requestId

    audio.src = objectUrl
    audio.load()
    audio.play().catch(onPlayBlocked)

    mediaSource.addEventListener(
      'sourceopen',
      () => {
        if (currentRequestId !== requestId || revmaMseRequestId !== requestId) return
        try {
          revmaSourceBuffer = mediaSource.addSourceBuffer(REVMA_MSE_MIME)
        } catch (error) {
          console.warn('[audio] Revma MSE source buffer failed', error)
          handleStationPlaybackFailure('Revma 流式播放不可用')
          return
        }
        try {
          revmaSourceBuffer.mode = 'sequence'
        } catch (error) {
          console.warn('[audio] Revma MSE sequence mode unavailable', error)
        }
        pumpRevmaMseStream(streamUrl, requestId)
      },
      { once: true },
    )

    mediaSource.addEventListener('sourceended', () => {
      if (currentRequestId === requestId && revmaMseRequestId === requestId) {
        handleStationPlaybackFailure('Revma 流式播放结束')
      }
    })

    return true
  }

  function playStation(station, options = {}) {
    if (!station?.url && !station?.url_resolved) return
    const requestId = ++currentRequestId
    clearTimeout(loadTimeoutId)
    clearStationRecoveryTimers()
    if (options.resetReconnectAttempts !== false) {
      stationReconnectAttempts = 0
    }
    destroyHls()
    cleanupRevmaMseStream()
    if (audio) {
      audio.pause()
      audio.src = ''
    }
    const id = station.stationuuid || station.name
    currentStationId.value = id
    currentStationObj.value = station
    if (id && !stationCache.value.has(id)) {
      stationCache.value.set(id, station)
      stationCache.value = new Map(stationCache.value)
    }
    if (!options.silent) {
      updatePlayHistory({
        type: 'station',
        id,
        title: station.name || id,
        station,
      })
    }
    playbackStatus.value = 'loading'
    playbackError.value = ''
    hasRealSource = true
    const streamUrl = getPlayableUrl(station)
    if (audio) {
      if (startRevmaMseStream(streamUrl, requestId)) {
        // Revma/RCS is appended continuously through MediaSource.
      } else if (isHlsUrl(streamUrl) && Hls.isSupported()) {
        hls = new Hls({ maxBufferLength: 10, maxMaxBufferLength: 30 })
        hls.loadSource(streamUrl)
        hls.attachMedia(audio)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (currentRequestId !== requestId) return
          audio.play().catch(() => {})
        })
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (currentRequestId !== requestId) return
          if (data.fatal) {
            handleStationPlaybackFailure('直播流连接中断')
          }
        })
      } else {
        audio.src = streamUrl
        audio.load()
        audio.play().catch(() => {})
      }
    }
    loadTimeoutId = setTimeout(() => {
      if (currentRequestId !== requestId) return
      if (playbackStatus.value === 'loading' || playbackStatus.value === 'buffering') {
        handleStationPlaybackFailure('直播连接超时')
      }
    }, 15000)
    if (options.silent) return
    pushToast(`正在连接：${station.name}`)
  }

  function stopStation() {
    currentRequestId += 1
    clearTimeout(loadTimeoutId)
    clearStationRecoveryTimers()
    stationReconnectAttempts = 0
    currentStationId.value = null
    currentStationObj.value = null
    hasRealSource = false
    destroyHls()
    cleanupRevmaMseStream()
    if (audio) {
      audio.pause()
      audio.src = ''
    }
    playbackStatus.value = 'idle'
    playbackError.value = ''
  }

  function retryStation() {
    if (!currentStationId.value) return
    const stationObj = getStationById(currentStationId.value)
    if (stationObj) playStation(stationObj)
  }

  function toggleStation() {
    if (!currentStationId.value) return
    if (isPlaying.value) {
      clearStationRecoveryTimers()
      if (audio) audio.pause()
      playbackStatus.value = 'paused'
    } else {
      clearStationRecoveryTimers()
      stationReconnectAttempts = 0
      playbackStatus.value = 'loading'
      playbackError.value = ''
      const requestId = ++currentRequestId
      if (audio && audio.src) {
        audio.play().catch(() => {})
      } else {
        const stationObj = getStationById(currentStationId.value)
        if (stationObj) {
          playStation(stationObj)
          return
        }
      }
      clearTimeout(loadTimeoutId)
      loadTimeoutId = setTimeout(() => {
        if (currentRequestId !== requestId) return
        if (playbackStatus.value === 'loading' || playbackStatus.value === 'buffering') {
          handleStationPlaybackFailure('直播连接超时')
        }
      }, 12000)
    }
  }

  if (typeof window !== 'undefined' && audio) {
    audio.volume = volume.value

    audio.addEventListener('durationchange', () => {
      if (Number.isFinite(audio.duration)) audioDuration.value = audio.duration
    })
    audio.addEventListener('timeupdate', () => {
      if (!currentStationId.value && Number.isFinite(audio.duration)) {
        progress.value = Math.floor(audio.currentTime)
      }
    })
    audio.addEventListener('ended', () => {
      if (currentStationId.value) {
        handleStationPlaybackFailure('直播流连接中断')
        return
      }
      playNext()
    })
    audio.addEventListener('error', () => {
      console.warn('[audio] playback error', audio.error)
      if (currentStationId.value) {
        handleStationPlaybackFailure('直播流连接中断')
      }
    })
    audio.addEventListener('loadstart', () => {
      if (currentStationId.value && playbackStatus.value !== 'error') {
        playbackStatus.value = 'loading'
      }
    })
    audio.addEventListener('waiting', () => {
      if (currentStationId.value && playbackStatus.value !== 'error') {
        playbackStatus.value = 'buffering'
        beginStationBufferWatch()
      }
    })
    audio.addEventListener('playing', () => {
      clearTimeout(loadTimeoutId)
      clearStationBufferTimeout()
      clearStationReconnectTimeout()
      playbackStatus.value = 'playing'
      playbackError.value = ''
      beginStationStableWatch()
    })
    audio.addEventListener('canplay', () => {
      clearTimeout(loadTimeoutId)
      clearStationBufferTimeout()
    })
    audio.addEventListener('stalled', () => {
      if (currentStationId.value && playbackStatus.value !== 'error') {
        playbackStatus.value = 'buffering'
        beginStationBufferWatch()
      }
    })

    if (currentStationId.value) {
      const savedStationObj =
        stations.value.find((s) => (s.stationuuid || s.name) === currentStationId.value) ||
        stationCache.value.get(currentStationId.value)
      if (savedStationObj) {
        currentStationObj.value = savedStationObj
        const url = getPlayableUrl(savedStationObj)
        if (url) {
          hasRealSource = true
          playbackStatus.value = 'loading'
          const onPlayBlocked = () => {
            playbackStatus.value = 'paused'
            playbackError.value = ''
          }
          const autoplayTimeout = setTimeout(() => {
            if (playbackStatus.value === 'loading' || playbackStatus.value === 'buffering') {
              playbackStatus.value = 'paused'
              playbackError.value = ''
            }
          }, 3000)
          const clearAutoplayTimeout = () => clearTimeout(autoplayTimeout)
          audio.addEventListener('playing', clearAutoplayTimeout, { once: true })
          const requestId = ++currentRequestId
          if (startRevmaMseStream(url, requestId, onPlayBlocked)) {
            // Revma/RCS is appended continuously through MediaSource.
          } else if (isHlsUrl(url) && Hls.isSupported()) {
            hls = new Hls({ maxBufferLength: 10, maxMaxBufferLength: 30 })
            hls.loadSource(url)
            hls.attachMedia(audio)
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (currentRequestId !== requestId) return
              audio.play().catch(onPlayBlocked)
            })
            hls.on(Hls.Events.ERROR, (_event, data) => {
              if (currentRequestId !== requestId) return
              if (data.fatal) {
                clearAutoplayTimeout()
                handleStationPlaybackFailure('直播流连接中断')
              }
            })
          } else {
            audio.src = url
            audio.load()
            audio.play().catch(onPlayBlocked)
          }
        }
      } else {
        currentStationId.value = null
      }
    } else {
      loadAudioSource()
    }

    window.setInterval(() => {
      if (sleepDeadline.value && Date.now() >= sleepDeadline.value) {
        sleepDeadline.value = null
        if (isPlaying.value) {
          playbackStatus.value = 'paused'
          if (audio) audio.pause()
          pushToast('定时关闭已触发，播放已暂停')
        }
      }
      if (!isPlaying.value) return
      listeningSeconds.value += 1
      if (!hasRealSource && !currentStationId.value) {
        if (progress.value >= durationSec.value) {
          playNext()
          return
        }
        progress.value += 1
      }
    }, 1000)
  }

  watch(
    favorites,
    (value) => window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(value))),
    { deep: true },
  )
  watch(
    subscribed,
    (value) => window.localStorage.setItem(SUBSCRIBED_KEY, JSON.stringify(Array.from(value))),
    { deep: true },
  )
  watch(
    favoriteStations,
    (value) =>
      window.localStorage.setItem(FAVORITE_STATIONS_KEY, JSON.stringify(Array.from(value))),
    { deep: true },
  )
  watch(
    favoriteFmStations,
    (value) =>
      window.localStorage.setItem(FAVORITE_FM_STATIONS_KEY, JSON.stringify(Array.from(value))),
    { deep: true },
  )
  watch(
    subscribedStations,
    (value) =>
      window.localStorage.setItem(SUBSCRIBED_STATIONS_KEY, JSON.stringify(Array.from(value))),
    { deep: true },
  )
  watch(
    stationCache,
    (value) =>
      window.localStorage.setItem(STATION_CACHE_KEY, JSON.stringify(Array.from(value.values()))),
    { deep: true },
  )
  watch(currentProgramId, (value) => window.localStorage.setItem(CURRENT_KEY, value))
  watch(currentStationId, (value) => {
    if (value) {
      window.localStorage.setItem(CURRENT_STATION_KEY, value)
    } else {
      window.localStorage.removeItem(CURRENT_STATION_KEY)
    }
  })
  watch(
    playHistory,
    (value) => window.localStorage.setItem(PLAY_HISTORY_KEY, JSON.stringify(value)),
    {
      deep: true,
    },
  )
  watch(queue, (value) => window.localStorage.setItem(QUEUE_KEY, JSON.stringify(value)), {
    deep: true,
  })
  watch(listeningSeconds, (value) => {
    window.localStorage.setItem(LISTENING_SECONDS_KEY, String(value))
  })
  watch(volume, (value) => {
    if (audio) audio.volume = value
    window.localStorage.setItem(VOLUME_KEY, String(value))
  })

  return {
    programs,
    stations,
    lastUpdatedAt,
    updateStatus,
    updateMessage,
    isPlaying,
    isBuffering,
    playbackStatus,
    playbackError,
    currentProgram,
    currentEpisode,
    currentEpisodeIndex,
    currentStationId,
    currentStationObj,
    nextProgram,
    nextEpisodeTitle,
    liveProgram,
    featuredPrograms,
    todaySchedulePrograms,
    favoritePrograms,
    subscribedPrograms,
    favoriteStationList,
    favoriteFmStationList,
    subscribedStationList,
    favoriteStations,
    favoriteFmStations,
    subscribedStations,
    recentPrograms,
    playHistory,
    favorites,
    subscribed,
    stats,
    queue,
    feedbackMessage,
    stationsRefreshing,
    progress,
    progressRatio,
    progressLabel,
    durationSec,
    durationLabel,
    sleepRemainingSec,
    sleepRemainingLabel,
    listeningMinutes,
    listeningHourPart,
    listeningMinutePart,
    volume,
    togglePlay,
    playProgram,
    playNext,
    playPrevious,
    setProgress,
    addToQueue,
    setSleepTimer,
    setVolume,
    toggleFavorite,
    toggleSubscribe,
    toggleFavoriteStation,
    toggleFavoriteFmStation,
    toggleSubscribeStation,
    refreshStations,
    getProgramById,
    getStationById,
    updateExternalContent,
    loadMorePrograms,
    loadingMore,
    playStation,
    toggleStation,
    stopStation,
    retryStation,
  }
})
