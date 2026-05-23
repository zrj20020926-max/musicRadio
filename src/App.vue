<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TopNav from './components/TopNav.vue'

const route = useRoute()
const router = useRouter()

const navItems = [
  { key: 'home', label: '首页', path: '/' },
  { key: 'discover', label: '发现', path: '/discover' },
  { key: 'live', label: '直播', path: '/live' },
  { key: 'programs', label: '节目', path: '/programs' },
  { key: 'stations', label: '电台', path: '/stations' },
  { key: 'comments', label: '留言', path: '/comments' },
  { key: 'profile', label: '我的', path: '/profile' },
]

const activeNav = computed(() => {
  if (route.path.startsWith('/programs')) {
    return 'programs'
  }
  return navItems.find((item) => item.path === route.path)?.key ?? 'home'
})

function handleNavigate(key) {
  const target = navItems.find((item) => item.key === key)
  if (target) {
    router.push(target.path)
  }
}
</script>

<template>
  <div class="pb-10 font-sans text-paper-900">
    <TopNav :items="navItems" :active="activeNav" @navigate="handleNavigate" />
    <div class="retro-shell">
      <RouterView />
    </div>
  </div>
</template>
