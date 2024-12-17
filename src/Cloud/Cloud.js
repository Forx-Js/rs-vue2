import { add, clamp, first, flatten, inRange, last } from "lodash-es";
import { Utils } from "./utils";
import { Box } from "./Box";
export class CloudBox extends Box {
  type = Utils.BoxTypeEnum.cloud;
  // 计算云线波浪线
  #getBoxCell() {
    const { x1, y1, x2, y2 } = this.boxRect;
    const r = 12;
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
      axis[0].map((x) => ({ x, y: first(axis[1]), r, s: 5 * rad, e: 7 * rad })),
      axis[1].map((y) => ({ x: last(axis[0]), y, r, s: 7 * rad, e: 9 * rad })),
      axis[0].map((x) => ({ x, y: last(axis[1]), r, s: rad, e: rad * 3 })).reverse(),
      axis[1].map((y) => ({ x: first(axis[0]), y, r, s: rad * 3, e: 5 * rad })).reverse(),
    )
    for (let i = 0; i < balls.length; i++) {
      const list = balls[i];
      const del = list.pop();
      const next = balls[(i + 1) % balls.length][0];
      next.s = del.s
    }
    return flatten(balls)
  }
  setBoxPath() {
    const path = new Path2D()
    const { boxRect: { points, markX, markY } } = this;
    if (!points.length) return path;
    const list = this.#getBoxCell();
    for (let i = 0; i < list.length; i++) {
      const { x, y, r, s, e } = list[i];
      path.arc(x, y, r, s, e);
    }
    path.closePath();
    if (this.data.mark.length) {
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
      const { x, y, r, e, s } = balls[rand.index]
      const mRad = Math.atan2(markY - y, markX - x)
      const a_rad = isBetweenRadians(mRad, s, e) ? mRad : (mRad + Math.PI);
      path2.arc(x, y, r, a_rad, a_rad);
      path2.lineTo(markX, markY)
      path.addPath(path2);
    }
    this.boxPath = path;
    return path
  }
  create = Utils.dblPointHandler
}
const getRad = rad => {
  return rad > (Math.PI / 4) ? rad : (rad + 2 * Math.PI)
}
function normalizeRadians(radian) {
  // 将弧度值归一化到 [0, 2π) 范围内
  return ((radian % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
}
function isBetweenRadians(rad, start, end) {
  start = normalizeRadians(start);
  end = normalizeRadians(end);
  rad = normalizeRadians(rad);
  // 如果 a <= b, 那么c应该在a和b之间
  if (start <= end) {
    return rad >= start && rad <= end;
  }
  // 如果 a > b, 那么c应该在a和2π之间或者0和b之间
  else {
    return rad >= start || rad <= end;
  }
}
export class CloudMark extends CloudBox {
  type = Utils.BoxTypeEnum.cloudMark;
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