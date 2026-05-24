<script setup>
const props = defineProps({
  program: { type: Object, default: null },
  station: { type: Object, default: null },
  isPlaying: { type: Boolean, required: true },
  progress: { type: Number, required: true },
  durationSec: { type: Number, required: true },
  progressLabel: { type: String, required: true },
  durationLabel: { type: String, required: true },
  nextTitle: { type: String, default: '暂无下一集' },
  feedback: { type: String, default: '' },
})

const emit = defineEmits(['toggle', 'seek', 'next', 'prev'])

function handleSeek(event) {
  emit('seek', Number(event.target.value))
}

function formatListeners(value) {
  if (!value && value !== 0) {
    return '--'
  }
  return new Intl.NumberFormat('zh-CN').format(value)
}
</script>

<template>
  <section
    class="fixed bottom-0 left-0 right-0 z-40 border-t border-paper-700/55 bg-paper-200/95 backdrop-blur"
  >
    <div class="retro-shell flex items-center gap-5 px-4 py-3">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span
            class="rounded-full border px-2 py-0.5 text-xs tracking-[0.16em]"
            :class="
              props.isPlaying
                ? 'border-[#7f2e20] bg-[#f7e2bf] text-[#7f2e20]'
                : 'border-paper-700/60 text-paper-700'
            "
          >
            {{ props.isPlaying ? 'ON AIR' : 'PAUSED' }}
          </span>
          <span v-if="props.station" class="text-xs font-medium text-amber-700">LIVE</span>
          <span v-else class="text-xs text-paper-700"
            >{{ props.progressLabel }} / {{ props.durationLabel }}</span
          >
        </div>
        <p v-if="props.station" class="mt-1 truncate font-retro text-3xl text-paper-900">
          {{ props.station.name }}
        </p>
        <p v-else class="mt-1 truncate font-retro text-3xl text-paper-900">
          {{ props.program?.category }} · {{ props.program?.title }}
        </p>
        <p class="truncate text-lg text-paper-700">
          <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
            mode="out-in"
          >
            <span v-if="props.feedback" :key="props.feedback" class="font-medium text-[#7f2e20]">{{
              props.feedback
            }}</span>
            <span v-else-if="props.station" key="station"
              >{{ props.station.country }} · {{ (props.station.codec || '').toUpperCase() }} {{ props.station.bitrate }}kbps</span
            >
            <span v-else key="default"
              >主播 {{ props.program?.host }} · {{ formatListeners(props.program?.listeners) }} 人收听
              · 下一集：{{ props.nextTitle }}</span
            >
          </Transition>
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="!props.station"
          type="button"
          class="rounded-full border border-paper-700 px-3 py-1 text-paper-900 hover:bg-paper-100"
          @click="emit('prev')"
        >
          上一首
        </button>
        <button
          type="button"
          class="grid h-11 w-11 place-content-center rounded-full border border-[#3a2419] bg-[#24160f] text-paper-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition hover:-translate-y-0.5 hover:bg-[#2f1d14]"
          @click="emit('toggle')"
          :aria-label="props.isPlaying ? '暂停' : '播放'"
        >
          <svg
            v-if="!props.isPlaying"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="h-6 w-6 translate-x-[1px]"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="h-6 w-6"
          >
            <path d="M7 5h4v14H7zm6 0h4v14h-4z" />
          </svg>
        </button>
        <button
          v-if="!props.station"
          type="button"
          class="rounded-full border border-paper-700 px-3 py-1 text-paper-900 hover:bg-paper-100"
          @click="emit('next')"
        >
          下一首
        </button>
      </div>

      <div v-if="!props.station" class="flex w-[38%] min-w-[300px] items-center gap-2">
        <span class="w-12 text-right text-sm text-paper-700">{{ props.progressLabel }}</span>
        <input
          class="h-2 w-full accent-[#6a4329]"
          type="range"
          min="0"
          :max="props.durationSec"
          :value="props.progress"
          @input="handleSeek"
        />
        <span class="w-12 text-sm text-paper-700">{{ props.durationLabel }}</span>
      </div>
      <div v-else class="flex items-center gap-2">
        <span class="rounded-full bg-[#a43b2a] px-3 py-1 text-xs font-bold tracking-widest text-white">LIVE</span>
      </div>
    </div>
  </section>
</template>
