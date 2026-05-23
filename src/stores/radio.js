import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { initialComments, topPrograms } from '../data/mockData'

export const useRadioStore = defineStore('radio', () => {
  const isPlaying = ref(false)
  const currentProgramId = ref(topPrograms[0].id)
  const subscribed = ref(new Set())
  const favorites = ref(new Set())
  const comments = ref([...initialComments])

  const currentProgram = computed(
    () => topPrograms.find((program) => program.id === currentProgramId.value) ?? topPrograms[0],
  )

  function togglePlay(programId) {
    if (programId) {
      currentProgramId.value = programId
    }
    isPlaying.value = !isPlaying.value
  }

  function playProgram(programId) {
    currentProgramId.value = programId
    isPlaying.value = true
  }

  function toggleSubscribe(programId) {
    if (subscribed.value.has(programId)) {
      subscribed.value.delete(programId)
      return
    }
    subscribed.value.add(programId)
  }

  function toggleFavorite(programId) {
    if (favorites.value.has(programId)) {
      favorites.value.delete(programId)
      return
    }
    favorites.value.add(programId)
  }

  function addComment(content) {
    comments.value.unshift({
      id: Date.now(),
      user: '你',
      content,
      liked: 0,
    })
  }

  return {
    isPlaying,
    currentProgram,
    subscribed,
    favorites,
    comments,
    togglePlay,
    playProgram,
    toggleSubscribe,
    toggleFavorite,
    addComment,
  }
})
