<script setup>
const props = defineProps({
  toasts: { type: Array, default: () => [] },
})
</script>

<template>
  <div class="fixed left-1/2 top-20 z-50 w-[min(92vw,560px)] -translate-x-1/2 space-y-3">
    <TransitionGroup
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-[-12px] opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100 scale-100"
      leave-to-class="translate-y-[-8px] opacity-0 scale-95"
      move-class="transition-all duration-300 ease-out"
    >
      <div
        v-for="toast in props.toasts"
        :key="toast.id"
        class="rounded-xl border border-paper-700/40 bg-paper-100/98 px-5 py-3 text-center text-xl text-paper-900 shadow-lg backdrop-blur-sm"
      >
        {{ toast.message }}
      </div>
    </TransitionGroup>
  </div>
</template>
