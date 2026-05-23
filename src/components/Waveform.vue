<script setup>
import { computed } from 'vue'

const props = defineProps({
  animated: {
    type: Boolean,
    default: false,
  },
})

const bars = computed(() => [18, 34, 28, 44, 24, 36, 52, 30, 48, 22, 40, 32, 46, 26, 38, 20, 35, 29, 41, 23])
</script>

<template>
  <div class="flex h-16 items-end gap-[5px]">
    <span
      v-for="(height, idx) in bars"
      :key="idx"
      class="w-[5px] rounded-full bg-gradient-to-t from-[#7d4f28] via-[#b98545] to-[#d8b16d]"
      :class="props.animated ? 'animate-pulse' : ''"
      :style="{ height: `${height}px`, animationDelay: `${idx * 70}ms` }"
    />
  </div>
</template>
