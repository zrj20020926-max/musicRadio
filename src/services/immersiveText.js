const TEXT_API_BASE = 'https://v1.hitokoto.cn/'
const TEXT_CATEGORIES = ['d', 'e', 'f', 'g', 'h', 'i', 'k']
const DEFAULT_BATCH_SIZE = 10

function buildTextApiUrl() {
  const params = new URLSearchParams({ encode: 'json' })
  TEXT_CATEGORIES.forEach((category) => params.append('c', category))
  params.set('t', `${Date.now()}-${Math.random()}`)
  return `${TEXT_API_BASE}?${params.toString()}`
}

function normalizeApiLine(payload) {
  if (!payload) return ''
  if (typeof payload === 'string') return payload.trim()
  return (payload.hitokoto || payload.text || payload.content || '').trim()
}

export async function fetchImmersiveTextLine(options = {}) {
  const timeoutMs = options.timeoutMs || 2200
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(buildTextApiUrl(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`Text API failed: ${response.status}`)
    return normalizeApiLine(await response.json())
  } finally {
    window.clearTimeout(timer)
  }
}

export async function fetchImmersiveTextLines(options = {}) {
  const batchSize = options.batchSize || DEFAULT_BATCH_SIZE
  const results = await Promise.allSettled(
    Array.from({ length: batchSize }, () => fetchImmersiveTextLine(options)),
  )
  return results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value)
    .filter(Boolean)
}
