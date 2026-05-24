<script setup>
import Waveform from './Waveform.vue'

const props = defineProps({
  program: { type: Object, required: true },
  isPlaying: { type: Boolean, required: true },
})

const emit = defineEmits(['toggle'])
</script>

<template>
  <section
    class="rounded-[1.75rem] border border-[#7a502f]/70 bg-[#22150f] px-6 py-5 text-paper-50 shadow-soft"
  >
    <p class="text-[13px] tracking-[0.28em] text-paper-300">NOW PLAYING</p>
    <div class="mt-3 flex items-center justify-between gap-4">
      <div class="min-w-0">
        <h3 class="truncate font-retro text-4xl text-paper-50" :title="props.program.title">{{ props.program.title }}</h3>
        <p class="mt-1 text-2xl text-paper-300">
          {{ props.program.host }} · {{ props.program.duration }}
        </p>
      </div>
      <button
        type="button"
        class="rounded-full border border-amber-500 bg-[#2d1b13] px-6 py-2 text-2xl text-amber-300 transition hover:-translate-y-0.5 hover:bg-[#3a2419] active:translate-y-0"
        @click="emit('toggle')"
      >
        {{ props.isPlaying ? '暂停' : '播放' }}
      </button>
    </div>
    <div class="mt-4">
      <Waveform :animated="props.isPlaying" />
    </div>
  </section>
</template>
