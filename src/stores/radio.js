import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { featuredProgramIds, initialComments, programs, todaySchedule } from '../data/programs'

const FAVORITES_KEY = 'retro-radio-favorites'
const SUBSCRIBED_KEY = 'retro-radio-subscribed'
const COMMENTS_KEY = 'retro-radio-comments'
const CURRENT_KEY = 'retro-radio-current-program'
const PLAY_HISTORY_KEY = 'retro-radio-play-history'
const QUEUE_KEY = 'retro-radio-play-queue'

function loadArray(key, fallback = []) {
  if (typeof window === 'undefined') {
    return fallback
  }
  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return fallback
  }
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function loadString(key, fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }
  return window.localStorage.getItem(key) || fallback
}

function parseDurationToSec(duration) {
  if (!duration || duration === '直播中') {
    return 45 * 60
  }
  const [m = '0', s = '0'] = duration.split(':')
  const minute = Number.parseInt(m, 10)
  const second = Number.parseInt(s, 10)
  if (Number.isNaN(minute) || Number.isNaN(second)) {
    return 45 * 60
  }
  return minute * 60 + second
}

export const useRadioStore = defineStore('radio', () => {
  const isPlaying = ref(false)
  const currentProgramId = ref(loadString(CURRENT_KEY, programs[0].id))
  const favorites = ref(new Set(loadArray(FAVORITES_KEY)))
  const subscribed = ref(new Set(loadArray(SUBSCRIBED_KEY)))
  const comments = ref(loadArray(COMMENTS_KEY, initialComments))
  const playHistory = ref(loadArray(PLAY_HISTORY_KEY))
  const queue = ref(loadArray(QUEUE_KEY).filter((id) => programs.some((item) => item.id === id)))
  const playedStack = ref([])
  const progress = ref(0)
  const currentEpisodeIndex = ref(0)
  const sleepDeadline = ref(null)
  const toasts = ref([])

  const programMap = computed(() => new Map(programs.map((item) => [item.id, item])))

  const currentProgram = computed(() => programMap.value.get(currentProgramId.value) ?? programs[0])

  const currentEpisode = computed(() => {
    const episodes = currentProgram.value?.episodes || []
    if (!episodes.length) {
      return null
    }
    const index = Math.min(currentEpisodeIndex.value, episodes.length - 1)
    return episodes[index]
  })

  const durationSec = computed(() => {
    if (currentEpisode.value) {
      return parseDurationToSec(currentEpisode.value.duration)
    }
    return parseDurationToSec(currentProgram.value.duration)
  })

  const progressRatio = computed(() => {
    if (!durationSec.value) {
      return 0
    }
    return Math.min(progress.value / durationSec.value, 1)
  })

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
    if (nextEpisode) {
      return nextEpisode.title
    }
    if (nextProgram.value) {
      return nextProgram.value.title
    }
    return '暂无下一集'
  })

  const sleepRemainingSec = computed(() => {
    if (!sleepDeadline.value) {
      return 0
    }
    return Math.max(0, Math.ceil((sleepDeadline.value - Date.now()) / 1000))
  })

  const sleepRemainingLabel = computed(() => {
    if (!sleepDeadline.value) {
      return '未设置'
    }
    const total = sleepRemainingSec.value
    const minute = Math.floor(total / 60)
    const second = total % 60
    return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
  })

  const featuredPrograms = computed(() =>
    featuredProgramIds.map((id) => programMap.value.get(id)).filter(Boolean),
  )

  const liveProgram = computed(() => programs.find((item) => item.isLive) ?? programs[0])

  const todaySchedulePrograms = computed(() =>
    todaySchedule
      .map((slot) => ({ ...slot, program: programMap.value.get(slot.programId) }))
      .filter((slot) => slot.program),
  )

  const favoritePrograms = computed(() => programs.filter((item) => favorites.value.has(item.id)))
  const subscribedPrograms = computed(() =>
    programs.filter((item) => subscribed.value.has(item.id)),
  )
  const recentPrograms = computed(() =>
    playHistory.value
      .map((id) => programMap.value.get(id))
      .filter(Boolean)
      .slice(0, 5),
  )

  const stats = computed(() => ({
    subscribedCount: subscribed.value.size,
    favoriteCount: favorites.value.size,
    listenHours: Math.max(24, recentPrograms.value.length * 12 + 48),
  }))

  function pushToast(message) {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, message })
    window.setTimeout(() => {
      toasts.value = toasts.value.filter((item) => item.id !== id)
    }, 2200)
  }

  function updatePlayHistory(programId) {
    playHistory.value = [programId, ...playHistory.value.filter((id) => id !== programId)].slice(
      0,
      20,
    )
  }

  function playProgram(programId, options = {}) {
    if (!programMap.value.has(programId)) {
      return
    }
    if (currentProgramId.value !== programId) {
      playedStack.value.unshift(currentProgramId.value)
      playedStack.value = playedStack.value.slice(0, 30)
    }
    currentProgramId.value = programId
    currentEpisodeIndex.value = 0
    progress.value = options.resume ? progress.value : 0
    isPlaying.value = true
    updatePlayHistory(programId)
    queue.value = queue.value.filter((id) => id !== programId)
  }

  function togglePlay(programId) {
    if (programId && programMap.value.has(programId) && currentProgramId.value !== programId) {
      playProgram(programId)
      return
    }
    isPlaying.value = !isPlaying.value
  }

  function setProgress(nextProgress) {
    const safe = Math.max(0, Math.min(Math.floor(nextProgress), durationSec.value))
    progress.value = safe
  }

  function seekByRatio(ratio) {
    setProgress(durationSec.value * ratio)
  }

  function addToQueue(programId) {
    if (!programMap.value.has(programId) || programId === currentProgramId.value) {
      return
    }
    queue.value = [...queue.value.filter((id) => id !== programId), programId]
    pushToast('已加入播放队列')
  }

  function playNext() {
    const episodes = currentProgram.value?.episodes || []
    if (currentEpisodeIndex.value < episodes.length - 1) {
      currentEpisodeIndex.value += 1
      progress.value = 0
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
  }

  function playPrevious() {
    if (progress.value > 3) {
      progress.value = 0
      return
    }
    const previousId = playedStack.value.shift()
    if (!previousId || !programMap.value.has(previousId)) {
      progress.value = 0
      return
    }
    currentProgramId.value = previousId
    currentEpisodeIndex.value = 0
    progress.value = 0
    isPlaying.value = true
    updatePlayHistory(previousId)
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
    if (!programMap.value.has(programId)) {
      return
    }
    if (favorites.value.has(programId)) {
      favorites.value.delete(programId)
      pushToast('已取消收藏')
    } else {
      favorites.value.add(programId)
      pushToast('已收藏节目')
    }
  }

  function toggleSubscribe(programId) {
    if (!programMap.value.has(programId)) {
      return
    }
    if (subscribed.value.has(programId)) {
      subscribed.value.delete(programId)
      pushToast('已取消订阅')
    } else {
      subscribed.value.add(programId)
      pushToast('订阅成功')
    }
  }

  function addComment(content) {
    comments.value.unshift({
      id: Date.now(),
      user: '你',
      content,
      liked: 0,
    })
    pushToast('留言发送成功')
  }

  function getProgramById(programId) {
    return programMap.value.get(programId)
  }

  if (typeof window !== 'undefined') {
    window.setInterval(() => {
      if (sleepDeadline.value && Date.now() >= sleepDeadline.value) {
        sleepDeadline.value = null
        if (isPlaying.value) {
          isPlaying.value = false
          pushToast('定时关闭已触发，播放已暂停')
        }
      }
      if (!isPlaying.value) {
        return
      }
      if (progress.value >= durationSec.value) {
        playNext()
        return
      }
      progress.value += 1
    }, 1000)
  }

  watch(
    favorites,
    (value) => {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(value)))
    },
    { deep: true },
  )

  watch(
    subscribed,
    (value) => {
      window.localStorage.setItem(SUBSCRIBED_KEY, JSON.stringify(Array.from(value)))
    },
    { deep: true },
  )

  watch(
    comments,
    (value) => {
      window.localStorage.setItem(COMMENTS_KEY, JSON.stringify(value))
    },
    { deep: true },
  )

  watch(currentProgramId, (value) => {
    window.localStorage.setItem(CURRENT_KEY, value)
  })

  watch(
    playHistory,
    (value) => {
      window.localStorage.setItem(PLAY_HISTORY_KEY, JSON.stringify(value))
    },
    { deep: true },
  )

  watch(
    queue,
    (value) => {
      window.localStorage.setItem(QUEUE_KEY, JSON.stringify(value))
    },
    { deep: true },
  )

  const programsRef = computed(() => programs)

  return {
    programs: programsRef,
    isPlaying,
    currentProgram,
    currentEpisode,
    currentEpisodeIndex,
    nextProgram,
    nextEpisodeTitle,
    liveProgram,
    featuredPrograms,
    todaySchedulePrograms,
    favoritePrograms,
    subscribedPrograms,
    recentPrograms,
    favorites,
    subscribed,
    comments,
    stats,
    queue,
    toasts,
    progress,
    progressRatio,
    progressLabel,
    durationLabel,
    sleepRemainingSec,
    sleepRemainingLabel,
    togglePlay,
    playProgram,
    playNext,
    playPrevious,
    setProgress,
    seekByRatio,
    addToQueue,
    setSleepTimer,
    toggleFavorite,
    toggleSubscribe,
    addComment,
    getProgramById,
  }
})
