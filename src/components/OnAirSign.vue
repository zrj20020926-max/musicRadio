<script setup>
const props = defineProps({
  active: { type: Boolean, default: false },
})
</script>

<template>
  <div class="onair-sign" :class="{ 'onair-sign--active': active }">
    <span class="onair-text">ON AIR</span>
  </div>
</template>

<style scoped>
.onair-sign {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 20px;
  border-radius: 6px;
  background: #3a1515;
  border: 1px solid #5a2020;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  transition: background 0.4s ease, box-shadow 0.4s ease;
}

.onair-sign--active {
  background: #8b2020;
  border-color: #c04040;
  box-shadow: 0 0 20px rgba(200, 60, 40, 0.4), 0 2px 8px rgba(0, 0, 0, 0.4);
  animation: onair-flicker 2s ease-in-out infinite;
}

.onair-text {
  font-family: monospace;
  font-size: clamp(11px, 1.4vw, 16px);
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #5a3030;
  text-shadow: none;
  transition: color 0.4s ease, text-shadow 0.4s ease;
}

.onair-sign--active .onair-text {
  color: #ffd4a0;
  text-shadow: 0 0 8px rgba(255, 200, 120, 0.6);
}

@keyframes onair-flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
  52% { opacity: 1; }
  54% { opacity: 0.85; }
  56% { opacity: 1; }
}
</style>
