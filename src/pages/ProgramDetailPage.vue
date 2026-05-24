<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import Waveform from '../components/Waveform.vue'
import { useRadioStore } from '../stores/radio'

const route = useRoute()
const radioStore = useRadioStore()
const { subscribed, isPlaying, durationLabel, currentEpisodeIndex } = storeToRefs(radioStore)

const program = computed(() => radioStore.getProgramById(route.params.id))
const hasProgram = computed(() => Boolean(program.value))
const episodeList = computed(() => program.value?.episodes || [])
const isCurrentProgram = computed(
  () => program.value && radioStore.currentProgram?.id === program.value.id,
)

function formatEpisodeDuration(duration) {
  if (!duration || duration === '直播中') {
    return '00:00'
  }
  const text = String(duration).trim()
  if (/^\d{1,2}:\d{2}$/.test(text)) {
    const [m, s] = text.split(':')
    return `${String(Number.parseInt(m, 10)).padStart(2, '0')}:${String(Number.parseInt(s, 10)).padStart(2, '0')}`
  }
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(text)) {
    const [h, m, s] = text.split(':').map((item) => Number.parseInt(item, 10))
    const minute = h * 60 + m
    return `${String(minute).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return '00:00'
}

function displayDuration(episode, index) {
  if (isCurrentProgram.value && index === currentEpisodeIndex.value) {
    return durationLabel.value
  }
  if (!episode.duration || episode.duration === '直播中') return episode.duration || '--:--'
  return formatEpisodeDuration(episode.duration) || '--:--'
}
</script>

<template>
  <main class="mt-8 w-full">
    <section
      v-if="hasProgram"
      class="rounded-[2rem] border border-paper-600/60 bg-paper-200/90 p-8 shadow-soft"
    >
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.55fr] xl:gap-8">
        <div>
          <article
            :class="`rounded-[2rem] bg-gradient-to-br ${program.cover.tone} p-6 text-paper-100`"
          >
            <div class="inline-flex rounded-2xl bg-[#b54530] px-5 py-2 text-4xl font-bold">
              ON AIR
            </div>
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
          <p class="mt-2 text-4xl text-paper-700">
            主播: {{ program.host }} · {{ program.category }} · 陪伴 · 治愈
          </p>

          <button
            type="button"
            class="mt-5 rounded-full px-6 py-2 text-3xl font-semibold text-paper-900 transition-all duration-200 active:scale-95"
            :class="
              subscribed.has(program.id)
                ? 'bg-[#e1bf7d] shadow-[0_0_0_3px_rgba(127,46,32,0.22)] animate-[pulse_0.45s_ease-in-out]'
                : 'bg-[#c8a663] hover:-translate-y-0.5'
            "
            @click="radioStore.toggleSubscribe(program.id)"
          >
            {{ subscribed.has(program.id) ? '已订阅' : '订阅' }}
          </button>

          <div class="mt-8">
            <h3 class="font-retro text-6xl text-paper-900">节目简介</h3>
            <p class="mt-3 max-w-4xl text-3xl leading-relaxed text-paper-800">
              {{ program.description }}
            </p>
          </div>

          <div class="mt-8">
            <h3 class="font-retro text-6xl text-paper-900">节目列表</h3>
            <ul class="mt-4 space-y-4">
              <li
                v-for="(episode, index) in episodeList"
                :key="episode.id"
                class="flex items-center justify-between rounded-xl px-3 py-2 text-paper-900"
                :class="
                  isCurrentProgram && index === currentEpisodeIndex
                    ? 'border border-paper-700/40 bg-paper-100/85'
                    : ''
                "
              >
                <div class="flex min-w-0 items-center gap-3">
                  <span
                    class="h-3 w-3 rounded-full"
                    :class="
                      episode.duration === '直播中'
                        ? 'bg-[#a43b2a]'
                        : isCurrentProgram && index === currentEpisodeIndex
                          ? 'bg-[#7f2e20]'
                          : 'bg-[#beaa84]'
                    "
                  />
                  <span class="text-3xl text-paper-700">{{ episode.pubDate || episode.date }}</span>
                    <button
                      type="button"
                      class="truncate text-left text-4xl font-semibold hover:underline"
                      :title="episode.title"
                      @click="radioStore.playProgram(program.id, { episodeIndex: index })"
                    >
                      {{ episode.title }}
                    </button>
                </div>
                <span
                  class="text-3xl"
                  :class="episode.duration === '直播中' ? 'text-[#a43b2a]' : 'text-paper-700'"
                  >{{ displayDuration(episode, index) }}</span
                >
              </li>
            </ul>

            <div class="mt-5 max-w-lg"><Waveform :animated="isPlaying" /></div>
          </div>
        </div>
      </div>
    </section>

    <section v-else class="retro-card rounded-[2rem] p-10 text-center">
      <h2 class="font-retro text-6xl text-paper-900">节目不存在</h2>
      <p class="mt-3 text-2xl text-paper-700">这段声音也许已经下线，请返回节目列表继续收听。</p>
    </section>
  </main>
</template>
