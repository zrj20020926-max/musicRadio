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
  <header
    class="retro-shell mt-4 flex flex-wrap items-center gap-3 rounded-3xl border border-paper-600/45 bg-paper-100/90 px-4 py-3 shadow-soft sm:mt-8 sm:rounded-full sm:px-8"
  >
    <h1 class="font-retro text-2xl font-bold tracking-wide text-paper-900 sm:text-[34px]">RETRO RADIO</h1>
    <nav class="order-3 flex w-full flex-wrap items-center gap-2 sm:order-none sm:w-auto sm:flex-1 sm:justify-center sm:px-6">
      <button
        v-for="item in props.items"
        :key="item.key"
        type="button"
        class="shrink-0 rounded-full px-4 py-2 text-base leading-none text-paper-800 transition-all duration-150 hover:bg-paper-300/70 hover:text-paper-900 sm:px-5 sm:text-[18px]"
        :class="props.active === item.key ? 'bg-paper-300 text-paper-900 shadow-inner' : ''"
        @click="emit('navigate', item.key)"
      >
        {{ item.label }}
      </button>
    </nav>
    <button
      class="shrink-0 rounded-full bg-[#1f120d] px-5 py-2 text-base font-semibold leading-none text-paper-50 sm:px-8 sm:text-[20px]"
    >
      ON AIR
    </button>
  </header>
</template>
