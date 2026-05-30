import { BaseEffect } from './baseEffect'
import { noise2D } from '../utils/noise'

const MAX_PARTICLES = 18

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
        width: 200 + Math.random() * 400,
        height: 80 + Math.random() * 140,
        baseOpacity: 0.02 + Math.random() * 0.05,
        opacity: 0,
        velocityX: 0.1 + Math.random() * 0.3,
        layer: Math.floor(Math.random() * 3),
        noiseX: Math.random() * 1000,
        noiseY: Math.random() * 1000,
        phase: Math.random() * Math.PI * 2,
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
      p.x += p.velocityX * layerSpeed * dtScale
      p.y += noise2D(p.noiseX + this.time * 0.00008, p.noiseY) * 0.25 * dtScale

      p.opacity = p.baseOpacity + Math.sin(this.time * 0.0004 + p.phase) * 0.015

      if (p.x - p.width / 2 > this.cssWidth) {
        p.x = -p.width / 2
        p.y = Math.random() * this.cssHeight
      }
      if (p.x + p.width / 2 < 0) {
        p.x = this.cssWidth + p.width / 2
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

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.width * 0.5)
      grad.addColorStop(0, 'rgba(200, 210, 230, 0.6)')
      grad.addColorStop(0.4, 'rgba(180, 195, 215, 0.3)')
      grad.addColorStop(0.7, 'rgba(160, 180, 200, 0.1)')
      grad.addColorStop(1, 'rgba(140, 160, 180, 0)')

      ctx.beginPath()
      ctx.ellipse(0, 0, p.width / 2, p.height / 2, 0, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      ctx.restore()
    }
  }

  destroy() {
    this._particles = []
    super.destroy()
  }
}
