import { BaseEffect } from './baseEffect'
import { noise2D } from '../utils/noise'
import { ObjectPool } from '../utils/pool'

const MAX_FLAKES = 200

function createFlake() {
  return {
    x: 0, y: 0,
    radius: 1,
    velocityY: 0,
    lateralPhase: 0,
    lateralAmp: 0,
    lateralFreq: 0,
    rotation: 0,
    rotationSpeed: 0,
    opacity: 0,
    depth: 0,
  }
}

function resetFlake(f) {
  f.x = 0; f.y = 0
  f.radius = 1
  f.velocityY = 0
  f.lateralPhase = 0; f.lateralAmp = 0; f.lateralFreq = 0
  f.rotation = 0; f.rotationSpeed = 0
  f.opacity = 0; f.depth = 0
}

export class SnowEffect extends BaseEffect {
  constructor(canvas, ctx, options) {
    super(canvas, ctx, options)
    this._pool = new ObjectPool(createFlake, resetFlake, MAX_FLAKES)
    this._flakes = []
    this._offCanvas = null
    this._offCtx = null
    this._initFlakes()
    this._buildShapes()
  }

  _buildShapes() {
    this._offCanvas = document.createElement('canvas')
    this._offCanvas.width = 64
    this._offCanvas.height = 64
    this._offCtx = this._offCanvas.getContext('2d')
    const ctx = this._offCtx
    ctx.clearRect(0, 0, 64, 64)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.lineWidth = 1.2
    ctx.lineCap = 'round'
    const cx = 32, cy = 32, len = 12
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i
      const ex = cx + Math.cos(angle) * len
      const ey = cy + Math.sin(angle) * len
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(ex, ey)
      ctx.stroke()
      const branchLen = len * 0.4
      for (const bf of [0.45, 0.7]) {
        const bx = cx + Math.cos(angle) * len * bf
        const by = cy + Math.sin(angle) * len * bf
        for (const side of [-1, 1]) {
          const ba = angle + side * 0.6
          ctx.beginPath()
          ctx.moveTo(bx, by)
          ctx.lineTo(bx + Math.cos(ba) * branchLen, by + Math.sin(ba) * branchLen)
          ctx.stroke()
        }
      }
    }
  }

  _initFlakes() {
    for (let i = 0; i < MAX_FLAKES; i++) {
      const f = this._pool.acquire()
      this._setupFlake(f, true)
      this._flakes.push(f)
    }
  }

  _setupFlake(f, randomY = false) {
    f.depth = Math.random()
    f.radius = 1.5 + f.depth * 3
    f.x = Math.random() * this.cssWidth
    f.y = randomY ? Math.random() * this.cssHeight : -f.radius * 2
    f.velocityY = 0.3 + f.depth * 0.9
    f.lateralPhase = Math.random() * Math.PI * 2
    f.lateralAmp = 15 + Math.random() * 25
    f.lateralFreq = 0.001 + Math.random() * 0.002
    f.rotation = Math.random() * Math.PI * 2
    f.rotationSpeed = (Math.random() - 0.5) * 0.03
    f.opacity = 0.3 + f.depth * 0.55
  }

  resize(w, h) {
    super.resize(w, h)
  }

  update(dt) {
    const dtScale = dt / 16.67
    for (const f of this._flakes) {
      f.y += f.velocityY * dtScale
      f.x += Math.sin(this.time * f.lateralFreq + f.lateralPhase) * f.lateralAmp * 0.008 * dtScale
      f.x += noise2D(f.x * 0.003, this.time * 0.0002) * 0.3 * dtScale
      f.rotation += f.rotationSpeed * dtScale

      if (f.y > this.cssHeight + 10) {
        this._setupFlake(f, false)
      }
      if (f.x < -20) f.x = this.cssWidth + 10
      if (f.x > this.cssWidth + 20) f.x = -10
    }
  }

  render() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.cssWidth, this.cssHeight)

    const sorted = this._flakes.slice().sort((a, b) => a.depth - b.depth)

    for (const f of sorted) {
      ctx.save()
      ctx.translate(f.x, f.y)
      ctx.rotate(f.rotation)
      ctx.globalAlpha = f.opacity

      const scale = f.radius / 14
      ctx.scale(scale, scale)
      ctx.drawImage(this._offCanvas, -32, -32)

      ctx.restore()
    }
  }

  destroy() {
    for (const f of this._flakes) this._pool.release(f)
    this._flakes = []
    this._offCanvas = null
    this._offCtx = null
    this._pool.clear()
    super.destroy()
  }
}
