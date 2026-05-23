<script setup>
const props = defineProps({
  toasts: { type: Array, default: () => [] },
})
</script>

<template>
  <div class="fixed right-7 top-24 z-50 space-y-3">
    <div
      v-for="toast in props.toasts"
      :key="toast.id"
      class="rounded-xl border border-paper-700/55 bg-paper-100/95 px-4 py-2 text-paper-900 shadow-soft"
    >
      {{ toast.message }}
    </div>
  </div>
</template>
