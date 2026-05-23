import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { featuredProgramIds, initialComments, programs, todaySchedule } from '../data/programs'

const FAVORITES_KEY = 'retro-radio-favorites'
const SUBSCRIBED_KEY = 'retro-radio-subscribed'
const COMMENTS_KEY = 'retro-radio-comments'
const CURRENT_KEY = 'retro-radio-current-program'
const PLAY_HISTORY_KEY = 'retro-radio-play-history'

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

export const useRadioStore = defineStore('radio', () => {
  const isPlaying = ref(false)
  const currentProgramId = ref(loadString(CURRENT_KEY, programs[0].id))
  const favorites = ref(new Set(loadArray(FAVORITES_KEY)))
  const subscribed = ref(new Set(loadArray(SUBSCRIBED_KEY)))
  const comments = ref(loadArray(COMMENTS_KEY, initialComments))
  const playHistory = ref(loadArray(PLAY_HISTORY_KEY))

  const programMap = computed(() => new Map(programs.map((item) => [item.id, item])))

  const currentProgram = computed(() => programMap.value.get(currentProgramId.value) ?? programs[0])

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

  function updatePlayHistory(programId) {
    playHistory.value = [programId, ...playHistory.value.filter((id) => id !== programId)].slice(
      0,
      20,
    )
  }

  function togglePlay(programId) {
    if (programId && programMap.value.has(programId)) {
      currentProgramId.value = programId
      updatePlayHistory(programId)
    }
    isPlaying.value = !isPlaying.value
  }

  function playProgram(programId) {
    if (!programMap.value.has(programId)) {
      return
    }
    currentProgramId.value = programId
    isPlaying.value = true
    updatePlayHistory(programId)
  }

  function toggleFavorite(programId) {
    if (!programMap.value.has(programId)) {
      return
    }
    if (favorites.value.has(programId)) {
      favorites.value.delete(programId)
    } else {
      favorites.value.add(programId)
    }
  }

  function toggleSubscribe(programId) {
    if (!programMap.value.has(programId)) {
      return
    }
    if (subscribed.value.has(programId)) {
      subscribed.value.delete(programId)
    } else {
      subscribed.value.add(programId)
    }
  }

  function addComment(content) {
    comments.value.unshift({
      id: Date.now(),
      user: '你',
      content,
      liked: 0,
    })
  }

  function getProgramById(programId) {
    return programMap.value.get(programId)
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

  const programsRef = computed(() => programs)

  return {
    programs: programsRef,
    isPlaying,
    currentProgram,
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
    togglePlay,
    playProgram,
    toggleFavorite,
    toggleSubscribe,
    addComment,
    getProgramById,
  }
})
