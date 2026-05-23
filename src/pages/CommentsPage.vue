<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import Waveform from '../components/Waveform.vue'
import { useRadioStore } from '../stores/radio'

const radioStore = useRadioStore()
const { comments, currentProgram, isPlaying } = storeToRefs(radioStore)
const draft = ref('')

const userMenus = ['收听历史', '我的留言', '下载管理', '定时关闭', '设置']

function submitComment() {
  const content = draft.value.trim()
  if (!content) {
    return
  }
  radioStore.addComment(content)
  draft.value = ''
}
</script>

<template>
  <main class="mt-8 w-full">
    <section class="grid grid-cols-[1.75fr_0.95fr] gap-8">
      <article class="rounded-[2rem] border border-paper-600/60 bg-paper-200/90 p-8 shadow-soft">
        <h2 class="font-retro text-6xl text-paper-900">听友留言</h2>

        <div class="mt-5 space-y-4">
          <div
            v-for="comment in comments.slice(0, 4)"
            :key="comment.id"
            class="flex items-center justify-between rounded-2xl border border-paper-600/50 bg-paper-100 px-4 py-4"
          >
            <div class="flex min-w-0 items-center gap-4">
              <span class="h-11 w-11 rounded-full bg-[#6a4329]" />
              <p class="truncate text-3xl text-paper-900">{{ comment.content }}</p>
            </div>
            <span class="ml-3 text-3xl text-[#7f4327]">♡ {{ comment.liked }}</span>
          </div>
        </div>

        <div
          class="mt-6 flex items-center rounded-full border border-paper-600/60 bg-paper-100 px-4 py-2 transition focus-within:border-paper-800 focus-within:shadow-sm"
        >
          <input
            v-model="draft"
            class="w-full bg-transparent text-3xl text-paper-900 outline-none placeholder:text-paper-600"
            placeholder="说点什么吧..."
            @keydown.enter="submitComment"
          />
          <button
            type="button"
            class="grid h-14 w-14 place-content-center rounded-full bg-paper-900 text-2xl text-paper-50"
            @click="submitComment"
          >
            ➤
          </button>
        </div>
      </article>

      <aside class="rounded-[2rem] border border-paper-600/60 bg-paper-200/90 p-6 shadow-soft">
        <div class="flex items-center gap-4">
          <span class="h-24 w-24 rounded-full bg-[#6a4329]" />
          <div>
            <h3 class="font-retro text-6xl text-paper-900">晚安电台听友</h3>
            <p class="text-3xl text-paper-700">声音陪伴 128 天</p>
          </div>
        </div>

        <div class="mt-7 grid grid-cols-3 gap-4 text-paper-900">
          <div>
            <p class="font-retro text-6xl">12</p>
            <p class="text-3xl text-paper-700">订阅</p>
          </div>
          <div>
            <p class="font-retro text-6xl">28</p>
            <p class="text-3xl text-paper-700">收藏</p>
          </div>
          <div>
            <p class="font-retro text-6xl">156h</p>
            <p class="text-3xl text-paper-700">收听时长</p>
          </div>
        </div>

        <ul class="mt-7 divide-y divide-paper-600/40 border-y border-paper-600/40">
          <li v-for="menu in userMenus" :key="menu" class="flex items-center justify-between py-4">
            <span class="font-retro text-5xl text-paper-900">{{ menu }}</span>
            <span class="text-4xl text-paper-700">›</span>
          </li>
        </ul>
      </aside>
    </section>
  </main>
</template>
