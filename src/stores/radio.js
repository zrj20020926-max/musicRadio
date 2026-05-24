import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { fetchProgramsFromExternal, fetchRadioBrowserStations } from '../services/externalContent'
import {
  hasProgramsContent,
  loadLastUpdatedAt,
  loadProgramsContent,
  loadStationsContent,
  saveLastUpdatedAt,
  saveProgramsContent,
  saveStationsContent,
} from '../storage/localContent'

let audio = null
let hasRealSource = false
if (typeof window !== 'undefined') {
  audio = new Audio()
  audio.preload = 'auto'
}

const FAVORITES_KEY = 'retro-radio-favorites'
const SUBSCRIBED_KEY = 'retro-radio-subscribed'
const COMMENTS_KEY = 'retro-radio-comments'
const CURRENT_KEY = 'retro-radio-current-program'
const CURRENT_STATION_KEY = 'retro-radio-current-station'
const PLAY_HISTORY_KEY = 'retro-radio-play-history'
const QUEUE_KEY = 'retro-radio-play-queue'
const FAVORITE_STATIONS_KEY = 'retro-radio-favorite-stations'
const SUBSCRIBED_STATIONS_KEY = 'retro-radio-subscribed-stations'

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

function parseDurationToSec(duration) {
  if (!duration || duration === '直播中') return 45 * 60
  const [m = '0', s = '0'] = String(duration).split(':')
  const minute = Number.parseInt(m, 10)
  const second = Number.parseInt(s, 10)
  if (Number.isNaN(minute) || Number.isNaN(second)) return 45 * 60
  return minute * 60 + second
}

export const useRadioStore = defineStore('radio', () => {
  const programs = ref(loadProgramsContent([]))
  if (!hasProgramsContent()) {
    saveProgramsContent([])
  }
  const stations = ref(loadStationsContent())
  const lastUpdatedAt = ref(loadLastUpdatedAt())
  const updateStatus = ref('idle')
  const updateMessage = ref('')

  const isPlaying = ref(false)
  const currentProgramId = ref(loadString(CURRENT_KEY, programs.value[0]?.id || ''))
  const savedStation = loadString(CURRENT_STATION_KEY, '')
  const currentStationId = ref(savedStation || null)
  const favorites = ref(new Set(loadArray(FAVORITES_KEY)))
  const subscribed = ref(new Set(loadArray(SUBSCRIBED_KEY)))
  const favoriteStations = ref(new Set(loadArray(FAVORITE_STATIONS_KEY)))
  const subscribedStations = ref(new Set(loadArray(SUBSCRIBED_STATIONS_KEY)))
  const comments = ref(loadArray(COMMENTS_KEY, []))
  const playHistory = ref(loadArray(PLAY_HISTORY_KEY))
  const queue = ref(
    loadArray(QUEUE_KEY).filter((id) => programs.value.some((item) => item.id === id)),
  )
  const playedStack = ref([])
  const progress = ref(0)
  const currentEpisodeIndex = ref(0)
  const audioDuration = ref(0)
  const sleepDeadline = ref(null)

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

  const featuredPrograms = computed(() => programs.value.slice(0, 3))

  const liveProgram = computed(() => programs.value.find((item) => item.isLive) ?? programs.value[0] ?? null)

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
  const favoriteStationList = computed(() =>
    stations.value.filter((s) => favoriteStations.value.has(s.stationuuid)),
  )
  const subscribedStationList = computed(() =>
    stations.value.filter((s) => subscribedStations.value.has(s.stationuuid)),
  )
  const recentPrograms = computed(() =>
    playHistory.value
      .map((id) => programMap.value.get(id))
      .filter(Boolean)
      .slice(0, 5),
  )

  const stats = computed(() => ({
    subscribedCount: subscribed.value.size + subscribedStations.value.size,
    favoriteCount: favorites.value.size + favoriteStations.value.size,
    listenHours: Math.max(24, recentPrograms.value.length * 12 + 48),
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
    } catch {}
  }

  function pushToast(message) {
    feedbackMessage.value = message
    playStrum()
    clearTimeout(feedbackTimer)
    feedbackTimer = setTimeout(() => { feedbackMessage.value = '' }, 2200)
  }

  function updatePlayHistory(programId) {
    playHistory.value = [programId, ...playHistory.value.filter((id) => id !== programId)].slice(
      0,
      20,
    )
  }

  function ensureCurrentProgramValid() {
    if (!programMap.value.has(currentProgramId.value)) {
      currentProgramId.value = programs.value[0]?.id || ''
    }
  }

  function loadAudioSource() {
    if (!audio) return
    currentStationId.value = null
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
    isPlaying.value = true
    updatePlayHistory(programId)
    queue.value = queue.value.filter((id) => id !== programId)
    loadAudioSource()
    if (audio && audio.src) {
      audio.play().catch(() => {})
    }
  }

  function togglePlay(programId) {
    if (programId && programMap.value.has(programId) && currentProgramId.value !== programId) {
      playProgram(programId)
      return
    }
    isPlaying.value = !isPlaying.value
    if (audio && audio.src) {
      if (isPlaying.value) {
        audio.play().catch(() => {})
      } else {
        audio.pause()
      }
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
    isPlaying.value = false
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
    isPlaying.value = true
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

  function toggleFavoriteStation(stationuuid) {
    if (favoriteStations.value.has(stationuuid)) {
      favoriteStations.value.delete(stationuuid)
      pushToast('已取消收藏电台')
    } else {
      favoriteStations.value.add(stationuuid)
      pushToast('已收藏电台')
    }
  }

  function toggleSubscribeStation(stationuuid) {
    if (subscribedStations.value.has(stationuuid)) {
      subscribedStations.value.delete(stationuuid)
      pushToast('已取消订阅电台')
    } else {
      subscribedStations.value.add(stationuuid)
      pushToast('已订阅电台')
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

  function addComment(content) {
    comments.value.unshift({ id: Date.now(), user: '你', content, liked: 0 })
    pushToast('留言发送成功')
  }

  function getProgramById(programId) {
    return programMap.value.get(programId)
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

  function playStation(station) {
    if (!station?.url) return
    currentStationId.value = station.stationuuid || station.name
    hasRealSource = true
    if (audio) {
      audio.src = station.url_resolved || station.url
      audio.load()
      audio.play().catch(() => {})
    }
    isPlaying.value = true
    pushToast(`正在收听：${station.name}`)
  }

  function stopStation() {
    currentStationId.value = null
    hasRealSource = false
    if (audio) {
      audio.pause()
      audio.src = ''
    }
    isPlaying.value = false
  }

  function toggleStation() {
    if (!currentStationId.value) return
    if (isPlaying.value) {
      if (audio) audio.pause()
      isPlaying.value = false
    } else {
      if (audio && audio.src) {
        audio.play().catch(() => {})
      } else {
        const stationObj = stations.value.find(
          (s) => (s.stationuuid || s.name) === currentStationId.value,
        )
        if (stationObj) {
          const url = stationObj.url_resolved || stationObj.url
          if (url) {
            audio.src = url
            audio.load()
            audio.play().catch(() => {})
            hasRealSource = true
          }
        }
      }
      isPlaying.value = true
    }
  }

  if (typeof window !== 'undefined' && audio) {
    audio.addEventListener('durationchange', () => {
      if (Number.isFinite(audio.duration)) audioDuration.value = audio.duration
    })
    audio.addEventListener('timeupdate', () => {
      if (!currentStationId.value && Number.isFinite(audio.duration)) {
        progress.value = Math.floor(audio.currentTime)
      }
    })
    audio.addEventListener('ended', () => {
      if (!currentStationId.value) playNext()
    })
    audio.addEventListener('error', () => {
      console.warn('[audio] playback error', audio.error)
    })

    if (currentStationId.value) {
      const savedStationObj = stations.value.find(
        (s) => (s.stationuuid || s.name) === currentStationId.value,
      )
      if (savedStationObj) {
        const url = savedStationObj.url_resolved || savedStationObj.url
        if (url) {
          audio.src = url
          audio.load()
          hasRealSource = true
        }
      }
    } else {
      loadAudioSource()
    }

    window.setInterval(() => {
      if (sleepDeadline.value && Date.now() >= sleepDeadline.value) {
        sleepDeadline.value = null
        if (isPlaying.value) {
          isPlaying.value = false
          if (audio) audio.pause()
          pushToast('定时关闭已触发，播放已暂停')
        }
      }
      if (!isPlaying.value) return
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
    (value) => window.localStorage.setItem(FAVORITE_STATIONS_KEY, JSON.stringify(Array.from(value))),
    { deep: true },
  )
  watch(
    subscribedStations,
    (value) => window.localStorage.setItem(SUBSCRIBED_STATIONS_KEY, JSON.stringify(Array.from(value))),
    { deep: true },
  )
  watch(comments, (value) => window.localStorage.setItem(COMMENTS_KEY, JSON.stringify(value)), {
    deep: true,
  })
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

  return {
    programs,
    stations,
    lastUpdatedAt,
    updateStatus,
    updateMessage,
    isPlaying,
    currentProgram,
    currentEpisode,
    currentEpisodeIndex,
    currentStationId,
    nextProgram,
    nextEpisodeTitle,
    liveProgram,
    featuredPrograms,
    todaySchedulePrograms,
    favoritePrograms,
    subscribedPrograms,
    favoriteStationList,
    subscribedStationList,
    favoriteStations,
    subscribedStations,
    recentPrograms,
    favorites,
    subscribed,
    comments,
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
    togglePlay,
    playProgram,
    playNext,
    playPrevious,
    setProgress,
    addToQueue,
    setSleepTimer,
    toggleFavorite,
    toggleSubscribe,
    toggleFavoriteStation,
    toggleSubscribeStation,
    refreshStations,
    addComment,
    getProgramById,
    updateExternalContent,
    playStation,
    toggleStation,
    stopStation,
  }
})
