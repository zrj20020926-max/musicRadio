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
        class="flex items-center justify-between gap-4 rounded-2xl bg-paper-50 px-4 py-3 transition hover:border hover:border-paper-700/40"
      >
        <span class="shrink-0 font-semibold text-paper-800">{{ schedule.time }}</span>
        <div class="min-w-0 flex-1 text-right">
          <button
            type="button"
            class="schedule-title text-paper-900 hover:underline"
            :title="schedule.program.title"
            @click="emit('select', schedule.program.id)"
          >
            <span class="schedule-title__text">{{ schedule.program.title }}</span>
          </button>
          <p class="text-xs text-paper-700">{{ schedule.program.host }}</p>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.schedule-title {
  container-type: inline-size;
  display: block;
  width: 100%;
  max-width: 180px;
  min-width: 0;
  margin-left: auto;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schedule-title__text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: top;
  white-space: nowrap;
}

.schedule-title:hover .schedule-title__text {
  max-width: none;
  overflow: visible;
  text-overflow: clip;
  animation: schedule-title-scroll 6s linear infinite alternate;
}

@keyframes schedule-title-scroll {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(min(0px, calc(100cqw - 100% - 12px)));
  }
}
</style>
