export class CloudManager {
  /** @type {CanvasRenderingContext2D} */
  get ctx() {
    const { canvas } = this
    return canvas ? canvas.getContext('2d') : void 0
  }
  setCanvas(canvas) {
    if (!canvas) canvas = document.createElement('canvas')
    this.canvas = canvas;
    return canvas
  }
  render(cloud) {
    const { ctx, clouds, canvas } = this;
    const tem = cloud ? clouds.concat(cloud) : clouds;
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const cloud of tem) {
      cloud.render(ctx);
    }
  }
} 