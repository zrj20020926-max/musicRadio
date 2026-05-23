export const programs = [
  {
    id: 'night-lamp',
    title: '深夜电台｜给失眠的你',
    host: '阿北',
    category: '深夜',
    description: '每个夜晚，我都会在这里，陪你聊聊天，听首歌，读一封信。',
    date: '2024-05-19',
    duration: '45:00',
    listeners: 2378,
    isLive: true,
    cover: {
      tone: 'from-[#2b1a14] to-[#4a2d1f]',
      frequency: '89.6 FM',
    },
    episodes: [
      { id: 'night-1', date: '2024-05-19', title: '你并不孤单', duration: '直播中' },
      { id: 'night-2', date: '2024-05-18', title: '慢慢地睡去', duration: '42:36' },
      { id: 'night-3', date: '2024-05-17', title: '那些说不出口的话', duration: '43:28' },
    ],
  },
  {
    id: 'sunrise-fm',
    title: '早安电台｜开启美好的一天',
    host: '小七',
    category: '早安',
    description: '用轻快音乐和温柔播报，开启你的第一缕晨光。',
    date: '2024-05-20',
    duration: '25:36',
    listeners: 12000,
    isLive: false,
    cover: {
      tone: 'from-amber-700 to-stone-900',
      frequency: '87.2 FM',
    },
    episodes: [
      { id: 'sun-1', date: '2024-05-20', title: '晨光第一首歌', duration: '25:36' },
      { id: 'sun-2', date: '2024-05-19', title: '今天也请加油', duration: '23:18' },
    ],
  },
  {
    id: 'coffee-time',
    title: '午后时光｜音乐与咖啡',
    host: '林深',
    category: '午后',
    description: '像坐在窗边喝咖啡，慢一点，把情绪放松。',
    date: '2024-05-19',
    duration: '32:18',
    listeners: 8765,
    isLive: false,
    cover: {
      tone: 'from-[#4a311d] to-[#2e1d12]',
      frequency: '91.4 FM',
    },
    episodes: [
      { id: 'coffee-1', date: '2024-05-19', title: '音乐与咖啡', duration: '32:18' },
      { id: 'coffee-2', date: '2024-05-16', title: '城市漫游', duration: '31:20' },
    ],
  },
  {
    id: 'story-time',
    title: '故事时间｜那些温暖的事',
    host: '阿北',
    category: '故事',
    description: '收集普通人的小故事，给每个夜晚一点温度。',
    date: '2024-05-18',
    duration: '28:47',
    listeners: 6543,
    isLive: false,
    cover: {
      tone: 'from-[#503424] to-[#2b1b13]',
      frequency: '93.8 FM',
    },
    episodes: [
      { id: 'story-1', date: '2024-05-18', title: '那些温暖的事', duration: '28:47' },
      { id: 'story-2', date: '2024-05-17', title: '电台书信', duration: '27:10' },
    ],
  },
]

export const initialComments = [
  { id: 1, user: '纸飞机', content: '这个时段的选曲太懂夜猫子了。', liked: 128 },
  { id: 2, user: '旧唱针', content: '谢谢电台陪我度过一个又一个失眠夜晚。', liked: 96 },
  { id: 3, user: '山茶', content: 'BGM 选得太好了，每次都刚刚好。', liked: 74 },
  { id: 4, user: '夏夜', content: '在这里听到很多治愈的话，感谢陪伴。', liked: 65 },
]

export const featuredProgramIds = ['sunrise-fm', 'coffee-time', 'story-time']

export const todaySchedule = [
  { time: '07:00', programId: 'sunrise-fm' },
  { time: '12:00', programId: 'coffee-time' },
  { time: '21:00', programId: 'night-lamp' },
  { time: '23:00', programId: 'story-time' },
]
