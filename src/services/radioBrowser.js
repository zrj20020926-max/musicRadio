const API_BASE = 'https://de1.api.radio-browser.info/json/stations/search'

const PREFERRED_CODECS = ['mp3', 'aac', 'ogg', 'hls']
const HTTP_URL_RE = /^http:\/\//i

const STRATEGIES = [
  { countrycode: 'CN', hidebroken: true, order: 'votes', reverse: true, limit: 80 },
  { countrycode: 'CN', hidebroken: true, order: 'clickcount', reverse: true, limit: 60 },
  { language: 'chinese', hidebroken: true, order: 'votes', reverse: true, limit: 40 },
]

const KNOWN_CN_STATIONS = [
  {
    stationuuid: 'known-fm93-zhejiang-traffic',
    name: '浙江交通之声',
    url: 'https://ali-m-l.cztv.com/channels/lantian/fm93/128k.m3u8',
    url_resolved: 'https://ali-m-l.cztv.com/channels/lantian/fm93/128k.m3u8',
    country: 'China',
    countrycode: 'CN',
    state: 'Zhejiang',
    language: 'chinese',
    tags: 'traffic,fm93',
    codec: 'HLS',
    bitrate: 128,
    votes: 256,
    clickcount: 100,
    favicon: 'https://pic.qingting.fm/2020/0405/20200405120311.jpeg',
    lastcheckok: 1,
  },
  {
    stationuuid: 'known-fm88-zhejiang-voice',
    name: '浙江之声',
    url: 'https://ali-m-l.cztv.com/channels/lantian/fm88/128k.m3u8',
    url_resolved: 'https://ali-m-l.cztv.com/channels/lantian/fm88/128k.m3u8',
    country: 'China',
    countrycode: 'CN',
    state: 'Zhejiang',
    language: 'chinese',
    tags: 'news,fm88',
    codec: 'HLS',
    bitrate: 128,
    votes: 426,
    clickcount: 50,
    favicon: 'https://pic.qingting.fm/sso/198/1631507628107_SNMv8U_Ue.jpeg',
    lastcheckok: 1,
  },
  {
    stationuuid: 'known-fm968-zhejiang-music',
    name: '浙江音乐调频',
    url: 'https://ali-m-l.cztv.com/channels/lantian/fm968/128k.m3u8',
    url_resolved: 'https://ali-m-l.cztv.com/channels/lantian/fm968/128k.m3u8',
    country: 'China',
    countrycode: 'CN',
    state: 'Zhejiang',
    language: 'chinese',
    tags: 'music,fm96.8',
    codec: 'HLS',
    bitrate: 128,
    votes: 233,
    clickcount: 50,
    favicon: '',
    lastcheckok: 1,
  },
  {
    stationuuid: 'known-fm95-zhejiang-economy',
    name: '浙江经济广播',
    url: 'https://ali-m-l.cztv.com/channels/lantian/fm95/128k.m3u8',
    url_resolved: 'https://ali-m-l.cztv.com/channels/lantian/fm95/128k.m3u8',
    country: 'China',
    countrycode: 'CN',
    state: 'Zhejiang',
    language: 'chinese',
    tags: 'economics,fm95',
    codec: 'HLS',
    bitrate: 128,
    votes: 103,
    clickcount: 30,
    favicon: '',
    lastcheckok: 1,
  },
  {
    stationuuid: 'known-fm107-zhejiang-city',
    name: '浙江城市之声',
    url: 'https://ali-m-l.cztv.com/channels/lantian/fm107/128k.m3u8',
    url_resolved: 'https://ali-m-l.cztv.com/channels/lantian/fm107/128k.m3u8',
    country: 'China',
    countrycode: 'CN',
    state: 'Zhejiang',
    language: 'chinese',
    tags: 'lifestyle,fm107',
    codec: 'HLS',
    bitrate: 128,
    votes: 163,
    clickcount: 30,
    favicon: 'https://pic.qingting.fm/2016/0620/20160620160738275.png',
    lastcheckok: 1,
  },
  {
    stationuuid: 'known-fm1045-zhejiang-travel',
    name: '浙江旅游之声',
    url: 'https://ali-m-l.cztv.com/channels/lantian/fm1045/128k.m3u8',
    url_resolved: 'https://ali-m-l.cztv.com/channels/lantian/fm1045/128k.m3u8',
    country: 'China',
    countrycode: 'CN',
    state: 'Zhejiang',
    language: 'chinese',
    tags: 'music,fm104.5',
    codec: 'HLS',
    bitrate: 128,
    votes: 74,
    clickcount: 20,
    favicon: 'https://pic.qingting.fm/sso/198/1631606706374_5N7WkixsO.jpeg',
    lastcheckok: 1,
  },
  {
    stationuuid: 'known-cnr1-china-voice',
    name: 'CNR-1 中国之声',
    url: 'https://lhttp.qtfm.cn/live/15318317/64k.mp3',
    url_resolved: 'https://lhttp.qtfm.cn/live/15318317/64k.mp3',
    country: 'China',
    countrycode: 'CN',
    state: '',
    language: 'chinese',
    tags: 'news',
    codec: 'MP3',
    bitrate: 64,
    votes: 500,
    clickcount: 200,
    favicon: '',
    lastcheckok: 1,
  },
  {
    stationuuid: 'known-fm988-zhejiang-news',
    name: '浙江新闻广播',
    url: 'https://ali-m-l.cztv.com/channels/lantian/fm988/128k.m3u8',
    url_resolved: 'https://ali-m-l.cztv.com/channels/lantian/fm988/128k.m3u8',
    country: 'China',
    countrycode: 'CN',
    state: 'Zhejiang',
    language: 'chinese',
    tags: 'news,fm98.8',
    codec: 'HLS',
    bitrate: 128,
    votes: 101,
    clickcount: 20,
    favicon: 'https://pic.qingting.fm/sso/198/1631606384323_Mz_8v-pxj.jpeg',
    lastcheckok: 1,
  },
]

function buildUrl(params) {
  const url = new URL(API_BASE)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  url.searchParams.set('_t', Date.now())
  return url.toString()
}

function preferHttps(url) {
  if (!url || !HTTP_URL_RE.test(url)) return url
  return url.replace(HTTP_URL_RE, 'https://')
}

function normalizeStation(station) {
  return {
    ...station,
    url: preferHttps(station.url),
    url_resolved: preferHttps(station.url_resolved),
    favicon: preferHttps(station.favicon),
  }
}

function scoreStation(s) {
  let score = 0
  if (s.lastcheckok === 1) score += 10
  if (PREFERRED_CODECS.includes((s.codec || '').toLowerCase())) score += 5
  if (s.bitrate > 0) score += 3
  if (s.clickcount > 100) score += 2
  if (s.votes > 10) score += 1
  return score
}

export async function fetchRadioStations(customParams) {
  const strategies = customParams ? [customParams] : STRATEGIES
  const seen = new Set()
  let allStations = []

  for (const known of KNOWN_CN_STATIONS) {
    seen.add(known.stationuuid)
    allStations.push(normalizeStation(known))
  }

  for (const params of strategies) {
    const url = buildUrl(params)
    console.log('[radio-browser] fetching', url)
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) continue
      const data = await res.json()
      for (const s of data) {
        if (!s.url_resolved && !s.url) continue
        if (seen.has(s.stationuuid)) continue
        seen.add(s.stationuuid)
        allStations.push(normalizeStation(s))
      }
    } catch (e) {
      console.warn('[radio-browser] strategy failed', params, e)
    }
  }

  allStations.sort((a, b) => scoreStation(b) - scoreStation(a))
  console.log('[radio-browser] loaded', allStations.length)

  saveCachedStations(allStations)
  return allStations
}

export function saveCachedStations(stations) {
  try {
    localStorage.setItem('retro_radio_real_stations', JSON.stringify(stations))
  } catch { /* quota */ }
}

export function loadCachedStations() {
  try {
    const raw = localStorage.getItem('retro_radio_real_stations')
    const cached = raw ? JSON.parse(raw) : []
    return mergeKnownStations(cached.map(normalizeStation))
  } catch { return KNOWN_CN_STATIONS.map(normalizeStation) }
}

function mergeKnownStations(stations) {
  const seen = new Set(stations.map(s => s.stationuuid))
  const merged = [...stations]
  for (const known of KNOWN_CN_STATIONS) {
    if (!seen.has(known.stationuuid)) {
      merged.push(normalizeStation(known))
    }
  }
  return merged
}

export function saveCurrentStation(station) {
  try {
    localStorage.setItem('retro_radio_current_station', JSON.stringify(station))
  } catch { /* quota */ }
}

export function loadCurrentStation() {
  try {
    const raw = localStorage.getItem('retro_radio_current_station')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
