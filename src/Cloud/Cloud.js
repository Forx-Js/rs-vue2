import { first, last } from "lodash-es";
import { Utils } from "./utils";
import { Box } from "./Box";
export class CloudBox extends Box {
  type = Utils.BoxTypeEnum.cloud;
  // 计算云线波浪线
  #getBoxCell() {
    const { x1, y1, x2, y2 } = this.boxRect;
    const r = 10;
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
  setBoxPath() {
    const path = new Path2D()
    const { boxRect: { points } } = this;
    if (!points.length) return path
    const list = this.#getBoxCell();
    for (let i = 0; i < list.length; i++) {
      const { x, y, r, s, e } = list[i];
      path.arc(x, y, r, s, e);
    }
    this.boxPath = path;
    return path
  }
  create = Utils.dblPointHandler
}
export class CloudMark extends CloudBox {
  type = Utils.BoxTypeEnum.cloudMark;
  /** @param {Path2D} path  */
  _renderBox(path) {
    const { data: { points }, _ctx: ctx } = this;
    const isSetPoint = !!points.length
    if (!isSetPoint) return
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fill(path);
    ctx.restore();
    this.#renderMarkLine(path)
    ctx.stroke(path);
  }
  /** @param {Path2D} path  */
  #renderMarkLine(path) {
    const { boxRect, _ctx: ctx } = this;
    const lPath = new Path2D();
    lPath.addPath(path);
    const [x1, x2] = [boxRect.cx, boxRect.markX].sort((a, b) => a - b);
    const [y1, y2] = [boxRect.cy, boxRect.markY].sort((a, b) => a - b);
    ctx.save();
    // 隐藏中心到标记的线
    const lineWidth = this.data.lineWidth;
    lPath.rect(x1 - lineWidth, y1 - lineWidth, x2 - x1 + lineWidth * 2, y2 - y1 + lineWidth * 2)
    ctx.clip(lPath, 'evenodd')
    ctx.beginPath();
    ctx.moveTo(boxRect.markX, boxRect.markY);
    if (ctx.isPointInPath(path, boxRect.markX, boxRect.markY)) {
      const dy = boxRect.markY - boxRect.cy;
      const dx = boxRect.markX - boxRect.cx;
      const angle = Math.atan2(dy, dx);
      const radius = (boxRect.width ** 2 + boxRect.height ** 2) ** .5 / 2;
      ctx.arc(boxRect.cx, boxRect.cy, radius, angle, angle, true)
    } else {
      ctx.lineTo(boxRect.cx, boxRect.cy);
    }
    ctx.stroke();
    ctx.restore()
  }
  /**
  * @param {(type:string,time:number)=>Promise} handler 
  */
  create = async (handler = () => { }) => {
    const { manager, data } = this
    const pages = manager.getAllPage();
    let e, x, y;
    await handler(Utils.EventTypeEnum.POINT, 0);
    e = await manager._events.update(pages, 'pointerdown')
    const { el, index, point } = manager.getEventData(e)
    this.pageDom = el;
    this.index = index;
    [x, y] = point;
    data.points[0] = x;
    data.points[1] = y;
    const updatePoint = (e) => {
      const { point: [x, y] } = manager.getEventData(e)
      data.points[2] = x;
      data.points[3] = y;
      manager.renderView();
    }
    await handler(Utils.EventTypeEnum.POINT, 1);
    e = await manager._events.update(el, 'pointerup', { pointermove: updatePoint })
    const updateMark = (e) => {
      const { point: [x, y] } = manager.getEventData(e)
      data.mark[0] = x;
      data.mark[1] = y;
      manager.renderView();
    }
    await handler(Utils.EventTypeEnum.MARK, 0);
    e = await manager._events.update(el, 'pointerup', { pointermove: updateMark });
    await handler(Utils.EventTypeEnum.DONE, 0);
  }
}