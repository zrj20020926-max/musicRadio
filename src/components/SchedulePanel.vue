<script setup>
defineProps({
  schedules: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <section class="rounded-3xl border border-paper-700/30 bg-paper-100/90 p-5 shadow-soft">
    <h3 class="font-retro text-2xl text-paper-900">今日排期</h3>
    <ul class="mt-4 space-y-3">
      <li
        v-for="schedule in schedules"
        :key="schedule.slot"
        class="flex items-center justify-between rounded-2xl bg-paper-50 px-4 py-3"
      >
        <span class="font-semibold text-paper-800">{{ schedule.slot }}</span>
        <div class="text-right">
          <p class="text-paper-900">{{ schedule.title }}</p>
          <p class="text-xs text-paper-700">{{ schedule.host }}</p>
        </div>
      </li>
    </ul>
  </section>
</template>
