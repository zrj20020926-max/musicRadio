import { BaseEffect } from './baseEffect'
import { noise2D } from '../utils/noise'

const MAX_FIREFLIES = 30
const TRAIL_LEN = 10

export class FireflyEffect extends BaseEffect {
  constructor(canvas, ctx, options) {
    super(canvas, ctx, options)
    this._flies = []
    this._init()
  }

  _init() {
    for (let i = 0; i < MAX_FIREFLIES; i++) {
      const hue = 50 + Math.random() * 70
      this._flies.push({
        baseX: Math.random() * this.cssWidth,
        baseY: Math.random() * this.cssHeight,
        x: 0, y: 0,
        orbitRadius: 30 + Math.random() * 60,
        orbitPhase: Math.random() * Math.PI * 2,
        orbitSpeed: 0.002 + Math.random() * 0.006,
        brightness: 0,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.012 + Math.random() * 0.02,
        hue,
        size: 2 + Math.random() * 3,
        trail: [],
        noiseX: Math.random() * 1000,
        noiseY: Math.random() * 1000,
      })
    }
  }

  resize(w, h) {
    super.resize(w, h)
    for (const f of this._flies) {
      f.baseX = Math.random() * this.cssWidth
      f.baseY = Math.random() * this.cssHeight
    }
  }

  update(dt) {
    const dtScale = dt / 16.67
    for (const f of this._flies) {
      f.x = f.baseX + Math.cos(this.time * f.orbitSpeed + f.orbitPhase) * f.orbitRadius
      f.y = f.baseY + Math.sin(this.time * f.orbitSpeed * 0.7 + f.orbitPhase) * f.orbitRadius * 0.6

      f.brightness = 0.3 + (Math.sin(this.time * f.pulseSpeed + f.pulsePhase) * 0.5 + 0.5) * 0.7

      f.baseX += noise2D(f.noiseX + this.time * 0.00005, 0) * 0.15 * dtScale
      f.baseY += noise2D(0, f.noiseY + this.time * 0.00005) * 0.12 * dtScale

      if (f.baseX < -50) f.baseX = this.cssWidth + 50
      if (f.baseX > this.cssWidth + 50) f.baseX = -50
      if (f.baseY < -50) f.baseY = this.cssHeight + 50
      if (f.baseY > this.cssHeight + 50) f.baseY = -50

      f.trail.push({ x: f.x, y: f.y, alpha: 1 })
      if (f.trail.length > TRAIL_LEN) f.trail.shift()
      for (const pt of f.trail) {
        pt.alpha -= 0.08 * dtScale
      }
    }
  }

  render() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.cssWidth, this.cssHeight)

    ctx.save()
    ctx.globalCompositeOperation = 'lighter'

    for (const f of this._flies) {
      for (const pt of f.trail) {
        if (pt.alpha <= 0) continue
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, f.size * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${f.hue}, 80%, 70%, ${pt.alpha * f.brightness * 0.3})`
        ctx.fill()
      }

      const glowR = f.size * 4
      const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, glowR)
      glow.addColorStop(0, `hsla(${f.hue}, 80%, 75%, ${f.brightness * 0.4})`)
      glow.addColorStop(0.3, `hsla(${f.hue}, 70%, 60%, ${f.brightness * 0.15})`)
      glow.addColorStop(1, `hsla(${f.hue}, 60%, 50%, 0)`)
      ctx.beginPath()
      ctx.arc(f.x, f.y, glowR, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.fill()

      ctx.beginPath()
      ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${f.hue}, 85%, 82%, ${f.brightness * 0.9})`
      ctx.fill()
    }

    ctx.restore()
  }

  destroy() {
    this._flies = []
    super.destroy()
  }
}
