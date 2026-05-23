<script setup>
defineProps({
  schedules: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['select'])
</script>

<template>
  <section class="rounded-3xl border border-paper-700/30 bg-paper-100/90 p-5 shadow-soft">
    <h3 class="font-retro text-2xl text-paper-900">今日排期</h3>
    <ul class="mt-4 space-y-3">
      <li
        v-for="schedule in schedules"
        :key="schedule.time"
        class="flex items-center justify-between rounded-2xl bg-paper-50 px-4 py-3 transition hover:border hover:border-paper-700/40"
      >
        <span class="font-semibold text-paper-800">{{ schedule.time }}</span>
        <div class="text-right">
          <button
            type="button"
            class="text-paper-900 hover:underline"
            @click="emit('select', schedule.program.id)"
          >
            {{ schedule.program.title }}
          </button>
          <p class="text-xs text-paper-700">{{ schedule.program.host }}</p>
        </div>
      </li>
    </ul>
  </section>
</template>
