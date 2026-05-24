<script setup>
import { storeToRefs } from 'pinia'
import { useRadioStore } from '../stores/radio'

const radioStore = useRadioStore()
const { stations, currentStationId, isPlaying, currentProgram, todaySchedulePrograms } = storeToRefs(radioStore)
</script>

<template>
  <main class="mt-8 w-full">
    <section class="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-8">
      <article class="rounded-[2rem] border border-paper-700/60 bg-[#22130f] p-8 shadow-soft">
        <h2 class="font-retro text-6xl text-paper-50">今日节目单</h2>

        <div class="relative mt-6 rounded-[1.8rem] border border-paper-700/40 bg-paper-200 p-6">
          <button
            v-for="item in todaySchedulePrograms"
            :key="item.time"
            type="button"
            class="grid w-full grid-cols-[72px_1fr] items-center gap-3 border-b border-paper-600/40 py-4 text-left last:border-b-0 sm:grid-cols-[96px_1fr_auto] sm:gap-4"
            :class="item.program.id === currentProgram.id ? 'rounded-xl bg-paper-100/90 px-2' : ''"
            @click="radioStore.playProgram(item.program.id)"
          >
            <span class="text-4xl text-paper-700">{{ item.time }}</span>
            <div>
              <p class="font-retro text-5xl text-paper-900">{{ item.program.title }}</p>
              <p class="mt-1 text-3xl text-paper-700">{{ item.program.host }}</p>
            </div>
            <span
              v-if="item.program.isLive"
              class="col-span-2 mt-2 w-fit rounded-full border border-red-800 px-3 py-1 text-lg text-red-900 sm:col-span-1 sm:mt-0"
              >直播中</span
            >
          </button>
        </div>
      </article>

      <article class="rounded-[2rem] border border-paper-700/50 bg-paper-200 p-8 shadow-soft">
        <h3 class="font-retro text-6xl text-paper-900">在线电台</h3>

        <div v-if="stations.length" class="mt-6 max-h-[420px] space-y-3 overflow-y-auto pr-2">
          <button
            v-for="station in stations.slice(0, 20)"
            :key="station.stationuuid"
            type="button"
            class="flex w-full items-center gap-3 rounded-xl border border-paper-700/30 px-4 py-3 text-left transition hover:bg-paper-100"
            :class="currentStationId === station.stationuuid ? 'bg-paper-100 ring-2 ring-amber-600/40' : ''"
            @click="currentStationId === station.stationuuid && isPlaying ? radioStore.stopStation() : radioStore.playStation(station)"
          >
            <img
              v-if="station.favicon"
              :src="station.favicon"
              class="h-10 w-10 rounded-lg object-cover"
              alt=""
            />
            <div v-else class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-800/20 text-xl text-amber-900">FM</div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-3xl font-medium text-paper-900" :title="station.name">{{ station.name }}</p>
              <p
                class="truncate text-xl text-paper-700"
                :title="`${station.country} · ${station.codec} ${station.bitrate}kbps`"
              >
                {{ station.country }} · {{ station.codec }} {{ station.bitrate }}kbps
              </p>
            </div>
            <span
              class="shrink-0 rounded-full px-3 py-1 text-xl"
              :class="currentStationId === station.stationuuid && isPlaying ? 'bg-red-800/20 text-red-900' : 'bg-amber-800/20 text-amber-900'"
            >
              {{ currentStationId === station.stationuuid && isPlaying ? '停止' : '收听' }}
            </span>
          </button>
        </div>
        <p v-else class="mt-6 text-3xl text-paper-700">暂无电台数据，请先点击"更新节目"获取。</p>
      </article>
    </section>
  </main>
</template>
