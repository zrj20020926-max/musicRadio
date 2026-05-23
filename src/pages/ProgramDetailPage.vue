<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import Waveform from '../components/Waveform.vue'
import { topPrograms } from '../data/mockData'
import { useRadioStore } from '../stores/radio'

const route = useRoute()
const radioStore = useRadioStore()
const { subscribed, isPlaying } = storeToRefs(radioStore)

const program = computed(() => topPrograms.find((item) => item.id === route.params.id) ?? topPrograms[0])

const episodeList = [
  { date: '2024-05-19', title: '你并不孤单', duration: '直播中', active: true },
  { date: '2024-05-18', title: '慢慢地睡去', duration: '42:36', active: false },
  { date: '2024-05-17', title: '那些说不出口的话', duration: '43:28', active: false },
]
</script>

<template>
  <main class="mt-8 w-full">
    <section class="rounded-[2rem] border border-paper-600/60 bg-paper-200/90 p-8 shadow-soft">
      <div class="grid grid-cols-[0.95fr_1.55fr] gap-8">
        <div>
          <article class="rounded-[2rem] bg-gradient-to-br from-[#2b1a14] to-[#4a2d1f] p-6 text-paper-100">
            <div class="inline-flex rounded-2xl bg-[#b54530] px-5 py-2 text-4xl font-bold">ON AIR</div>
            <div class="mt-8 rounded-[1.5rem] border-2 border-amber-500/70 p-4">
              <div class="rounded-xl border border-amber-500/70 p-3">
                <div class="h-14 rounded-xl border border-amber-500/50 p-2">
                  <div class="h-full rounded-md bg-amber-500/80" />
                </div>
                <div class="mt-2 flex items-center gap-3">
                  <span class="h-4 w-4 rounded-full border border-amber-400" />
                  <span class="h-4 w-4 rounded-full border border-amber-400" />
                  <span class="h-4 w-4 rounded-full border border-amber-400" />
                </div>
              </div>
            </div>
            <div class="mt-4 h-1 w-3/4 bg-amber-600/60" />
          </article>

          <div class="mt-8 rounded-[1.5rem] bg-[#22140f] px-5 py-4 text-paper-50">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="font-retro text-4xl">{{ program.title }}</p>
                <p class="text-2xl text-paper-300">主播: {{ program.host }}</p>
              </div>
              <button
                type="button"
                class="grid h-16 w-16 place-content-center rounded-full border-2 border-amber-500 text-4xl text-amber-300"
                @click="radioStore.togglePlay(program.id)"
              >
                {{ isPlaying ? 'Ⅱ' : '▶' }}
              </button>
            </div>
          </div>
        </div>

        <div>
          <h2 class="font-retro text-7xl text-paper-900">{{ program.title }}</h2>
          <p class="mt-2 text-4xl text-paper-700">主播: {{ program.host }} · 深夜 · 陪伴 · 治愈</p>

          <button
            type="button"
            class="mt-5 rounded-full bg-[#c8a663] px-6 py-2 text-3xl font-semibold text-paper-900"
            @click="radioStore.toggleSubscribe(program.id)"
          >
            {{ subscribed.has(program.id) ? '已订阅' : '订阅' }}
          </button>

          <div class="mt-8">
            <h3 class="font-retro text-6xl text-paper-900">节目简介</h3>
            <p class="mt-3 max-w-4xl text-3xl leading-relaxed text-paper-800">
              每个夜晚，我都会在这里，陪你聊聊天，听首歌，读一封信，或只是静静地陪着你。这里没有催促，只有慢慢亮起的声音。
            </p>
          </div>

          <div class="mt-8">
            <h3 class="font-retro text-6xl text-paper-900">节目列表</h3>
            <ul class="mt-4 space-y-4">
              <li
                v-for="episode in episodeList"
                :key="episode.date + episode.title"
                class="flex items-center justify-between text-paper-900"
              >
                <div class="flex min-w-0 items-center gap-3">
                  <span class="h-3 w-3 rounded-full" :class="episode.active ? 'bg-[#a43b2a]' : 'bg-[#beaa84]'" />
                  <span class="text-3xl text-paper-700">{{ episode.date }}</span>
                  <button
                    type="button"
                    class="truncate text-left text-4xl font-semibold hover:underline"
                    @click="radioStore.playProgram(program.id)"
                  >
                    {{ episode.title }}
                  </button>
                </div>
                <span class="text-3xl" :class="episode.active ? 'text-[#a43b2a]' : 'text-paper-700'">{{ episode.duration }}</span>
              </li>
            </ul>

            <div class="mt-5 max-w-lg"><Waveform :animated="isPlaying" /></div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
