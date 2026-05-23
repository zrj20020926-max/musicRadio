<script setup>
import { storeToRefs } from 'pinia'
import MiniPlayer from '../components/MiniPlayer.vue'
import Waveform from '../components/Waveform.vue'
import { useRadioStore } from '../stores/radio'

const radioStore = useRadioStore()
const { currentProgram, isPlaying } = storeToRefs(radioStore)
</script>

<template>
  <main class="mt-8 w-full">
    <section class="rounded-[2rem] border border-paper-700/30 bg-[#2a1c15] p-8 text-paper-50">
      <div class="inline-flex rounded-xl bg-red-800 px-4 py-2 text-sm tracking-[0.25em]">LIVE · ON AIR</div>
      <h2 class="mt-5 font-retro text-5xl">{{ currentProgram.title }}</h2>
      <p class="mt-2 text-paper-200">{{ currentProgram.host }} · {{ currentProgram.time }}</p>
      <div class="mt-6"><Waveform :animated="isPlaying" /></div>
      <div class="mt-6 max-w-2xl"><MiniPlayer :program="currentProgram" :is-playing="isPlaying" @toggle="radioStore.togglePlay()" /></div>
    </section>
  </main>
</template>
