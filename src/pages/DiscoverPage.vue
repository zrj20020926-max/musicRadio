<script setup>
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import Waveform from '../components/Waveform.vue'
import { useRadioStore } from '../stores/radio'

const router = useRouter()
const radioStore = useRadioStore()
const { isPlaying, liveProgram, featuredPrograms } = storeToRefs(radioStore)

const featureList = [
  { title: '真人播报', meanings: ['温暖陪伴', '贴近表达'] },
  { title: '背景音乐', meanings: ['精选 BGM', '氛围营造'] },
  { title: '主题节目', meanings: ['多元话题', '深度陪伴'] },
  { title: '陪伴时刻', meanings: ['早安时段', '睡前时段'] },
]

function goProgramDetail(programId) {
  router.push(`/programs/${programId}`)
}
</script>

<template>
  <main class="mt-8 w-full">
    <h2 class="font-retro text-6xl text-paper-900">发现</h2>

    <section class="mt-6 grid grid-cols-[1.8fr_1fr] gap-8">
      <article
        class="rounded-[2rem] border border-paper-800/40 bg-[#251711] p-7 text-paper-50 shadow-soft"
      >
        <div
          class="inline-flex rounded-2xl bg-[#b54530] px-5 py-2 text-5xl font-bold tracking-wide"
        >
          ON AIR
        </div>

        <div class="mt-8 flex items-center gap-6">
          <div class="w-80 rounded-[1.8rem] border-2 border-amber-500/70 p-4">
            <div class="rounded-2xl border border-amber-500/60 p-4">
              <div class="h-20 rounded-xl border border-amber-500/40 p-3">
                <div class="h-full rounded-md bg-amber-500/70" />
              </div>
              <div class="mt-3 flex items-center gap-3">
                <span class="h-5 w-5 rounded-full border border-amber-400" />
                <span class="h-5 w-5 rounded-full border border-amber-400" />
                <span class="h-5 w-5 rounded-full border border-amber-400" />
              </div>
            </div>
          </div>

          <div class="min-w-0 flex-1">
            <h3 class="truncate font-retro text-6xl text-paper-50">{{ liveProgram.title }}</h3>
            <p class="mt-2 text-3xl text-paper-300">
              主播：{{ liveProgram.host }} · {{ liveProgram.listeners }} 人在收听
            </p>
            <div class="mt-5 flex items-center gap-5">
              <Waveform :animated="isPlaying" />
              <button
                type="button"
                class="grid h-24 w-24 place-content-center rounded-full bg-paper-100 text-5xl text-paper-900 transition hover:scale-105"
                @click="radioStore.togglePlay(liveProgram.id)"
              >
                {{ isPlaying ? 'Ⅱ' : '▶' }}
              </button>
            </div>
          </div>
        </div>
      </article>

      <aside class="rounded-[2rem] border border-paper-600/50 bg-paper-200/90 p-8 shadow-soft">
        <h3 class="text-center font-retro text-5xl text-paper-900">电台特色</h3>
        <div class="mt-8 grid grid-cols-2 gap-x-8 gap-y-10">
          <div
            v-for="item in featureList"
            :key="item.title"
            class="flex flex-col items-center text-center"
          >
            <span class="h-4 w-4 rounded-full bg-[#d4a45d]" />
            <div class="mt-3">
              <p class="text-3xl font-bold text-paper-900">{{ item.title }}</p>
              <p
                v-for="meaning in item.meanings"
                :key="meaning"
                class="mt-1 whitespace-nowrap text-lg text-paper-700"
              >
                {{ meaning }}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </section>

    <section class="mt-10">
      <h3 class="font-retro text-5xl text-paper-900">节目推荐</h3>
      <div class="mt-5 grid grid-cols-3 gap-4">
        <article
          v-for="program in featuredPrograms"
          :key="program.id"
          class="flex min-w-0 items-center gap-4 overflow-hidden rounded-2xl border border-paper-600/50 bg-paper-200/90 px-5 py-4 transition hover:-translate-y-1"
        >
          <div
            class="grid h-14 w-14 shrink-0 place-content-center rounded-2xl bg-paper-900 text-xl text-paper-100"
          >
            📻
          </div>
          <div class="min-w-0 flex-1">
            <button
              type="button"
              class="block w-full truncate text-left text-[28px] font-bold text-paper-900 hover:underline"
              @click="goProgramDetail(program.id)"
            >
              {{ program.title }}↗
            </button>
            <p class="mt-1 truncate text-xl text-paper-700">
              {{ program.duration }} · {{ program.listeners }} 次收听
            </p>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>
