import { add, clamp, last, range } from "lodash-es";
import { Utils } from "./utils";
import { Box } from "./Box";
export class CloudBox extends Box {
  type = Utils.BoxTypeEnum.cloud;
  // 计算波浪线的位置
  #getBoxCell() {
    const { boxRect } = this;
    const maxSize = Math.min(boxRect.x2 - boxRect.x1, boxRect.y2 - boxRect.y1);
    const r = clamp(maxSize, 6, 14);
    const x1 = boxRect.x1 + r,
      y1 = boxRect.y1 + r,
      x2 = boxRect.x2,
      y2 = boxRect.y2
    const width = x2 - x1;
    const height = y2 - y1;
    const K = 1.5;
    const xNum = Math.max(Math.ceil(width / r / K), 1);
    const yNum = Math.max(Math.ceil(height / r / K), 1);
    const gap_x = width / xNum;
    const gap_y = height / yNum;
    const axis = [
      Array.from({ length: xNum }, (_, i) => i * gap_x + x1),
      Array.from({ length: yNum }, (_, i) => i * gap_y + y1),
    ];
    const balls = [];
    const rad_x = Math.acos(gap_x / 2 / r)
    const rad_y = Math.asin(gap_y / 2 / r)
    balls.push(
      axis[0].map((x) => ({ x, y: axis[1][0], r, start: Math.PI + rad_x, end: 2 * Math.PI - rad_x })),
      axis[1].map((y) => ({ x: axis[0].at(-1), y, r, start: -rad_y, end: rad_y })),
      axis[0].map((x) => ({ x, y: axis[1].at(-1), r, start: rad_x, end: Math.PI - rad_x })).reverse(),
      axis[1].map((y) => ({ x: axis[0][0], y, r, start: Math.PI - rad_y, end: Math.PI + rad_y })).reverse(),
    );
    balls[0][0].start = balls[3].at(-1).end
    balls[1][0].start = balls[0].at(-1).end
    balls[2][0].start = balls[1].at(-1).end
    balls[3][0].start = balls[2].at(-1).end
    const list = [];
    for (let i = 0; i < balls.length; i++) {
      const row = balls[i];
      for (let j = 0; j < row.length; j++) {
        const ball = row[j];
        if (!j) {
          const before = last(list)
          if (before) { before.end = ball.end; continue; }
        }
        list.push(ball)
      }
    }
    if (list.length > 1) {
      const last = list.pop()
      list[0].start = last.start
    } else {
      list[0].end = list[0].end + Math.PI * 2
    }
    return list
  }
  setBoxPath() {
    const path = new Path2D()
    const { boxRect: { points, markX, markY } } = this;
    if (!points.length) return path;
    const list = this.#getBoxCell();
    for (let i = 0; i < list.length; i++) {
      const { x, y, r, start, end } = list[i];
      path.arc(x, y, r, start, end);
    }
    path.closePath();
    if (this.data.mark.length) {
      const inBox = this._ctx.isPointInPath(path, markX, markY)
      const path2 = new Path2D();
      const rand = { index: -1, diff: 0 }
      const balls = list
      for (let i = 0; i < balls.length; i++) {
        const { x, y } = list[i];
        const diff = add(Math.abs(x - markX), Math.abs(y - markY));
        if (i === 0 || diff < rand.diff) {
          rand.index = i;
          rand.diff = diff;
        }
      }
      const { x, y, r, } = balls[rand.index]
      const mRad = Math.atan2(markY - y, markX - x);
      const a_rad = inBox ? (mRad + Math.PI) : mRad;
      path2.arc(x, y, r, a_rad, a_rad);
      path2.lineTo(markX, markY)
      path.addPath(path2);
    }
    this.boxPath = path;
    return path
  }
  create = Utils.dblPointHandler
}
// 将弧度值归一化到 [0, 2π) 范围内
function normalizeRadians(radian) {
  return ((radian % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
}
// 判断角度是否在范围内
function isBetweenRadians(rad, start, end) {
  start = normalizeRadians(start);
  end = normalizeRadians(end);
  rad = normalizeRadians(rad);
  if (start <= end) {
    return rad >= start && rad <= end;
  } else {
    return rad >= start || rad <= end;
  }
}
export class CloudMark extends CloudBox {
  type = Utils.BoxTypeEnum.cloudMark;
  /** @param {(type:string,box:Box,time:number)=>Promise} handler */
  create = async (handler = () => { }) => {
    const { manager, data } = this;
    const pages = manager.getAllPage();
    let e, x, y;
    await handler(Utils.EventTypeEnum.POINT, this, 0);
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
    await handler(Utils.EventTypeEnum.POINT, this, 1);
    e = await manager._events.update(el, 'pointerup', { pointermove: updatePoint })
    const updateMark = (e) => {
      const { point: [x, y] } = manager.getEventData(e)
      data.mark[0] = x;
      data.mark[1] = y;
      manager.renderView();
    }
    await handler(Utils.EventTypeEnum.MARK, this, 0);
    e = await manager._events.update(el, 'pointerup', { pointermove: updateMark });
    await handler(Utils.EventTypeEnum.DONE, this, 0);
  }
}