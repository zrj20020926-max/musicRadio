import { BaseEffect } from './baseEffect'
import { noise2D } from '../utils/noise'

const MAX_PARTICLES = 34

export class FogEffect extends BaseEffect {
  constructor(canvas, ctx, options) {
    super(canvas, ctx, options)
    this._particles = []
    this._init()
  }

  _init() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this._particles.push({
        x: Math.random() * this.cssWidth,
        y: Math.random() * this.cssHeight,
        width: 260 + Math.random() * 520,
        height: 100 + Math.random() * 200,
        baseOpacity: 0.045 + Math.random() * 0.075,
        opacity: 0,
        velocityX: 0.12 + Math.random() * 0.38,
        velocityY: -0.035 + Math.random() * 0.07,
        layer: Math.floor(Math.random() * 3),
        noiseX: Math.random() * 1000,
        noiseY: Math.random() * 1000,
        phase: Math.random() * Math.PI * 2,
        rotation: -0.12 + Math.random() * 0.24,
        swirl: 0.4 + Math.random() * 0.8,
      })
    }
  }

  resize(w, h) {
    super.resize(w, h)
  }

  update(dt) {
    const dtScale = dt / 16.67
    for (const p of this._particles) {
      const layerSpeed = 1 + p.layer * 0.5
      const drift = noise2D(p.noiseX + this.time * 0.00008, p.noiseY)
      const lift = noise2D(p.noiseX, p.noiseY + this.time * 0.00012)
      p.x += (p.velocityX * layerSpeed + drift * 0.18) * dtScale
      p.y += (p.velocityY + lift * 0.28) * dtScale

      p.rotation += noise2D(p.noiseX + this.time * 0.00005, p.noiseY + 200) * 0.0008 * dtScale
      p.opacity = p.baseOpacity + Math.sin(this.time * 0.00065 + p.phase) * 0.025

      if (p.x - p.width / 2 > this.cssWidth) {
        p.x = -p.width / 2
        p.y = Math.random() * this.cssHeight
      }
      if (p.x + p.width / 2 < 0) {
        p.x = this.cssWidth + p.width / 2
      }
      if (p.y - p.height / 2 > this.cssHeight) {
        p.y = -p.height / 2
      }
      if (p.y + p.height / 2 < 0) {
        p.y = this.cssHeight + p.height / 2
      }
    }
  }

  render() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.cssWidth, this.cssHeight)

    const sorted = this._particles.slice().sort((a, b) => a.layer - b.layer)

    for (const p of sorted) {
      ctx.save()
      ctx.globalAlpha = Math.max(0, p.opacity)
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation + Math.sin(this.time * 0.00018 + p.phase) * 0.08)

      const pulse = 1 + Math.sin(this.time * 0.00045 + p.phase) * 0.08
      const layerScale = 1 + p.layer * 0.12
      ctx.scale(pulse * layerScale, (1 / pulse) * (1 + p.layer * 0.06))

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.width * 0.5)
      grad.addColorStop(0, 'rgba(220, 230, 245, 0.78)')
      grad.addColorStop(0.35, 'rgba(195, 210, 230, 0.42)')
      grad.addColorStop(0.68, 'rgba(165, 185, 205, 0.18)')
      grad.addColorStop(1, 'rgba(140, 160, 180, 0)')

      ctx.beginPath()
      ctx.ellipse(0, 0, p.width / 2, p.height / 2, 0, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      ctx.globalAlpha = Math.max(0, p.opacity * 0.55)
      for (let i = 0; i < 3; i++) {
        const offsetPhase = p.phase + i * 2.1
        const ox = Math.sin(this.time * 0.00022 * p.swirl + offsetPhase) * p.width * 0.16
        const oy = Math.cos(this.time * 0.00026 * p.swirl + offsetPhase) * p.height * 0.22
        const innerGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, p.width * (0.18 + i * 0.04))
        innerGrad.addColorStop(0, 'rgba(235, 242, 250, 0.36)')
        innerGrad.addColorStop(0.55, 'rgba(190, 205, 220, 0.12)')
        innerGrad.addColorStop(1, 'rgba(155, 175, 195, 0)')

        ctx.beginPath()
        ctx.ellipse(
          ox,
          oy,
          p.width * (0.18 + i * 0.035),
          p.height * (0.2 + i * 0.04),
          Math.sin(offsetPhase) * 0.45,
          0,
          Math.PI * 2
        )
        ctx.fillStyle = innerGrad
        ctx.fill()
      }

      ctx.restore()
    }
  }

  destroy() {
    this._particles = []
    super.destroy()
  }
}
