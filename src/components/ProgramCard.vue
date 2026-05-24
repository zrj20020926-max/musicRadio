<script setup>
const props = defineProps({
  program: { type: Object, required: true },
  isSubscribed: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
})

const emit = defineEmits(['play', 'subscribe', 'favorite', 'detail'])
</script>

<template>
  <article
    class="retro-card rounded-[1.5rem] p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-paper-700"
  >
    <div class="flex items-start gap-4 rounded-2xl bg-paper-100/70 p-3">
      <div class="h-20 w-20 shrink-0 rounded-2xl border border-paper-700/60 bg-[#2a1a14] p-2">
        <div class="h-full rounded-xl border border-amber-500/60 p-2">
          <div class="h-5 rounded bg-amber-500/70" />
          <div class="mt-2 flex gap-2">
            <span class="h-2 w-2 rounded-full border border-amber-400" /><span
              class="h-2 w-2 rounded-full border border-amber-400"
            />
          </div>
        </div>
      </div>
      <div class="min-w-0 flex-1">
        <div
          class="inline-flex rounded-lg bg-[#a43b2a] px-2 py-1 text-[11px] font-semibold tracking-[0.15em] text-paper-50"
        >
          ON AIR
        </div>
        <button
          type="button"
          class="mt-2 line-clamp-2 text-left font-retro text-3xl leading-tight text-paper-900 hover:underline"
          @click="emit('detail', props.program.id)"
        >
          {{ props.program.title }}
        </button>
        <p class="mt-1 text-xl text-paper-700">{{ props.program.host }}</p>
        <p class="text-lg text-paper-600">更新于今日 · {{ props.program.listeners }} 次收听</p>
      </div>
    </div>
    <p class="mt-3 line-clamp-2 text-lg text-paper-700">{{ props.program.description }}</p>
    <div class="mt-4 flex gap-2">
      <button
        class="flex-1 rounded-full bg-[#24160f] px-3 py-2 text-xl text-paper-50 transition hover:bg-[#2f1d14]"
        @click="emit('play', props.program.id)"
      >
        收听
      </button>
      <button
        class="rounded-full border px-3 py-2 text-lg transition-all duration-200 active:scale-95"
        :class="
          props.isSubscribed
            ? 'border-[#7f2e20] bg-[#f5deb4] text-[#7f2e20] shadow-[0_0_0_2px_rgba(127,46,32,0.2)] animate-[pulse_0.45s_ease-in-out]'
            : 'border-paper-700 text-paper-800 hover:bg-paper-200'
        "
        @click="emit('subscribe', props.program.id)"
      >
        {{ props.isSubscribed ? '已订阅' : '订阅' }}
      </button>
      <button
        class="rounded-full border border-paper-700 px-3 py-2 text-lg text-paper-800 transition hover:bg-paper-200"
        @click="emit('favorite', props.program.id)"
      >
        {{ props.isFavorite ? '已收藏' : '收藏' }}
      </button>
    </div>
  </article>
</template>
