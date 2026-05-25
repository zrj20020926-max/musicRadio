<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import TopNav from './components/TopNav.vue'
import GlobalPlayerBar from './components/GlobalPlayerBar.vue'
import { useRadioStore } from './stores/radio'

const route = useRoute()
const router = useRouter()
const radioStore = useRadioStore()
const {
  currentProgram,
  currentStationId,
  currentStationObj,
  isPlaying,
  isBuffering,
  playbackStatus,
  playbackError,
  progress,
  durationSec,
  durationLabel,
  progressLabel,
  nextEpisodeTitle,
  feedbackMessage,
} = storeToRefs(radioStore)

const navItems = [
  { key: 'home', label: '首页', path: '/' },
  { key: 'discover', label: '发现', path: '/discover' },
  { key: 'programs', label: '节目', path: '/programs' },
  { key: 'live', label: '直播', path: '/live' },
  { key: 'stations', label: '电台', path: '/stations' },
  { key: 'profile', label: '我的', path: '/profile' },
]

const activeNav = computed(() => {
  if (route.path.startsWith('/programs')) {
    return 'programs'
  }
  return navItems.find((item) => item.path === route.path)?.key ?? 'home'
})

function handleNavigate(key) {
  const target = navItems.find((item) => item.key === key)
  if (target) {
    router.push(target.path)
  }
}
</script>

<template>
  <div class="pb-32 font-sans text-paper-900">
    <TopNav :items="navItems" :active="activeNav" @navigate="handleNavigate" />
    <div class="retro-shell">
      <RouterView />
    </div>
    <GlobalPlayerBar
      v-if="currentProgram || currentStationObj"
      :program="currentProgram"
      :station="currentStationObj"
      :is-playing="isPlaying"
      :is-buffering="isBuffering"
      :playback-status="playbackStatus"
      :playback-error="playbackError"
      :progress="progress"
      :duration-sec="durationSec"
      :progress-label="progressLabel"
      :duration-label="durationLabel"
      :next-title="nextEpisodeTitle"
      :feedback="feedbackMessage"
      @toggle="currentStationId ? radioStore.toggleStation() : radioStore.togglePlay(currentProgram?.id)"
      @seek="radioStore.setProgress"
      @next="radioStore.playNext"
      @prev="radioStore.playPrevious"
      @retry="radioStore.retryStation"
    />
  </div>
</template>
