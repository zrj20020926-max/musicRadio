<script setup>
const scheduleItems = [
  { time: '07:00', title: '早安电台', host: '小七', live: false },
  { time: '12:00', title: '午后时光', host: '林深', live: false },
  { time: '21:00', title: '深夜电台', host: '阿北', live: true },
  { time: '23:00', title: '故事时间', host: '阿北', live: false },
]
</script>

<template>
  <main class="mt-8 w-full">
    <section class="grid grid-cols-2 gap-8">
      <article class="rounded-[2rem] border border-paper-700/60 bg-[#22130f] p-8 shadow-soft">
        <h2 class="font-retro text-6xl text-paper-50">今日节目单</h2>

        <div class="relative mt-6 rounded-[1.8rem] border border-paper-700/40 bg-paper-200 p-6">
          <div
            v-for="item in scheduleItems"
            :key="item.time"
            class="border-b border-paper-600/40 py-4 last:border-b-0"
          >
            <div class="grid grid-cols-[96px_1fr_auto] items-center gap-4">
              <span class="text-4xl text-paper-700">{{ item.time }}</span>
              <div>
                <p class="font-retro text-5xl text-paper-900">{{ item.title }}</p>
                <p class="mt-1 text-3xl text-paper-700">{{ item.host }}</p>
              </div>
              <span
                v-if="item.live"
                class="rounded-full border border-red-800 px-3 py-1 text-lg text-red-900"
                >直播中</span
              >
            </div>
          </div>
        </div>
      </article>

      <article class="rounded-[2rem] border border-paper-700/50 bg-paper-200 p-8 shadow-soft">
        <h3 class="font-retro text-6xl text-paper-900">电台调频</h3>

        <div class="mt-7 text-center font-retro text-[108px] leading-none text-paper-900">
          89.6 <span class="text-6xl">FM</span>
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

        <div class="mx-auto mt-7 h-40 w-40 rounded-full border-4 border-paper-700 bg-[#cfae73] p-8">
          <div class="h-full w-full rounded-full border border-paper-700 bg-paper-100" />
        </div>

        <p class="mt-7 font-retro text-5xl text-paper-900">FM 深夜电台｜给失眠的你</p>
      </article>
    </section>
  </main>
</template>
