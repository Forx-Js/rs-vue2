/**
 * @typedef BoxData
 * @property {number} index 页码
 * @property {string} strText 文本内容
 * @property {number[]} points 矩形坐标数组 
 * @property {number[]} mark 标记点
 * @property {number} color 颜色
 * @property {number} textHeight 字高
 * @property {string} type 云线类型
 * @property {number} lineWidth 线宽
 */

import { partition } from "lodash-es";
import { max, min, zip } from "lodash-es"
// 批注类基类
export class Box {
  type
  /** @type {(data:BoxData)=>BoxData} */
  static data(data = {}) {
    return {
      index: 0,
      strText: '',
      points: [],
      mark: [],
      color: 0xff0000,
      type: '',
      textHeight: 16, // 字高
      lineWidth: 2,
      ...data
    }
  }
  // 页码 - 针对多页面批注
  get index() {
    return this.data.index
  }
  set index(value) {
    this.data.index = ~~value
  }
  constructor(opt) {
    const data = this.constructor.data(opt)
    data.type = this.type
    this.data = data;
  }
  /** @type {BoxData} */
  data = {}
  /** @type {DOMRect} */
  pageRect
  setPageRect() {
    const { pageDom } = this;
    this.pageRect = pageDom ? pageDom.getBoundingClientRect() : void 0;
  }
  /** @type {HTMLDivElement} */
  pageDom
  /**  @param {BoxData} data */
  /** @type {CanvasRenderingContext2D} */
  _ctx;
  /** @type {import('./Manager').Manager } */
  manager
  isHover = false
  visible = true
  render() {
    // 非显示时跳过渲染
    if (!this.visible) return
    const manager = this.manager;
    const ctx = manager.ctx;
    // 获取背景位置信息
    this.setPageRect()
    if (!ctx || !this.pageRect) return;
    this._ctx = ctx;
    ctx.beginPath();
    ctx.save();
    const { color: colorNum, lineWidth } = this.data;
    this.getBoxRect(ctx);
    const path = this.setBoxPath();
    const color = `#${colorNum.toString(16).padStart(6, "0")}`;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    // 绘制框体
    this._renderBox(path);
    // 绘制文本
    this._renderMark(path)
    ctx.restore();
  }
  /** @type {Path2D}  */
  boxPath
  // 计算框体路径信息,供后续绘制使用
  setBoxPath() {
    const path = new Path2D()
    this.boxPath = path;
    return path
  }
  _renderBox(path) {
    const { data: { points } } = this;
    const isSetPoint = !!points.length
    if (!isSetPoint) return
    const ctx = this._ctx;
    ctx.stroke(path);
  }
  // 根据渲染环境,计算坐标
  _transform() {
    return this.manager._transform(this)
  }
  _renderMark() {
    const { data: { mark, strText, textHeight }, boxRect, _ctx: ctx } = this;
    const isSetMark = !!mark.length;
    if (!isSetMark || !strText) return
    ctx.save();
    ctx.font = `bold ${textHeight}px fangsong,'sans-serif'`;
    ctx.textAlign = boxRect.markX >= boxRect.x2 ? "left" : boxRect.markX <= boxRect.x1 ? "right" : 'center';
    ctx.textBaseline = boxRect.markY > boxRect.y2 ? "top" : boxRect.markY < boxRect.y1 ? "bottom" : 'middle';
    ctx.fillText(strText, boxRect.markX, boxRect.markY);
    ctx.restore();
  }
  // 计算框体大小位置数据
  boxRect = {
    width: 0, height: 0, left: 0, top: 0, x1: 0, y1: 0, x2: 0, y2: 0, cx: 0, cy: 0, markX: 0, markY: 0,
    mousePoint: [],
    points: []
  }
  // 获取框体坐标
  getBoxRect() {
    const { points: _points, mark: [mx, my] } = this._transform()
    const pageRect = this.pageRect;
    const canvasRect = this._ctx.canvas.getBoundingClientRect();
    const { width, height } = pageRect;
    const left = pageRect.left - canvasRect.left;
    const top = pageRect.top - canvasRect.top;
    let i = 1;
    const [xRow, yRow] = partition(_points, () => i++ % 2)
    const points_x = xRow.map(v => v * width + left),
      points_y = yRow.map(v => v * height + top);
    const x1 = min(points_x),
      x2 = max(points_x),
      y1 = min(points_y),
      y2 = max(points_y)
    const cx = x1 + ((x2 - x1) >> 1),
      cy = y1 + ((y2 - y1) >> 1);
    const markX = mx * width + left, markY = my * height + top;
    const points = zip(points_x, points_y)
    const rect = { width, height, left, top, points, x1, y1, x2, y2, cx, cy, markX, markY, mousePoint: [] };
    this.boxRect = rect;
    return this.boxRect;
  }
  async create() {
    console.warn("box create is not implemented");
    
  }
}