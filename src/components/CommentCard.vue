<script setup>
defineProps({
  comment: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <article class="rounded-2xl border border-paper-700/30 bg-paper-50 p-4">
    <div class="flex items-center justify-between">
      <p class="font-semibold text-paper-900">{{ comment.user }}</p>
      <span class="text-xs text-paper-700">👍 {{ comment.liked }}</span>
    </div>
    <p class="mt-2 text-paper-800">{{ comment.content }}</p>
  </article>
</template>
