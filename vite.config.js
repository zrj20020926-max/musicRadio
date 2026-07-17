import { fileURLToPath, URL } from 'node:url'
import http from 'node:http'
import https from 'node:https'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { codeInspectorPlugin } from 'code-inspector-plugin'

const REVMA_PROXY_PATH = '/__revma_stream__'
const REVMA_IDLE_RECONNECT_MS = 12000
const REVMA_RECONNECT_DELAY_MS = 250
const MAX_REDIRECTS = 8

function isRevmaUrl(url) {
  try {
    const parsed = new URL(url)
    return /(^|\.)rcs\.revma\.com$/i.test(parsed.hostname)
  } catch {
    return false
  }
}

function pipeRevmaStream(req, res, sourceUrl) {
  if (!isRevmaUrl(sourceUrl)) {
    res.statusCode = 400
    res.end('Invalid Revma stream URL')
    return
  }

  let closed = false
  let upstreamReq = null
  let upstreamRes = null
  let idleTimer = null
  let reconnectTimer = null

  const cleanupUpstream = () => {
    if (idleTimer) {
      clearTimeout(idleTimer)
      idleTimer = null
    }
    if (upstreamReq) {
      upstreamReq.destroy()
      upstreamReq = null
    }
    if (upstreamRes) {
      upstreamRes.destroy()
      upstreamRes = null
    }
  }

  const scheduleReconnect = () => {
    if (closed || reconnectTimer) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect(sourceUrl)
    }, REVMA_RECONNECT_DELAY_MS)
    cleanupUpstream()
  }

  const armIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(scheduleReconnect, REVMA_IDLE_RECONNECT_MS)
  }

  const connect = (targetUrl, redirectCount = 0) => {
    if (closed) return
    let parsed
    try {
      parsed = new URL(targetUrl)
    } catch {
      if (!res.headersSent) {
        res.statusCode = 502
        res.end('Bad upstream URL')
      } else {
        res.destroy()
      }
      return
    }

    const transport = parsed.protocol === 'https:' ? https : http
    upstreamReq = transport.request(
      parsed,
      {
        headers: {
          Accept: '*/*',
          'Cache-Control': 'no-cache',
          'Icy-MetaData': '0',
          'User-Agent': 'Mozilla/5.0 MusicRadio/1.0',
        },
      },
      (upstream) => {
        upstreamRes = upstream

        if (
          upstream.statusCode >= 300 &&
          upstream.statusCode < 400 &&
          upstream.headers.location &&
          redirectCount < MAX_REDIRECTS
        ) {
          const nextUrl = new URL(upstream.headers.location, parsed).toString()
          upstream.resume()
          upstreamReq = null
          upstreamRes = null
          if (idleTimer) {
            clearTimeout(idleTimer)
            idleTimer = null
          }
          connect(nextUrl, redirectCount + 1)
          return
        }

        if (upstream.statusCode !== 200) {
          upstream.resume()
          if (!res.headersSent) {
            res.statusCode = upstream.statusCode || 502
            res.end('Revma upstream unavailable')
          } else {
            scheduleReconnect()
          }
          return
        }

        if (!res.headersSent) {
          res.writeHead(200, {
            'Content-Type': upstream.headers['content-type'] || 'audio/aac',
            'Cache-Control': 'no-store, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
          })
        }

        armIdleTimer()

        upstream.on('data', (chunk) => {
          armIdleTimer()
          if (!res.write(chunk)) {
            upstream.pause()
          }
        })

        upstream.on('end', scheduleReconnect)
        upstream.on('error', scheduleReconnect)
        upstream.on('aborted', scheduleReconnect)
      },
    )

    upstreamReq.setTimeout(0)
    upstreamReq.on('error', scheduleReconnect)
    upstreamReq.end()
  }

  req.on('close', () => {
    closed = true
    if (reconnectTimer) clearTimeout(reconnectTimer)
    cleanupUpstream()
  })

  res.on('drain', () => {
    if (!closed && upstreamRes?.readable) upstreamRes.resume()
  })

  connect(sourceUrl)
}

function revmaStreamProxyPlugin() {
  const handler = (req, res, next) => {
    if (!req.url?.startsWith(REVMA_PROXY_PATH)) {
      next()
      return
    }

    const requestUrl = new URL(req.url, 'http://localhost')
    pipeRevmaStream(req, res, requestUrl.searchParams.get('url') || '')
  }

  return {
    name: 'music-radio-revma-stream-proxy',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    revmaStreamProxyPlugin(),
    vue(),
    codeInspectorPlugin({
      bundler: 'vite',
      editor: 'comate',
      launchType: 'open',
      openIn: 'reuse',
    }),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  base: process.env.VITE_BASE || '/music-radio/',
})
