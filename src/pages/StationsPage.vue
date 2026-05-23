<script setup>
import { storeToRefs } from 'pinia'
import { useRadioStore } from '../stores/radio'

const radioStore = useRadioStore()
const { currentProgram, todaySchedulePrograms } = storeToRefs(radioStore)
</script>

<template>
  <main class="mt-8 w-full">
    <section class="grid grid-cols-2 gap-8">
      <article class="rounded-[2rem] border border-paper-700/60 bg-[#22130f] p-8 shadow-soft">
        <h2 class="font-retro text-6xl text-paper-50">今日节目单</h2>

        <div class="relative mt-6 rounded-[1.8rem] border border-paper-700/40 bg-paper-200 p-6">
          <button
            v-for="item in todaySchedulePrograms"
            :key="item.time"
            type="button"
            class="grid w-full grid-cols-[96px_1fr_auto] items-center gap-4 border-b border-paper-600/40 py-4 text-left last:border-b-0"
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
              class="rounded-full border border-red-800 px-3 py-1 text-lg text-red-900"
              >直播中</span
            >
          </button>
        </div>
      </article>

      <article class="rounded-[2rem] border border-paper-700/50 bg-paper-200 p-8 shadow-soft">
        <h3 class="font-retro text-6xl text-paper-900">电台调频</h3>

        <div class="mt-7 text-center font-retro text-[108px] leading-none text-paper-900">
          {{ currentProgram.cover.frequency.split(' ')[0] }} <span class="text-6xl">FM</span>
        </div>

        <div
          class="relative mx-auto mt-10 h-28 w-[86%] rounded-3xl border border-paper-700/60 bg-[#1f120d] px-8 py-5"
        >
          <div class="flex h-full items-center justify-between">
            <span
              v-for="n in 13"
              :key="n"
              class="h-10 w-[2px] bg-amber-500/70"
              :style="{ height: `${22 + (n % 3) * 10}px` }"
            />
          </div>
          <div class="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-[#a43b2a]" />
        </div>

        <button
          type="button"
          class="mx-auto mt-7 block h-40 w-40 rounded-full border-4 border-paper-700 bg-[#cfae73] p-8 transition hover:scale-105"
          @click="radioStore.togglePlay(currentProgram.id)"
        >
          <span class="block h-full w-full rounded-full border border-paper-700 bg-paper-100" />
        </button>

        <p class="mt-7 font-retro text-5xl text-paper-900">FM {{ currentProgram.title }}</p>
      </article>
    </section>
  </main>
</template>
