<script setup>
import { storeToRefs } from 'pinia'
import Waveform from '../components/Waveform.vue'
import { useRadioStore } from '../stores/radio'

const radioStore = useRadioStore()
const { stations, currentStationId, isPlaying } = storeToRefs(radioStore)

function currentStation() {
  return stations.value.find((s) => s.stationuuid === currentStationId.value)
}
</script>

<template>
  <main class="mt-8 w-full">
    <h2 class="font-retro text-6xl text-paper-900">正在直播</h2>

    <section class="mt-5 grid grid-cols-[1.85fr_0.95fr] gap-7 max-[1100px]:grid-cols-1">
      <article
        class="rounded-[2rem] border border-[#7a502f]/70 bg-[#2a1a13] p-7 text-paper-50 shadow-soft"
      >
        <div v-if="currentStationId && currentStation()" class="mb-6">
          <div class="flex items-center gap-4">
            <div class="rounded-xl bg-[#a43b2a] px-4 py-2 text-xl font-bold tracking-[0.16em]">LIVE</div>
            <h3 class="font-retro text-6xl text-paper-50">{{ currentStation().name }}</h3>
          </div>
          <p class="mt-2 text-2xl text-paper-300">
            {{ currentStation().country }} · {{ currentStation().codec }} {{ currentStation().bitrate }}kbps
          </p>
          <div class="mt-4 flex items-center gap-4">
            <Waveform :animated="isPlaying" />
            <button
              type="button"
              class="grid h-16 w-16 place-content-center rounded-full border-2 border-amber-500 bg-paper-100 text-3xl text-paper-900 transition hover:scale-105"
              @click="radioStore.stopStation()"
            >■</button>
          </div>
        </div>
        <div v-else class="mb-6 text-3xl text-paper-300">选择一个电台开始收听直播</div>

        <div class="max-h-[400px] space-y-2 overflow-y-auto pr-2">
          <button
            v-for="station in stations.slice(0, 30)"
            :key="station.stationuuid"
            type="button"
            class="flex w-full items-center gap-3 rounded-xl border border-amber-700/30 px-4 py-3 text-left transition hover:bg-amber-900/20"
            :class="currentStationId === station.stationuuid ? 'bg-amber-900/30 ring-1 ring-amber-500/50' : ''"
            @click="radioStore.playStation(station)"
          >
            <img v-if="station.favicon" :src="station.favicon" class="h-9 w-9 rounded-lg object-cover" alt="" />
            <div v-else class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-800/30 text-lg text-amber-300">FM</div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-2xl font-medium text-paper-50">{{ station.name }}</p>
              <p class="truncate text-lg text-paper-400">{{ station.country }} · {{ station.codec }} {{ station.bitrate }}kbps</p>
            </div>
            <span v-if="currentStationId === station.stationuuid" class="h-2 w-2 rounded-full bg-[#a43b2a] animate-pulse" />
          </button>
        </div>
      </article>

      <aside class="retro-card rounded-[2rem] p-7">
        <h3 class="font-retro text-5xl text-paper-900">电台信息</h3>
        <div v-if="currentStationId && currentStation()" class="mt-6 space-y-4 text-paper-900">
          <div>
            <p class="text-xl text-paper-700">电台名称</p>
            <p class="mt-1 text-3xl font-semibold">{{ currentStation().name }}</p>
          </div>
          <div>
            <p class="text-xl text-paper-700">国家</p>
            <p class="mt-1 text-3xl font-semibold">{{ currentStation().country }}</p>
          </div>
          <div>
            <p class="text-xl text-paper-700">编码</p>
            <p class="mt-1 text-3xl font-semibold">{{ currentStation().codec }} · {{ currentStation().bitrate }}kbps</p>
          </div>
          <div>
            <p class="text-xl text-paper-700">语言</p>
            <p class="mt-1 text-3xl font-semibold">{{ currentStation().language || '未知' }}</p>
          </div>
          <div v-if="currentStation().tags">
            <p class="text-xl text-paper-700">标签</p>
            <p class="mt-1 text-2xl text-paper-800">{{ currentStation().tags.split(',').slice(0, 5).join(' · ') }}</p>
          </div>
        </div>
        <p v-else class="mt-6 text-2xl text-paper-700">选择电台后显示详细信息</p>
      </aside>
    </section>
  </main>
</template>
