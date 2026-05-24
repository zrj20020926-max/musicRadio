<script setup>
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import MiniPlayer from '../components/MiniPlayer.vue'
import ProgramCard from '../components/ProgramCard.vue'
import RadioPanel from '../components/RadioPanel.vue'
import SchedulePanel from '../components/SchedulePanel.vue'
import { useRadioStore } from '../stores/radio'

const router = useRouter()
const radioStore = useRadioStore()
const {
  isPlaying,
  currentProgram,
  subscribed,
  favorites,
  featuredPrograms,
  todaySchedulePrograms,
} = storeToRefs(radioStore)

function goProgramDetail(programId) {
  router.push(`/programs/${programId}`)
}
</script>

<template>
  <main class="mt-6 grid w-full grid-cols-1 gap-6 lg:mt-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
    <section>
      <h2 class="font-retro text-7xl leading-[1.1] text-paper-900">复古电台</h2>
      <p class="mt-2 font-retro text-5xl text-paper-900">一段声音。一段陪伴</p>
      <p class="mt-6 max-w-xl text-3xl leading-relaxed text-paper-700">
        有人在说话，有音乐在流淌，像深夜里的一盏灯，陪你度过每一个安静时刻。
      </p>
      <div class="mt-8">
        <MiniPlayer
          :program="currentProgram"
          :is-playing="isPlaying"
          @toggle="radioStore.togglePlay()"
        />
      </div>
      <div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ProgramCard
          v-for="program in featuredPrograms.slice(0, 2)"
          :key="program.id"
          :program="program"
          :is-subscribed="subscribed.has(program.id)"
          :is-favorite="favorites.has(program.id)"
          @play="radioStore.playProgram"
          @subscribe="radioStore.toggleSubscribe"
          @favorite="radioStore.toggleFavorite"
          @detail="goProgramDetail"
        />
      </div>
    </section>
    <section class="space-y-5">
      <RadioPanel />
      <SchedulePanel :schedules="todaySchedulePrograms" @select="radioStore.playProgram" />
    </section>
  </main>
</template>
