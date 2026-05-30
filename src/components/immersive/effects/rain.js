import { BaseEffect } from './baseEffect'
import { ObjectPool } from '../utils/pool'
import { noise2D } from '../utils/noise'

const TRAIL_MAX = 100

function createDrop() {
  return {
    x: 0, y: 0,
    radius: 1,
    velocityX: 0, velocityY: 0,
    moving: false,
    trail: new Float32Array(TRAIL_MAX * 2),
    trailLen: 0,
    trailIdx: 0,
    life: 0,
    opacity: 0,
    stuck: false,
    stuckTimer: 0,
    mass: 1,
    wobblePhase: 0,
    growRate: 0,
    lastTrailDist: 0,
    splatPhase: 0,
    splatting: false,
    irregularity: 0,
  }
}

function resetDrop(d) {
  d.x = 0; d.y = 0
  d.radius = 1
  d.velocityX = 0; d.velocityY = 0
  d.moving = false
  d.trailLen = 0; d.trailIdx = 0
  d.life = 0; d.opacity = 1
  d.stuck = false; d.stuckTimer = 0
  d.mass = 1
  d.wobblePhase = Math.random() * Math.PI * 2
  d.growRate = 0
  d.lastTrailDist = 0
  d.splatPhase = 0
  d.splatting = false
  d.irregularity = Math.random() * 0.3
}

export class RainEffect extends BaseEffect {
  constructor(canvas, ctx, options) {
    super(canvas, ctx, options)
    this._pool = new ObjectPool(createDrop, resetDrop, 520)
    this._drops = []
    this._streaks = []
    this._splats = []
    this._fogCanvas = null
    this._fogCtx = null
    this._frameCount = 0
    this._spawnAcc = 0
    this._streakAcc = 0
    this._buildFog()
    this._initDrops()
  }

  _buildFog() {
    const w = Math.ceil(this.cssWidth)
    const h = Math.ceil(this.cssHeight)
    if (w <= 0 || h <= 0) return
    this._fogCanvas = document.createElement('canvas')
    this._fogCanvas.width = w
    this._fogCanvas.height = h
    this._fogCtx = this._fogCanvas.getContext('2d')
    this._paintFog()
  }

  _paintFog() {
    if (!this._fogCtx) return
    const ctx = this._fogCtx
    const w = this._fogCanvas.width
    const h = this._fogCanvas.height
    ctx.clearRect(0, 0, w, h)

    ctx.fillStyle = 'rgba(140, 160, 180, 0.08)'
    ctx.fillRect(0, 0, w, h)

    const step = 4
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const n1 = noise2D(x * 0.01, y * 0.01)
        const n2 = noise2D(x * 0.025 + 400, y * 0.025 + 400)
        const combined = n1 * 0.6 + n2 * 0.4
        const alpha = Math.pow((combined + 1) * 0.5, 2) * 0.13
        if (alpha > 0.015) {
          ctx.fillStyle = `rgba(160, 178, 195, ${alpha})`
          ctx.fillRect(x, y, step, step)
        }
      }
    }
  }

  _initDrops() {
    for (let i = 0; i < 230; i++) {
      const d = this._pool.acquire()
      d.x = Math.random() * this.cssWidth
      d.y = Math.random() * this.cssHeight
      d.radius = 0.7 + Math.random() * 2.1
      d.moving = false
      d.opacity = 0.45 + Math.random() * 0.45
      this._drops.push(d)
    }

    for (let i = 0; i < 42; i++) {
      const d = this._pool.acquire()
      d.x = Math.random() * this.cssWidth
      d.y = Math.random() * this.cssHeight
      d.radius = 3 + Math.random() * 5.5
      d.moving = false
      d.opacity = 0.75 + Math.random() * 0.2
      d.growRate = 0.003 + Math.random() * 0.005
      this._drops.push(d)
    }
  }

  _spawnImpact() {
    const d = this._pool.acquire()
    d.x = Math.random() * this.cssWidth
    d.y = Math.random() * this.cssHeight * 0.85 + this.cssHeight * 0.05
    d.radius = 1.8 + Math.random() * 4.2
    d.moving = false
    d.opacity = 0.9
    d.splatting = true
    d.splatPhase = 0
    d.growRate = 0.003 + Math.random() * 0.006
    this._drops.push(d)

    this._splats.push({
      x: d.x, y: d.y,
      radius: d.radius,
      phase: 0,
      maxPhase: 12 + Math.random() * 8,
    })
  }

  resize(w, h) {
    super.resize(w, h)
    this._buildFog()
  }

  update(dt) {
    this._frameCount++
    const dtScale = dt / 16.67

    this._streakAcc += dt
    if (this._streakAcc > 18) {
      this._streakAcc = 0
      if (this._streaks.length < 58) {
        const count = 2 + Math.floor(Math.random() * 4)
        for (let i = 0; i < count; i++) {
          this._streaks.push({
            x: Math.random() * this.cssWidth,
            y: -30 - Math.random() * 60,
            length: 45 + Math.random() * 70,
            speed: 24 + Math.random() * 20,
            opacity: 0.1 + Math.random() * 0.14,
            angle: 0.08 + Math.random() * 0.15,
            width: 0.6 + Math.random() * 0.8,
          })
        }
      }
    }

    for (let i = this._streaks.length - 1; i >= 0; i--) {
      const s = this._streaks[i]
      s.y += s.speed * dtScale
      s.x += s.angle * s.speed * 0.3 * dtScale
      if (s.y > this.cssHeight + 20) {
        this._streaks.splice(i, 1)
      }
    }

    this._spawnAcc += dt
    if (this._spawnAcc > 135) {
      this._spawnAcc = 0
      const r = Math.random()
      if (r < 0.85) this._spawnImpact()
      if (r < 0.55) this._spawnImpact()
      if (r < 0.18) this._spawnImpact()
    }

    for (let i = this._splats.length - 1; i >= 0; i--) {
      const sp = this._splats[i]
      sp.phase += dtScale
      if (sp.phase > sp.maxPhase) {
        this._splats.splice(i, 1)
      }
    }

    for (let i = this._drops.length - 1; i >= 0; i--) {
      const d = this._drops[i]
      d.life += dtScale

      if (d.splatting) {
        d.splatPhase += dtScale
        if (d.splatPhase > 10) d.splatting = false
      }

      if (d.growRate > 0 && !d.moving) {
        d.radius += d.growRate * dtScale
        if (d.radius > 6.2 + Math.random() * 3.5) {
          d.moving = true
          d.velocityY = 0.18 + d.radius * 0.018
          d.growRate = 0
        }
      }

      if (!d.moving) continue

      d.wobblePhase += 0.04 * dtScale
      const gravity = 0.022 * (d.mass / 4)
      d.velocityY += gravity * dtScale

      if (!d.stuck) {
        const stickProb = 0.005 / (d.radius * 0.5)
        if (Math.random() < stickProb * dtScale) {
          d.stuck = true
          d.stuckTimer = 18 + Math.random() * 80
        }
      }

      if (d.stuck) {
        d.stuckTimer -= dtScale
        d.velocityY *= 0.88
        if (d.stuckTimer <= 0) {
          d.stuck = false
          d.velocityY = 0.2 + d.radius * 0.04
        }
      } else {
        const windX = noise2D(d.y * 0.008, this.time * 0.00012) * 0.006
        d.velocityX += windX * dtScale
        d.velocityX += Math.sin(d.wobblePhase) * 0.003 * dtScale
        d.velocityX *= 0.97
        d.x += d.velocityX * dtScale
        d.y += d.velocityY * dtScale
      }

      d.velocityY = Math.min(d.velocityY, 3.5 + d.radius * 0.32)

      if (!d.stuck && d.velocityY > 0.08) {
        d.lastTrailDist += d.velocityY * dtScale
        if (d.lastTrailDist >= 2.1) {
          const idx = (d.trailIdx % TRAIL_MAX) * 2
          d.trail[idx] = d.x
          d.trail[idx + 1] = d.y
          d.trailIdx++
          d.trailLen = Math.min(d.trailLen + 1, TRAIL_MAX)
          d.lastTrailDist = 0
        }
      }

      if (d.y > this.cssHeight + 20) {
        this._drops.splice(i, 1)
        this._pool.release(d)
        continue
      }

      this._checkAbsorb(d, i)
    }
  }

  _checkAbsorb(d, idx) {
    if (!d.moving) return
    for (let j = this._drops.length - 1; j >= 0; j--) {
      if (j === idx) continue
      const other = this._drops[j]
      if (other.moving && other.radius >= d.radius) continue
      const dx = d.x - other.x
      const dy = d.y - other.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const touchDist = d.radius + other.radius * 0.6
      if (dist < touchDist) {
        d.radius = Math.min(13, Math.sqrt(d.radius * d.radius + other.radius * other.radius * 0.5))
        d.mass = d.radius * 1.3
        d.velocityY += 0.06
        this._drops.splice(j, 1)
        this._pool.release(other)
        if (j < idx) idx--
      }
    }
  }

  render() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.cssWidth, this.cssHeight)

    this._renderStreaks(ctx)

    if (this._fogCanvas) {
      ctx.drawImage(this._fogCanvas, 0, 0)
    }

    this._clearTrails(ctx)
    this._renderDrops(ctx)
    this._renderSplats(ctx)
  }

  _renderStreaks(ctx) {
    ctx.save()
    ctx.lineCap = 'round'
    for (const s of this._streaks) {
      const dx = Math.sin(s.angle) * s.length
      const dy = Math.cos(s.angle) * s.length
      ctx.beginPath()
      ctx.moveTo(s.x, s.y)
      ctx.lineTo(s.x - dx * 0.3, s.y - dy)
      ctx.strokeStyle = `rgba(180, 200, 220, ${s.opacity})`
      ctx.lineWidth = s.width
      ctx.stroke()
    }
    ctx.restore()
  }

  _clearTrails(ctx) {
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    for (const d of this._drops) {
      if (d.trailLen < 2) continue
      const trailW = d.radius * 0.75

      ctx.beginPath()
      ctx.lineWidth = trailW
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const start = Math.max(0, d.trailIdx - d.trailLen)
      let started = false
      for (let t = start; t < d.trailIdx; t++) {
        const ri = (t % TRAIL_MAX) * 2
        const px = d.trail[ri]
        const py = d.trail[ri + 1]
        if (!started) { ctx.moveTo(px, py); started = true }
        else ctx.lineTo(px, py)
      }
      if (started) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)'
        ctx.stroke()
      }
    }
    ctx.restore()

    ctx.save()
    for (const d of this._drops) {
      if (d.trailLen < 2) continue
      const trailW = d.radius * 0.3
      const start = Math.max(0, d.trailIdx - d.trailLen)
      ctx.beginPath()
      ctx.lineWidth = trailW
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      let started = false
      for (let t = start; t < d.trailIdx; t++) {
        const ri = (t % TRAIL_MAX) * 2
        const px = d.trail[ri]
        const py = d.trail[ri + 1]
        if (!started) { ctx.moveTo(px, py); started = true }
        else ctx.lineTo(px, py)
      }
      if (started) {
        ctx.strokeStyle = 'rgba(190, 210, 230, 0.05)'
        ctx.stroke()
      }
    }
    ctx.restore()
  }

  _renderSplats(ctx) {
    for (const sp of this._splats) {
      const progress = sp.phase / sp.maxPhase
      if (progress >= 1) continue
      const expand = 1 + progress * 2.5
      const alpha = (1 - progress) * 0.3
      ctx.beginPath()
      ctx.arc(sp.x, sp.y, sp.radius * expand, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(200, 220, 240, ${alpha})`
      ctx.lineWidth = 0.8 * (1 - progress)
      ctx.stroke()

      if (progress < 0.4) {
        const dotCount = 4 + Math.floor(sp.radius)
        const dotAlpha = (0.4 - progress) * 0.6
        for (let i = 0; i < dotCount; i++) {
          const angle = (Math.PI * 2 / dotCount) * i + sp.phase * 0.1
          const dist = sp.radius * expand * (0.8 + Math.random() * 0.4)
          const dx = Math.cos(angle) * dist
          const dy = Math.sin(angle) * dist
          ctx.beginPath()
          ctx.arc(sp.x + dx, sp.y + dy, 0.6 + Math.random() * 0.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(210, 225, 240, ${dotAlpha})`
          ctx.fill()
        }
      }
    }
  }

  _renderDrops(ctx) {
    for (const d of this._drops) {
      if (d.radius < 2) {
        this._drawTinyDrop(ctx, d)
      } else {
        this._drawDrop(ctx, d)
      }
    }
  }

  _drawTinyDrop(ctx, d) {
    const r = d.radius

    ctx.beginPath()
    ctx.arc(d.x, d.y, r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(210, 225, 240, ${0.35 * d.opacity})`
    ctx.lineWidth = 0.4
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(d.x - r * 0.3, d.y - r * 0.3, r * 0.25, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${0.45 * d.opacity})`
    ctx.fill()
  }

  _drawDrop(ctx, d) {
    const r = d.radius
    const speed = Math.abs(d.velocityY)
    const isFlowing = d.moving && speed > 0.6

    ctx.save()
    ctx.translate(d.x, d.y)

    if (isFlowing && r > 4) {
      this._drawFlowingShape(ctx, r, speed, d)
    } else {
      this._drawStaticShape(ctx, r, d)
    }

    ctx.restore()
  }

  _drawStaticShape(ctx, r, d) {
    const opacity = d.opacity
    const irr = d.irregularity
    const sag = Math.min(0.22, r * 0.018)
    const yScale = 1 + sag
    const xScale = 1 - sag * 0.35

    ctx.beginPath()
    const segments = 14
    for (let i = 0; i <= segments; i++) {
      const angle = (Math.PI * 2 / segments) * i
      const bottomWeight = Math.max(0, Math.sin(angle))
      const rVar = r * (
        1
        + Math.sin(angle * 3 + irr * 10) * irr * 0.28
        + Math.cos(angle * 5 + irr * 7) * irr * 0.12
        + bottomWeight * sag * 0.65
      )
      const px = Math.cos(angle) * rVar * xScale
      const py = Math.sin(angle) * rVar * yScale + bottomWeight * r * sag * 0.5
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()

    ctx.fillStyle = `rgba(0, 0, 0, ${0.018 * opacity})`
    ctx.fill()

    ctx.strokeStyle = `rgba(210, 228, 245, ${0.55 * opacity})`
    ctx.lineWidth = 0.65 + r * 0.045
    ctx.stroke()

    const innerGrad = ctx.createRadialGradient(-r * 0.15, -r * 0.2, r * 0.15, 0, r * 0.15, r * 1.08)
    innerGrad.addColorStop(0, `rgba(255, 255, 255, ${0.055 * opacity})`)
    innerGrad.addColorStop(0.52, `rgba(150, 178, 205, ${0.045 * opacity})`)
    innerGrad.addColorStop(1, `rgba(40, 60, 80, ${0.09 * opacity})`)
    ctx.fillStyle = innerGrad
    ctx.fill()

    ctx.beginPath()
    ctx.ellipse(0, r * (0.42 + sag), r * 0.56, r * 0.16, 0, 0, Math.PI * 2)
    const baseGrad = ctx.createRadialGradient(0, r * 0.42, 0, 0, r * 0.42, r * 0.7)
    baseGrad.addColorStop(0, `rgba(35, 45, 55, ${0.12 * opacity})`)
    baseGrad.addColorStop(1, 'rgba(35, 45, 55, 0)')
    ctx.fillStyle = baseGrad
    ctx.fill()

    ctx.beginPath()
    ctx.arc(r * 0.38, -r * 0.16, r * 0.42, -Math.PI * 0.58, Math.PI * 0.3)
    ctx.strokeStyle = `rgba(235, 247, 255, ${0.16 * opacity})`
    ctx.lineWidth = Math.max(0.45, r * 0.08)
    ctx.lineCap = 'round'
    ctx.stroke()

    const hlX = -r * 0.3
    const hlY = -r * 0.34
    const hlR = r * 0.24
    ctx.beginPath()
    ctx.ellipse(hlX, hlY, hlR * 0.85, hlR * 0.55, -0.45, 0, Math.PI * 2)
    const hlGrad = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, hlR)
    hlGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * opacity})`)
    hlGrad.addColorStop(0.45, `rgba(255, 255, 255, ${0.32 * opacity})`)
    hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = hlGrad
    ctx.fill()

    ctx.beginPath()
    ctx.arc(hlX + hlR * 0.2, hlY + hlR * 0.2, hlR * 0.22, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * opacity})`
    ctx.fill()

    if (r > 4) {
      ctx.beginPath()
      ctx.arc(-r * 0.05, -r * 0.08, r * 0.72, Math.PI * 0.95, Math.PI * 1.35)
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 * opacity})`
      ctx.lineWidth = Math.max(0.4, r * 0.045)
      ctx.lineCap = 'round'
      ctx.stroke()
    }

    if (d.splatting) {
      const splatAlpha = Math.max(0, 1 - d.splatPhase / 10) * 0.25
      ctx.beginPath()
      ctx.arc(0, 0, r * (1 + d.splatPhase * 0.15), 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(200, 218, 235, ${splatAlpha})`
      ctx.lineWidth = 0.5
      ctx.stroke()
    }
  }

  _drawFlowingShape(ctx, r, speed, d) {
    const opacity = d.opacity
    const stretch = 1 + Math.min(speed * 0.22, 1.15)
    const w = r * (1 / Math.sqrt(stretch))
    const h = r * stretch
    const lean = Math.sin(d.wobblePhase) * w * 0.16

    ctx.beginPath()
    ctx.moveTo(lean, -h * 0.68)
    ctx.bezierCurveTo(w * 0.38 + lean, -h * 0.6, w * 0.9 + lean, -h * 0.2, w * 0.82, h * 0.12)
    ctx.bezierCurveTo(w * 0.75, h * 0.48, w * 0.42, h * 0.82, 0, h * 0.9)
    ctx.bezierCurveTo(-w * 0.46, h * 0.82, -w * 0.78, h * 0.48, -w * 0.82, h * 0.1)
    ctx.bezierCurveTo(-w * 0.9 + lean, -h * 0.2, -w * 0.35 + lean, -h * 0.62, lean, -h * 0.68)
    ctx.closePath()

    ctx.fillStyle = `rgba(0, 0, 0, ${0.018 * opacity})`
    ctx.fill()

    ctx.strokeStyle = `rgba(210, 228, 245, ${0.58 * opacity})`
    ctx.lineWidth = 0.75 + r * 0.04
    ctx.stroke()

    const innerGrad = ctx.createRadialGradient(
      -w * 0.1, -h * 0.05, 0,
      0, h * 0.1, Math.max(w, h) * 0.85
    )
    innerGrad.addColorStop(0, `rgba(255, 255, 255, ${0.05 * opacity})`)
    innerGrad.addColorStop(0.55, `rgba(145, 172, 198, ${0.055 * opacity})`)
    innerGrad.addColorStop(1, `rgba(35, 50, 65, ${0.09 * opacity})`)
    ctx.fillStyle = innerGrad
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(-w * 0.42, -h * 0.25)
    ctx.bezierCurveTo(-w * 0.65, h * 0.12, -w * 0.38, h * 0.42, -w * 0.12, h * 0.72)
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * opacity})`
    ctx.lineWidth = Math.max(0.35, w * 0.08)
    ctx.lineCap = 'round'
    ctx.stroke()

    const hlX = -w * 0.28
    const hlY = -h * 0.3
    const hlR = r * 0.2
    ctx.beginPath()
    ctx.arc(hlX, hlY, hlR, 0, Math.PI * 2)
    const hlGrad = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, hlR)
    hlGrad.addColorStop(0, `rgba(255, 255, 255, ${0.85 * opacity})`)
    hlGrad.addColorStop(0.4, `rgba(255, 255, 255, ${0.3 * opacity})`)
    hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = hlGrad
    ctx.fill()

    ctx.beginPath()
    ctx.arc(hlX + hlR * 0.15, hlY + hlR * 0.15, hlR * 0.2, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${0.92 * opacity})`
    ctx.fill()

    if (speed > 1.2) {
      ctx.beginPath()
      ctx.moveTo(0, h * 0.85)
      ctx.quadraticCurveTo(w * 0.12, h * 1.02, -w * 0.05, h * 1.18)
      ctx.strokeStyle = `rgba(205, 225, 242, ${0.24 * opacity})`
      ctx.lineWidth = Math.max(0.55, w * 0.18)
      ctx.lineCap = 'round'
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(w * 0.18, h * 0.76)
      ctx.quadraticCurveTo(w * 0.32, h * 0.96, w * 0.08, h * 1.08)
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 * opacity})`
      ctx.lineWidth = Math.max(0.35, w * 0.08)
      ctx.stroke()
    }
  }

  destroy() {
    for (const d of this._drops) this._pool.release(d)
    this._drops = []
    this._streaks = []
    this._splats = []
    this._pool.clear()
    this._fogCanvas = null
    this._fogCtx = null
    super.destroy()
  }
}
