<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Waveform from '../components/Waveform.vue'
import { useRadioStore } from '../stores/radio'

const router = useRouter()
const radioStore = useRadioStore()
const { programs, currentProgram, isPlaying } = storeToRefs(radioStore)

const activeTag = ref('全部节目')
const tags = ['全部节目', '早安', '午后', '深夜', '故事']

const filteredItems = computed(() => {
  if (activeTag.value === '全部节目') {
    return programs.value
  }
  return programs.value.filter((item) => item.category === activeTag.value)
})

function goProgramDetail(programId) {
  router.push(`/programs/${programId}`)
}
</script>

<template>
  <main class="mt-8 w-full pb-8">
    <h2 class="font-retro text-6xl text-paper-900">节目</h2>

    <div class="mt-4 flex items-center gap-4">
      <button
        v-for="tag in tags"
        :key="tag"
        type="button"
        class="rounded-full border border-paper-700/50 px-6 py-2 text-3xl transition"
        :class="
          activeTag === tag
            ? 'bg-paper-900 text-paper-50'
            : 'bg-paper-100/80 text-paper-900 hover:bg-paper-200'
        "
        @click="activeTag = tag"
      >
        {{ tag }}
      </button>
    </div>

    <section class="mt-7 grid grid-cols-2 gap-5">
      <article
        v-for="item in filteredItems"
        :key="item.id"
        class="flex items-center justify-between rounded-[1.6rem] border border-paper-600/60 bg-paper-200/90 px-5 py-4 shadow-soft"
      >
        <div class="flex items-center gap-4">
          <div
            class="grid h-14 w-14 place-content-center rounded-2xl bg-paper-900 text-xl text-paper-100"
          >
            📻
          </div>
          <div>
            <button
              type="button"
              class="text-left font-retro text-4xl text-paper-900 hover:underline"
              @click="goProgramDetail(item.id)"
            >
              {{ item.title }}
            </button>
            <p class="mt-1 text-2xl text-paper-700">
              主播: {{ item.host }} · 更新 {{ item.date }} · {{ item.listeners }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span
            v-if="item.isLive"
            class="rounded-full border border-red-800 px-3 py-1 text-lg text-red-900"
            >直播中</span
          >
          <button
            type="button"
            class="text-4xl text-paper-700 transition hover:translate-x-1"
            @click="goProgramDetail(item.id)"
          >
            ↗
          </button>
        </div>
      </article>
    </section>

    <footer
      class="mt-8 flex items-center justify-between rounded-[1.7rem] bg-[#24160f] px-6 py-4 text-paper-50 shadow-soft"
    >
      <div class="flex items-center gap-4">
        <div class="grid h-14 w-14 place-content-center rounded-2xl bg-paper-800 text-xl">📻</div>
        <div>
          <p class="font-retro text-4xl">{{ currentProgram.title }}</p>
          <p class="text-2xl text-paper-300">主播: {{ currentProgram.host }}</p>
        </div>
      </div>
      <Waveform :animated="isPlaying" />
      <button
        type="button"
        class="grid h-16 w-16 place-content-center rounded-full border-2 border-amber-600 text-4xl text-amber-400 transition hover:scale-105"
        @click="radioStore.togglePlay(currentProgram.id)"
      >
        {{ isPlaying ? 'Ⅱ' : '▶' }}
      </button>
    </footer>
  </main>
</template>
