/**
 * @typedef CloudData
 * @property {number} index 页码
 * @property {string} strText 文本内容
 * @property {[number,number,number,number]} points 矩形坐标数组 
 * @property {[number,number]} mark 标记点
 * @property {number} color 颜色
 * @property {number} textHeight 字高
 * @property {number} type 云线类型，1是矩形云线框，2是矩形
 * @property {number} lineWidth 线宽
 */

export class Cloud {

  /** @type {(data:CloudData)=>CloudData} */
  static data(data = {}) {
    return {
      index: 0,
      strText: '',
      points: [],
      mark: [],
      color: 0xff0000,
      textHeight: 16, // 字高
      type: 1,
      lineWidth: 2,
      ...data
    }
  }
  get index() {
    return this.data.index
  }
  set index(value) {
    this.data.index = ~~value
  }
  /** @type {CloudData} */
  data = {}
  /** @type {DOMRect} */
  #pageRect
  setPageRect() {
    const { pageDom } = this;
    this.#pageRect = pageDom ? pageDom.getBoundingClientRect() : void 0;
  }
  /** @type {HTMLDivElement} */
  pageDom
  /**
   * @param {CloudData} data 
   */
  constructor(data) {
    if (!data) throw new Error('data is required')
    this.data = data
  }
  /** @type {CanvasRenderingContext2D} */
  #ctx;
  /** @param {CanvasRenderingContext2D} ctx */
  render(ctx) {
    this.setPageRect()
    if (!ctx || !this.#pageRect) return;
    this.#ctx = ctx;
    ctx.save();
    const { points, textHeight, strText, color: colorNum, lineWidth, mark } = this.data;
    const isSetPoint = !!points.length
    const isSetMark = !!mark.length;
    if (isSetPoint) {
      this.getBoxRect(ctx);
      const boxRect = this.#boxRect;
      const color = `#${colorNum.toString(16).padStart(6, "0")}`;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      if (isSetMark) {
        ctx.moveTo(boxRect.cx, boxRect.cy);
        ctx.lineTo(boxRect.markX, boxRect.markY);
        ctx.stroke();
        ctx.font = `${textHeight}px Arial`;
      }
      this.#drawBox()
      if (isSetMark) {
        console.log(boxRect.x1, boxRect.markX, boxRect.x2);

        ctx.textAlign = boxRect.markX > boxRect.x2 ? "left" : boxRect.markX < boxRect.x1 ? "right" : 'center';
        ctx.textBaseline = boxRect.markY > boxRect.y2 ? "top" : boxRect.markY < boxRect.y1 ? "bottom" : 'middle';
        ctx.fillText(strText, boxRect.markX, boxRect.markY);
      }
    }
    ctx.restore();
  }
  // 计算框体大小位置数据
  #boxRect = { width: 0, height: 0, left: 0, top: 0, x1: 0, y1: 0, x2: 0, y2: 0, cx: 0, cy: 0, markX: 0, markY: 0 }
  getBoxRect() {
    const { data: { points, mark: [mx, my] } } = this;
    const pageRect = this.#pageRect;
    const canvasRect = this.#ctx.canvas.getBoundingClientRect();
    const { width, height } = pageRect;
    const left = pageRect.left - canvasRect.left;
    const top = pageRect.top - canvasRect.top;
    const [x1, x2] = [points[0], points[2]].sort((a, b) => a - b).map(v => v * width + left);
    const [y1, y2] = [points[1], points[3]].sort((a, b) => a - b).map(v => v * height + top);
    const cx = x1 + ((x2 - x1) >> 1);
    const cy = y1 + ((y2 - y1) >> 1);
    const markX = mx * width + left;
    const markY = my * height + top;
    this.#boxRect = { width, height, left, top, x1, y1, x2, y2, cx, cy, markX, markY };
    return this.#boxRect;
  }
  #drawBox() {
    const { data } = this;
    switch (data.type) {
      case 1:
        this.#drawCloudRect();
        break;
      default:
        this.#drawRect()
        break;
    }
  }
  // 绘制云线框
  #drawCloudRect() {
    const ctx = this.#ctx
    const list = this.#getBoxCell();
    ctx.save();
    for (const ball of list) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r + 2, 0, 2 * Math.PI);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "destination-out";
    for (const ball of list) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.clip();
    ctx.restore();
  }
  // 计算云线波浪线
  #getBoxCell() {
    const { x1, y1, x2, y2 } = this.#boxRect;
    const w = x2 - x1;
    const h = y2 - y1;
    const maxSize = Math.max(w, h);
    const l = Math.max(maxSize / 4, 8);
    const r = l >> 1;
    const axis = [[], []];
    const balls = [];
    let _w = x1 - r,
      _h = y1 - r;
    while (_w < x2) {
      _w += l;
      axis[0].push(_w - r);
    }
    while (_h < y2) {
      _h += l;
      axis[1].push(_h - r);
    }
    for (let i = 0; i < axis[0].length; i++) {
      for (let j = 0; j < axis[1].length; j++) {
        balls.push({ x: axis[0][i], y: axis[1][j], r: l });
      }
    }
    return balls;
  }
  // 绘制矩形框
  #drawRect() {
    const { x1, y1, x2, y2 } = this.#boxRect;
    const ctx = this.#ctx
    ctx.save();
    ctx.beginPath();
    ctx.globalCompositeOperation = "destination-out";
    ctx.rect(x1, y1, x2 - x1, y2 - y1);
    ctx.fill();
    ctx.clip();
    ctx.restore();
    ctx.stroke();
  }
}
