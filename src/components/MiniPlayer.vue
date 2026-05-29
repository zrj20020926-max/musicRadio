<script setup>
import Waveform from './Waveform.vue'

const props = defineProps({
  program: { type: Object, required: true },
  station: { type: Object, default: null },
  isPlaying: { type: Boolean, required: true },
})

const emit = defineEmits(['toggle'])
</script>

<template>
  <section
    class="min-h-[220px] rounded-[1.75rem] border border-[#7a502f]/70 bg-[#22150f] px-6 py-5 text-paper-50 shadow-soft"
  >
    <p class="text-[13px] tracking-[0.28em] text-paper-300">NOW PLAYING</p>
    <div class="mt-3 flex items-center justify-between gap-4">
      <div class="min-w-0 flex-1">
        <h3
          class="mini-player-title font-retro text-4xl text-paper-50"
          :title="props.station ? props.station.name : props.program.title"
        >
          <span class="mini-player-title__text">
            {{ props.station ? props.station.name : props.program.title }}
          </span>
        </h3>
        <p class="mt-1 truncate text-2xl text-paper-300">
          <template v-if="props.station">
            {{ props.station.country || 'Unknown' }} · {{ (props.station.codec || '').toUpperCase() }}
            <span v-if="props.station.bitrate">{{ props.station.bitrate }}kbps</span>
          </template>
          <template v-else>
            {{ props.program.host }} · {{ props.program.duration }}
          </template>
        </p>
      </div>
      <button
        type="button"
        class="w-[104px] shrink-0 whitespace-nowrap rounded-full border border-amber-500 bg-[#2d1b13] px-6 py-2 text-center text-2xl text-amber-300 transition hover:-translate-y-0.5 hover:bg-[#3a2419] active:translate-y-0"
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

<style scoped>
.mini-player-title {
  container-type: inline-size;
  display: block;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-player-title__text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: top;
  white-space: nowrap;
}

.mini-player-title:hover .mini-player-title__text {
  max-width: none;
  overflow: visible;
  text-overflow: clip;
  animation: mini-player-title-scroll 6s linear infinite alternate;
}

@keyframes mini-player-title-scroll {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(min(0px, calc(100cqw - 100% - 12px)));
  }
}
</style>
