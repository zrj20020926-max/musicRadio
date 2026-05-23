export const topPrograms = [
  {
    id: 'night-lamp',
    title: '深夜电台｜给失眠的你',
    host: 'Luna 主播',
    time: '23:00 - 01:00',
    tags: ['陪伴', '夜谈'],
    coverTone: 'from-amber-500 to-orange-800',
    listeners: 1248,
    description: '有人在说话，有音乐在流淌，像深夜里的一盏灯。',
  },
  {
    id: 'golden-wave',
    title: '金色波段｜老歌留声',
    host: '阿远',
    time: '20:00 - 22:00',
    tags: ['经典', '怀旧'],
    coverTone: 'from-yellow-700 to-stone-900',
    listeners: 986,
    description: '那些被磁带反复倒带的旋律，今晚重新亮起。',
  },
  {
    id: 'sunny-cafe',
    title: '午后唱片店',
    host: 'Mia',
    time: '14:00 - 16:00',
    tags: ['轻松', '爵士'],
    coverTone: 'from-lime-700 to-amber-900',
    listeners: 712,
    description: '把咖啡馆角落里最松弛的一段午后，带到你耳边。',
  },
]

export const schedules = [
  { slot: '08:00', title: '清晨频率', host: 'Sora' },
  { slot: '12:00', title: '午间声纹', host: '小满' },
  { slot: '18:00', title: '傍晚转盘', host: 'Ken' },
  { slot: '23:00', title: '深夜电台', host: 'Luna' },
]

export const stations = [
  { name: '木质调 FM', frequency: '87.6', mood: '轻木香与民谣' },
  { name: '午夜 AM', frequency: '1024', mood: '故事与低语' },
  { name: '老城广播', frequency: '98.4', mood: '复古流行与旧闻' },
]

export const initialComments = [
  { id: 1, user: '纸飞机', content: '这个时段的选曲太懂夜猫子了。', liked: 16 },
  { id: 2, user: '旧唱针', content: '听到《月光列车》瞬间泪目。', liked: 9 },
]
