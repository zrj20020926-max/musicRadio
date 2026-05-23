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
    <h2 class="font-retro text-6xl text-paper-900">正在直播</h2>

    <section class="mt-5 grid grid-cols-[1.85fr_0.95fr] gap-7 max-[1100px]:grid-cols-1">
      <article class="rounded-[2rem] border border-[#7a502f]/70 bg-[#2a1a13] p-7 text-paper-50 shadow-soft">
        <div class="rounded-[1.7rem] border border-amber-700/60 bg-[#180d0a] p-6">
          <div class="flex min-h-[270px] items-center rounded-[1.5rem] border border-amber-700/60 px-7">
            <div class="w-[54%] rounded-[1.4rem] border-2 border-amber-500/80 p-4">
              <div class="rounded-xl border border-amber-500/70 p-4">
                <div class="h-16 rounded-lg border border-amber-500/45 p-2">
                  <div class="h-full rounded-md bg-amber-500/75" />
                </div>
                <div class="mt-3 flex items-center gap-3">
                  <span class="h-4 w-4 rounded-full border border-amber-400" />
                  <span class="h-4 w-4 rounded-full border border-amber-400" />
                  <span class="h-4 w-4 rounded-full border border-amber-400" />
                </div>
              </div>
            </div>
            <div class="ml-8 self-start rounded-xl bg-[#a43b2a] px-5 py-2 text-xl font-bold tracking-[0.16em]">ON AIR</div>
          </div>
        </div>

        <h3 class="mt-6 font-retro text-7xl leading-tight text-paper-50">{{ currentProgram.title }}</h3>
        <p class="mt-2 text-3xl text-paper-300">主播：{{ currentProgram.host }} · {{ currentProgram.duration }}</p>
        <p class="mt-2 max-w-3xl text-2xl text-paper-300">欢迎来到深夜电台，希望我的声音，能陪你度过这段漫长的夜晚。</p>

        <div class="mt-6 flex items-end justify-between gap-4">
          <div>
            <Waveform :animated="isPlaying" />
            <div class="mt-1 flex justify-between text-xl text-paper-400">
              <span>12:34</span>
              <span>45:00</span>
            </div>
          </div>
          <button
            type="button"
            class="grid h-20 w-20 shrink-0 place-content-center rounded-full border-2 border-amber-500 bg-paper-100 text-4xl text-paper-900 transition hover:scale-105"
            @click="radioStore.togglePlay(currentProgram.id)"
          >
            {{ isPlaying ? 'Ⅱ' : '▶' }}
          </button>
        </div>

        <div class="mt-6">
          <MiniPlayer :program="currentProgram" :is-playing="isPlaying" @toggle="radioStore.togglePlay(currentProgram.id)" />
        </div>
      </article>

      <aside class="retro-card rounded-[2rem] p-7">
        <h3 class="font-retro text-5xl text-paper-900">实时信息</h3>
        <div class="mt-6 space-y-4 text-paper-900">
          <div>
            <p class="text-xl text-paper-700">BGM</p>
            <p class="mt-1 text-4xl font-semibold">City of Stars - La La Land</p>
          </div>
          <div>
            <p class="text-xl text-paper-700">主持</p>
            <p class="mt-1 text-4xl font-semibold">{{ currentProgram.host }}</p>
          </div>
          <div>
            <p class="text-xl text-paper-700">听众</p>
            <p class="mt-1 text-4xl font-semibold">2,378</p>
          </div>
          <div>
            <p class="text-xl text-paper-700">标签</p>
            <p class="mt-1 text-4xl font-semibold">深夜 陪伴 治愈</p>
          </div>
        </div>

        <div class="mt-7 rounded-2xl border border-paper-700/55 bg-paper-100/75 px-4 py-4 text-xl text-paper-800">
          听友留言：谢谢阿北，今晚终于没那么孤单。
        </div>
      </aside>
    </section>
  </main>
</template>
