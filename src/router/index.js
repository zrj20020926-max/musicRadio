import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import DiscoverPage from '../pages/DiscoverPage.vue'
import LivePage from '../pages/LivePage.vue'
import ProgramsPage from '../pages/ProgramsPage.vue'
import ProgramDetailPage from '../pages/ProgramDetailPage.vue'
import StationsPage from '../pages/StationsPage.vue'
import CommentsPage from '../pages/CommentsPage.vue'
import ProfilePage from '../pages/ProfilePage.vue'

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/discover', name: 'discover', component: DiscoverPage },
  { path: '/live', name: 'live', component: LivePage },
  { path: '/programs', name: 'programs', component: ProgramsPage },
  { path: '/programs/:id', name: 'program-detail', component: ProgramDetailPage },
  { path: '/stations', name: 'stations', component: StationsPage },
  { path: '/comments', name: 'comments', component: CommentsPage },
  { path: '/profile', name: 'profile', component: ProfilePage },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
