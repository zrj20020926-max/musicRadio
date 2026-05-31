export class BaseEffect {
  constructor(canvas, ctx, options = {}) {
    this.canvas = canvas
    this.ctx = ctx
    this.dpr = options.dpr || Math.min(window.devicePixelRatio || 1, 2)
    this.width = canvas.width
    this.height = canvas.height
    this.cssWidth = this.width / this.dpr
    this.cssHeight = this.height / this.dpr
    this.time = 0
    this.isActive = true
    this.particles = []
  }

  resize(width, height) {
    this.cssWidth = width
    this.cssHeight = height
    this.width = width * this.dpr
    this.height = height * this.dpr
  }

  update(dt) {}

  render() {}

  tick(dt) {
    if (!this.isActive) return
    this.time += dt
    this.update(dt)
    this.render()
  }

  destroy() {
    this.isActive = false
    this.particles = []
    this.canvas = null
    this.ctx = null
  }
}
