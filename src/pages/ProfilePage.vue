<script setup>
import { storeToRefs } from 'pinia'
import Waveform from '../components/Waveform.vue'
import { topPrograms } from '../data/mockData'
import { useRadioStore } from '../stores/radio'

const radioStore = useRadioStore()
const { subscribed, favorites, currentProgram, isPlaying } = storeToRefs(radioStore)
</script>

<template>
  <main class="mt-8 w-full">
    <h2 class="font-retro text-6xl text-paper-900">我的</h2>

    <section class="mt-6 grid grid-cols-[1.4fr_1fr] gap-6 max-[1100px]:grid-cols-1">
      <article class="retro-card rounded-[1.8rem] p-6">
        <h3 class="font-retro text-5xl text-paper-900">我的订阅</h3>
        <ul class="mt-4 space-y-3">
          <li
            v-for="program in topPrograms.filter((item) => subscribed.has(item.id))"
            :key="program.id"
            class="flex items-center justify-between rounded-2xl border border-paper-600/45 bg-paper-100/85 px-4 py-3"
          >
            <span class="font-retro text-3xl text-paper-900">{{ program.title }}</span>
            <button
              type="button"
              class="rounded-full bg-[#24160f] px-4 py-1 text-xl text-paper-50 transition hover:bg-[#2f1d14]"
              @click="radioStore.playProgram(program.id)"
            >
              收听
            </button>
          </li>
          <li v-if="!topPrograms.some((item) => subscribed.has(item.id))" class="rounded-2xl border border-paper-600/40 bg-paper-100/80 px-4 py-3 text-2xl text-paper-700">
            暂无订阅
          </li>
        </ul>

        <h3 class="mt-8 font-retro text-5xl text-paper-900">我的收藏</h3>
        <ul class="mt-4 space-y-3">
          <li
            v-for="program in topPrograms.filter((item) => favorites.has(item.id))"
            :key="program.id"
            class="rounded-2xl border border-paper-600/45 bg-paper-100/85 px-4 py-3 font-retro text-3xl text-paper-900"
          >
            {{ program.title }}
          </li>
          <li v-if="!topPrograms.some((item) => favorites.has(item.id))" class="rounded-2xl border border-paper-600/40 bg-paper-100/80 px-4 py-3 text-2xl text-paper-700">
            暂无收藏
          </li>
        </ul>
      </article>

      <aside class="retro-card rounded-[1.8rem] p-6">
        <div class="flex items-center gap-4">
          <span class="h-20 w-20 rounded-full bg-[#6a4329]" />
          <div>
            <h3 class="font-retro text-5xl text-paper-900">晚安电台听友</h3>
            <p class="text-2xl text-paper-700">陪伴第 128 天</p>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-3 gap-2 text-paper-900">
          <div>
            <p class="font-retro text-5xl">12</p>
            <p class="text-xl text-paper-700">订阅</p>
          </div>
          <div>
            <p class="font-retro text-5xl">28</p>
            <p class="text-xl text-paper-700">收藏</p>
          </div>
          <div>
            <p class="font-retro text-5xl">156h</p>
            <p class="text-xl text-paper-700">收听</p>
          </div>
        </div>

        <div class="mt-6 rounded-[1.5rem] bg-[#24160f] px-4 py-4 text-paper-50">
          <p class="text-xs tracking-[0.25em] text-paper-300">NOW PLAYING</p>
          <p class="mt-2 truncate font-retro text-4xl">{{ currentProgram.title }}</p>
          <p class="text-xl text-paper-300">{{ currentProgram.host }}</p>
          <div class="mt-3"><Waveform :animated="isPlaying" /></div>
          <button
            type="button"
            class="mt-3 rounded-full border border-amber-500 px-4 py-1 text-xl text-amber-300 transition hover:bg-[#2f1d14]"
            @click="radioStore.togglePlay(currentProgram.id)"
          >
            {{ isPlaying ? '暂停' : '播放' }}
          </button>
        </div>
      </aside>
    </section>
  </main>
</template>
