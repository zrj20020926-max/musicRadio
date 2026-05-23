<script setup>
const props = defineProps({
  program: { type: Object, required: true },
  isPlaying: { type: Boolean, required: true },
  progress: { type: Number, required: true },
  durationSec: { type: Number, required: true },
  progressLabel: { type: String, required: true },
  durationLabel: { type: String, required: true },
  nextTitle: { type: String, default: '暂无下一集' },
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
          <span class="text-xs text-paper-700"
            >{{ props.progressLabel }} / {{ props.durationLabel }}</span
          >
        </div>
        <p class="mt-1 truncate font-retro text-3xl text-paper-900">
          {{ props.program.category }} · {{ props.program.title }}
        </p>
        <p class="truncate text-lg text-paper-700">
          主播 {{ props.program.host }} · {{ formatListeners(props.program.listeners) }} 人收听 ·
          下一集：{{ props.nextTitle }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-full border border-paper-700 px-3 py-1 text-paper-900 hover:bg-paper-100"
          @click="emit('prev')"
        >
          上一首
        </button>
        <button
          type="button"
          class="rounded-full bg-[#24160f] px-4 py-1 text-paper-50 hover:bg-[#2f1d14]"
          @click="emit('toggle')"
        >
          {{ props.isPlaying ? '暂停' : '播放' }}
        </button>
        <button
          type="button"
          class="rounded-full border border-paper-700 px-3 py-1 text-paper-900 hover:bg-paper-100"
          @click="emit('next')"
        >
          下一首
        </button>
      </div>

      <div class="flex w-[38%] min-w-[300px] items-center gap-2">
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
    </div>
  </section>
</template>
