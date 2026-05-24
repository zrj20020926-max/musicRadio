<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Waveform from '../components/Waveform.vue'
import { useRadioStore } from '../stores/radio'

const router = useRouter()
const radioStore = useRadioStore()
const { programs, currentProgram, isPlaying, updateStatus, updateMessage, lastUpdatedAt } =
  storeToRefs(radioStore)

const activeTag = ref('全部节目')
const keyword = ref('')
const tags = ['全部节目', '早安', '午后', '深夜', '故事']

const filteredItems = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase()

  return programs.value.filter((item) => {
    const byCategory = activeTag.value === '全部节目' ? true : item.category === activeTag.value
    if (!byCategory) return false

    if (!normalizedKeyword) return true

    return [item.title, item.host, item.category]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(normalizedKeyword))
  })
})

const statusClass = computed(() => {
  if (updateStatus.value === 'loading') return 'text-paper-700'
  if (updateStatus.value === 'success') return 'text-[#1f6b43]'
  if (updateStatus.value === 'error') return 'text-[#8a2c1d]'
  return 'text-paper-700'
})

function goProgramDetail(programId) {
  router.push(`/programs/${programId}`)
}

async function handleUpdatePrograms() {
  await radioStore.updateExternalContent()
}

function handlePlayNow(programId) {
  radioStore.playProgram(programId)
}

function handleAddQueue(programId) {
  radioStore.addToQueue(programId)
}
</script>

<template>
  <main class="mt-8 w-full pb-8">
    <div class="flex items-start justify-between gap-5">
      <div>
        <h2 class="font-retro text-6xl text-paper-900">节目</h2>
        <p class="mt-2 text-xl text-paper-700">
          上次更新：{{ lastUpdatedAt || '尚未更新（使用本地内容）' }}
        </p>
        <p class="text-xl" :class="statusClass">
          {{ updateMessage || '可手动从公开接口更新节目内容' }}
        </p>
      </div>
      <button
        type="button"
        class="rounded-full border border-paper-700 bg-paper-100 px-5 py-2 text-2xl text-paper-900 transition hover:bg-paper-200 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="updateStatus === 'loading'"
        @click="handleUpdatePrograms"
      >
        {{ updateStatus === 'loading' ? '更新中...' : '更新节目' }}
      </button>
    </div>

    <div class="mt-5 rounded-2xl border border-paper-600/60 bg-paper-100/70 px-4 py-3">
      <input
        v-model="keyword"
        type="text"
        class="w-full bg-transparent text-2xl text-paper-900 outline-none placeholder:text-paper-600"
        placeholder="搜索标题 / 主播 / 分类"
      />
    </div>

    <div class="mt-4 flex items-center gap-4">
      <button
        v-for="tag in tags"
        :key="tag"
        type="button"
        class="rounded-full border border-paper-700/50 px-6 py-2 text-3xl transition"
        :class="
          activeTag === tag
            ? 'bg-paper-900 text-paper-50'
            : 'bg-paper-100/80 text-paper-900 hover:bg-paper-200'
        "
        @click="activeTag = tag"
      >
        {{ tag }}
      </button>
    </div>

    <section v-if="filteredItems.length" class="mt-7 grid grid-cols-1 gap-5 2xl:grid-cols-2">
      <article
        v-for="item in filteredItems"
        :key="item.id"
        class="flex items-center justify-between rounded-[1.6rem] border border-paper-600/60 bg-paper-200/90 px-5 py-4 shadow-soft"
      >
        <div class="flex items-center gap-4">
          <div
            class="grid h-14 w-14 place-content-center rounded-2xl bg-paper-900 text-xl text-paper-100"
          >
            📻
          </div>
          <div>
            <button
              type="button"
              class="text-left font-retro text-4xl text-paper-900 hover:underline"
              @click="goProgramDetail(item.id)"
            >
              {{ item.title }}
            </button>
            <p class="mt-1 text-2xl text-paper-700">
              主播: {{ item.host }} · 分类 {{ item.category }} · {{ item.listeners }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-full border border-paper-700 px-3 py-1 text-lg text-paper-800 hover:bg-paper-100"
            @click="handlePlayNow(item.id)"
          >
            播放
          </button>
          <button
            type="button"
            class="rounded-full border border-paper-700 px-3 py-1 text-lg text-paper-800 hover:bg-paper-100"
            @click="handleAddQueue(item.id)"
          >
            入队
          </button>
          <button
            type="button"
            class="text-4xl text-paper-700 transition hover:translate-x-1"
            @click="goProgramDetail(item.id)"
          >
            ↗
          </button>
        </div>
      </article>
    </section>

    <section
      v-else
      class="mt-8 rounded-[1.7rem] border border-paper-700/45 bg-paper-100/85 p-8 text-center"
    >
      <p class="font-retro text-5xl text-paper-900">没有找到匹配的节目</p>
      <p class="mt-2 text-2xl text-paper-700">换个关键词试试，或清空搜索查看全部内容。</p>
    </section>

    <footer
      class="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[1.7rem] bg-[#24160f] px-4 py-4 text-paper-50 shadow-soft sm:px-6"
    >
      <div class="flex items-center gap-4">
        <div class="grid h-14 w-14 place-content-center rounded-2xl bg-paper-800 text-xl">📻</div>
        <div>
          <p class="font-retro text-4xl">{{ currentProgram.title }}</p>
          <p class="text-2xl text-paper-300">主播: {{ currentProgram.host }}</p>
        </div>
      </div>
      <Waveform :animated="isPlaying" />
      <button
        type="button"
        class="grid h-16 w-16 place-content-center rounded-full border-2 border-amber-600 text-4xl text-amber-400 transition hover:scale-105"
        @click="radioStore.togglePlay(currentProgram.id)"
      >
        {{ isPlaying ? 'Ⅱ' : '▶' }}
      </button>
    </footer>
  </main>
</template>
