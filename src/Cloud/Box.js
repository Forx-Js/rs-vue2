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

import { chunk, first, flatten, last, max, min, zip } from "lodash-es"

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
  pageRect
  _pdf_viewport = {}
  setPageRect() {
    const { pageDom } = this;
    this.pageRect = pageDom ? pageDom.getBoundingClientRect() : void 0;
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
  /** @type {import('./Manager').CloudManager } */
  manager
  /** @param {import('./Manager').CloudManager } manager */
  render(manager) {
    this.manager = manager;
    const ctx = manager.ctx;
    this.setPageRect()
    if (!ctx || !this.pageRect) return;
    this.#ctx = ctx;
    ctx.beginPath();
    ctx.save();
    const { color: colorNum, lineWidth, } = this.data;
    this.getBoxRect(ctx);
    const color = `#${colorNum.toString(16).padStart(6, "0")}`;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    const path = this.#getBoxPath();
    this.#renderBox(path);
    this.#renderMark(path)
    ctx.restore();
  }
  /** @type {Path2D}  */
  boxPath
  #getBoxPath() {
    const { data: { points, type } } = this;
    const isSetPoint = !!points.length
    const path = new Path2D()
    if (!isSetPoint) return path
    switch (type) {
      case 1:
        this.#drawCloudRect(path);
        break
      case 2:
        this.#drawLine(path);
        break
      case 0: default:
        this.#drawRect(path)
        break
    }
    this.boxPath = path;
    return path
  }
  #renderBox(path) {
    const { data: { points } } = this;
    const isSetPoint = !!points.length
    if (!isSetPoint) return
    const ctx = this.#ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fill(path);
    ctx.restore();
    ctx.stroke(path);
  }
  _transform() {
    return this.manager._transform(this)
  }
  #renderMark(path) {
    const { data: { points, mark, textHeight, strText } } = this;
    const isSetPoint = !!points.length
    const isSetMark = !!mark.length;
    if (!isSetMark || !isSetPoint) return
    const boxRect = this.boxRect;
    const ctx = this.#ctx;
    ctx.font = `${textHeight}px Arial`;
    ctx.textAlign = boxRect.markX > boxRect.x2 ? "left" : boxRect.markX < boxRect.x1 ? "right" : 'center';
    ctx.textBaseline = boxRect.markY > boxRect.y2 ? "top" : boxRect.markY < boxRect.y1 ? "bottom" : 'middle';
    const lPath = new Path2D();
    lPath.addPath(path)
    const [x1, x2] = [boxRect.cx, boxRect.markX].sort((a, b) => a - b);
    const [y1, y2] = [boxRect.cy, boxRect.markY].sort((a, b) => a - b);
    ctx.save();
    // 隐藏中心到标记的线
    const lineWidth = this.data.lineWidth;
    lPath.rect(x1 - lineWidth, y1 - lineWidth, x2 - x1 + lineWidth * 2, y2 - y1 + lineWidth * 2)
    ctx.clip(lPath, 'evenodd')
    ctx.moveTo(boxRect.markX, boxRect.markY);
    if (ctx.isPointInPath(path, boxRect.markX, boxRect.markY)) {
      // 计算延长线
      const dy = boxRect.markY - boxRect.cy;
      const dx = boxRect.markX - boxRect.cx;
      if (Math.abs(dx) < 0.1) {
        const k = dy > 0 ? 1 : -1
        const l = (100 + boxRect.height) * k
        ctx.lineTo(boxRect.cx, boxRect.cy + l);
      } else if (Math.abs(dy) < 0.1) {
        const k = dx > 0 ? 1 : -1
        const l = (100 + boxRect.width) * k
        ctx.lineTo(boxRect.cx + l, boxRect.cy);
      } else {
        const k = dy / dx;
        const d = dx < 0 ? -1 : 1
        const x = boxRect.width * d;
        const y = x * k;
        ctx.lineTo(boxRect.cx + x, boxRect.cy + y);
      }
    } else {
      ctx.lineTo(boxRect.cx, boxRect.cy);
    }
    ctx.stroke();
    ctx.restore()
    ctx.fillText(strText, boxRect.markX, boxRect.markY);
  }
  // 计算框体大小位置数据
  boxRect = {
    width: 0, height: 0, left: 0, top: 0, x1: 0, y1: 0, x2: 0, y2: 0, cx: 0, cy: 0, markX: 0, markY: 0,
    points: []
  }
  getBoxRect() {
    const { points: _points, mark: [mx, my] } = this._transform()
    const pageRect = this.pageRect;
    const canvasRect = this.#ctx.canvas.getBoundingClientRect();
    const { width, height } = pageRect;
    const left = pageRect.left - canvasRect.left;
    const top = pageRect.top - canvasRect.top;
    const [xRow, yRow] = _points.reduce((list, val, index) => {
      list[index % 2].push(val);
      return list;
    }, [[], []])
    const points_x = xRow.map(v => v * width + left),
      points_y = yRow.map(v => v * height + top);
    const x1 = min(points_x),
      x2 = max(points_x),
      y1 = min(points_y),
      y2 = max(points_y)
    const cx = x1 + ((x2 - x1) >> 1),
      cy = y1 + ((y2 - y1) >> 1);
    const markX = mx * width + left, markY = my * height + top;
    const points = flatten(zip(points_x, points_y))
    const rect = { width, height, left, top, points, x1, y1, x2, y2, cx, cy, markX, markY, };
    this.boxRect = rect;
    return this.boxRect;
  }
  // 绘制云线框
  /**  @param {Path2D} path  */
  #drawCloudRect(path) {
    const list = this.#getBoxCell();
    for (let i = 0; i < list.length; i++) {
      const { x, y, r, s, e } = list[i];
      path.arc(x, y, r, s, e);
    }
    return path
  }
  // 计算云线波浪线
  #getBoxCell() {
    const { x1, y1, x2, y2 } = this.boxRect;
    const w = x2 - x1;
    const h = y2 - y1;
    const maxSize = Math.max(w, h);
    const r = Math.max(maxSize >> 3, 10)
    const l = r * Math.SQRT2;
    const axis = [[], []];
    const balls = [];
    let _w = x1,
      _h = y1;
    while (_w < x2) {
      _w += l;
      axis[0].push(_w - r);
    }
    while (_h < y2) {
      _h += l;
      axis[1].push(_h - r);
    }
    const rad = Math.PI / 4
    balls.push(
      ...axis[0].map((x) => ({ x, y: first(axis[1]), r, s: 5 * rad, e: 7 * rad })),
      ...axis[1].map((y) => ({ x: last(axis[0]), y, r, s: -rad, e: rad })),
      ...axis[0].map((x) => ({ x, y: last(axis[1]), r, s: rad, e: rad * 3 })).reverse(),
      ...axis[1].map((y) => ({ x: first(axis[0]), y, r, s: rad * 3, e: rad * 5 })).reverse(),
    );
    return balls;
  }
  /**  @param {Path2D} path  */
  #drawLine(path) {
    const { points } = this.boxRect;
    path.moveTo(points[0], points[1])
    for (const [x, y] of chunk(points, 2)) {
      path.lineTo(x, y)
    }
  }
  // 绘制矩形框
  #drawRect(path) {
    const { x1, y1, x2, y2 } = this.boxRect;
    path.rect(x1, y1, x2 - x1, y2 - y1);
  }
}