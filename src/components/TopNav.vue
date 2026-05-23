<script setup>
const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  active: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['navigate'])
</script>

<template>
  <header class="retro-shell mt-8 flex h-[68px] items-center justify-between rounded-full border border-paper-600/45 bg-paper-100/90 px-8 shadow-soft">
    <h1 class="font-retro text-[38px] font-bold tracking-wide text-paper-900">RETRO RADIO</h1>
    <nav class="flex items-center gap-2">
      <button
        v-for="item in props.items"
        :key="item.key"
        type="button"
        class="rounded-full px-6 py-2 text-[28px] leading-none text-paper-800 transition-all duration-150 hover:bg-paper-300/70 hover:text-paper-900"
        :class="props.active === item.key ? 'bg-paper-300 text-paper-900 shadow-inner' : ''"
        @click="emit('navigate', item.key)"
      >
        {{ item.label }}
      </button>
    </nav>
    <button class="rounded-full bg-[#1f120d] px-10 py-3 text-[28px] font-semibold leading-none text-paper-50">ON AIR</button>
  </header>
</template>
