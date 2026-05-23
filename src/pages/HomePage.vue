<script setup>
import { storeToRefs } from 'pinia'
import MiniPlayer from '../components/MiniPlayer.vue'
import ProgramCard from '../components/ProgramCard.vue'
import RadioPanel from '../components/RadioPanel.vue'
import SchedulePanel from '../components/SchedulePanel.vue'
import { schedules, topPrograms } from '../data/mockData'
import { useRadioStore } from '../stores/radio'

const radioStore = useRadioStore()
const { isPlaying, currentProgram, subscribed, favorites } = storeToRefs(radioStore)
</script>

<template>
  <main class="mt-8 grid w-full grid-cols-[1.1fr_0.9fr] gap-8 max-[1100px]:grid-cols-1">
    <section>
      <h2 class="font-retro text-7xl leading-[1.1] text-paper-900">复古电台</h2>
      <p class="mt-2 font-retro text-5xl text-paper-900">一段声音。一段陪伴</p>
      <p class="mt-6 max-w-xl text-3xl leading-relaxed text-paper-700">
        有人在说话，有音乐在流淌，像深夜里的一盏灯，陪你度过每一个安静时刻。
      </p>
      <div class="mt-8">
        <MiniPlayer :program="currentProgram" :is-playing="isPlaying" @toggle="radioStore.togglePlay()" />
      </div>
      <div class="mt-8 grid grid-cols-2 gap-4">
        <ProgramCard
          v-for="program in topPrograms.slice(0, 2)"
          :key="program.id"
          :program="program"
          :is-subscribed="subscribed.has(program.id)"
          :is-favorite="favorites.has(program.id)"
          @play="radioStore.playProgram"
          @subscribe="radioStore.toggleSubscribe"
          @favorite="radioStore.toggleFavorite"
        />
      </div>
    </section>
    <section class="space-y-5">
      <RadioPanel />
      <SchedulePanel :schedules="schedules" />
    </section>
  </main>
</template>
