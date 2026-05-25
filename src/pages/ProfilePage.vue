<script setup>
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Waveform from '../components/Waveform.vue'
import { useRadioStore } from '../stores/radio'

const router = useRouter()
const radioStore = useRadioStore()
const {
  subscribedPrograms,
  favoritePrograms,
  subscribedStationList,
  favoriteStationList,
  favoriteFmStationList,
  recentPrograms,
  currentProgram,
  isPlaying,
  stats,
} = storeToRefs(radioStore)

function goProgramDetail(programId) {
  router.push(`/programs/${programId}`)
}
</script>

<template>
  <main class="mt-8 w-full">
    <h2 class="font-retro text-6xl text-paper-900">我的</h2>

    <section class="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
      <article class="retro-card rounded-[1.8rem] p-6">
        <h3 class="font-retro text-5xl text-paper-900">我的订阅</h3>

        <!-- 节目订阅 -->
        <p class="mt-4 text-xl font-medium text-paper-700">节目</p>
        <ul class="mt-2 space-y-3">
          <li
            v-for="program in subscribedPrograms"
            :key="program.id"
            class="flex items-center justify-between rounded-2xl border border-paper-600/45 bg-paper-100/85 px-4 py-3"
          >
            <button
              type="button"
              class="font-retro text-3xl text-paper-900 hover:underline"
              @click="goProgramDetail(program.id)"
            >
              {{ program.title }}
            </button>
            <button
              type="button"
              class="rounded-full bg-[#24160f] px-4 py-1 text-xl text-paper-50 transition hover:bg-[#2f1d14]"
              @click="radioStore.playProgram(program.id)"
            >
              收听
            </button>
          </li>
          <li
            v-if="!subscribedPrograms.length"
            class="rounded-2xl border border-paper-600/40 bg-paper-100/80 px-4 py-3 text-2xl text-paper-700"
          >
            暂无订阅节目
          </li>
        </ul>

        <!-- 电台订阅 -->
        <p class="mt-4 text-xl font-medium text-paper-700">国际电台</p>
        <ul class="mt-2 space-y-3">
          <li
            v-for="station in subscribedStationList"
            :key="station.stationuuid"
            class="flex items-center justify-between rounded-2xl border border-paper-600/45 bg-paper-100/85 px-4 py-3"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate font-retro text-3xl text-paper-900" :title="station.name">{{ station.name }}</p>
              <p class="text-xl text-paper-600">{{ station.country }} · {{ station.codec }}</p>
            </div>
            <button
              type="button"
              class="rounded-full bg-[#24160f] px-4 py-1 text-xl text-paper-50 transition hover:bg-[#2f1d14]"
              @click="radioStore.playStation(station)"
            >
              收听
            </button>
          </li>
          <li
            v-if="!subscribedStationList.length"
            class="rounded-2xl border border-paper-600/40 bg-paper-100/80 px-4 py-3 text-2xl text-paper-700"
          >
            暂无订阅电台
          </li>
        </ul>

        <h3 class="mt-8 font-retro text-5xl text-paper-900">我的收藏</h3>

        <!-- 节目收藏 -->
        <p class="mt-4 text-xl font-medium text-paper-700">节目</p>
        <ul class="mt-2 space-y-3">
          <li
            v-for="program in favoritePrograms"
            :key="program.id"
            class="flex items-center justify-between rounded-2xl border border-paper-600/45 bg-paper-100/85 px-4 py-3"
          >
            <button
              type="button"
              class="font-retro text-3xl text-paper-900 hover:underline"
              @click="goProgramDetail(program.id)"
            >
              {{ program.title }}
            </button>
            <button
              type="button"
              class="rounded-full border border-paper-700 px-4 py-1 text-xl text-paper-800 hover:bg-paper-200"
              @click="radioStore.playProgram(program.id)"
            >
              播放
            </button>
          </li>
          <li
            v-if="!favoritePrograms.length"
            class="rounded-2xl border border-paper-600/40 bg-paper-100/80 px-4 py-3 text-2xl text-paper-700"
          >
            暂无收藏节目
          </li>
        </ul>

        <!-- 电台收藏 -->
        <p class="mt-4 text-xl font-medium text-paper-700">国际电台</p>
        <ul class="mt-2 space-y-3">
          <li
            v-for="station in favoriteStationList"
            :key="station.stationuuid"
            class="flex items-center justify-between rounded-2xl border border-paper-600/45 bg-paper-100/85 px-4 py-3"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate font-retro text-3xl text-paper-900" :title="station.name">{{ station.name }}</p>
              <p class="text-xl text-paper-600">{{ station.country }} · {{ station.codec }}</p>
            </div>
            <button
              type="button"
              class="rounded-full border border-paper-700 px-4 py-1 text-xl text-paper-800 hover:bg-paper-200"
              @click="radioStore.playStation(station)"
            >
              播放
            </button>
          </li>
          <li
            v-if="!favoriteStationList.length"
            class="rounded-2xl border border-paper-600/40 bg-paper-100/80 px-4 py-3 text-2xl text-paper-700"
          >
            暂无收藏电台
          </li>
        </ul>

        <!-- FM调频收藏 -->
        <p class="mt-4 text-xl font-medium text-paper-700">FM调频</p>
        <ul class="mt-2 space-y-3">
          <li
            v-for="station in favoriteFmStationList"
            :key="station.stationuuid"
            class="flex items-center justify-between rounded-2xl border border-paper-600/45 bg-paper-100/85 px-4 py-3"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate font-retro text-3xl text-paper-900" :title="station.name">{{ station.name }}</p>
              <p class="text-xl text-paper-600">{{ station.country }} · {{ (station.codec || '').toUpperCase() }} {{ station.bitrate }}kbps</p>
            </div>
            <button
              type="button"
              class="rounded-full border border-paper-700 px-4 py-1 text-xl text-paper-800 hover:bg-paper-200"
              @click="radioStore.playStation(station)"
            >
              播放
            </button>
          </li>
          <li
            v-if="!favoriteFmStationList.length"
            class="rounded-2xl border border-paper-600/40 bg-paper-100/80 px-4 py-3 text-2xl text-paper-700"
          >
            暂无收藏FM电台
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
            <p class="font-retro text-5xl">{{ stats.subscribedCount }}</p>
            <p class="text-xl text-paper-700">订阅</p>
          </div>
          <div>
            <p class="font-retro text-5xl">{{ stats.favoriteCount }}</p>
            <p class="text-xl text-paper-700">收藏</p>
          </div>
          <div>
            <p class="font-retro text-5xl">{{ stats.listenHours }}h</p>
            <p class="text-xl text-paper-700">收听</p>
          </div>
        </div>

        <div class="mt-5">
          <h4 class="font-retro text-3xl text-paper-900">最近播放</h4>
          <ul class="mt-2 space-y-2">
            <li v-for="program in recentPrograms" :key="program.id">
              <button
                type="button"
                class="w-full truncate rounded-xl border border-paper-600/45 bg-paper-100/80 px-3 py-2 text-left text-xl text-paper-800 hover:bg-paper-100"
                :title="program.title"
                @click="radioStore.playProgram(program.id)"
              >
                {{ program.title }}
              </button>
            </li>
          </ul>
        </div>

        <div class="mt-6 rounded-[1.5rem] bg-[#24160f] px-4 py-4 text-paper-50">
          <p class="text-xs tracking-[0.25em] text-paper-300">NOW PLAYING</p>
          <p class="mt-2 truncate font-retro text-4xl" :title="currentProgram.title">{{ currentProgram.title }}</p>
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
