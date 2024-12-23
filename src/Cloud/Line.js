import { Box } from "./Box";
import { Utils } from "./utils";
export class LineBox extends Box {
  type = Utils.BoxTypeEnum.line;
  setBoxPath() {
    const path = new Path2D()
    const { points } = this.boxRect;
    const list = points;
    path.moveTo(list[0][0], list[0][1]);
    for (const [x, y] of list) path.lineTo(x, y);
    this.boxPath = path;
    return path
  }
  create = Utils.dblPointHandler
}
export class ArrowBox extends Box {
  type = Utils.BoxTypeEnum.arrow;
  setBoxPath() {
    const path = new Path2D()
    const { boxRect: { points }, data: { textHeight } } = this;
    path.moveTo(...points[0]);
    for (const [x, y] of points)
      path.lineTo(x, y);
    const length = Math.hypot(points[1][1] - points[0][1], points[1][0] - points[0][0]) / 2;
    const arrowLength = Math.min(length, textHeight);
    const rotate = Math.atan2(points[1][1] - points[0][1], points[1][0] - points[0][0]);
    const angle = Math.PI + Math.PI / 10;
    path.moveTo(points[1][0] + arrowLength * Math.cos(rotate + angle), points[1][1] + arrowLength * Math.sin(rotate + angle))
    path.lineTo(points[1][0], points[1][1])
    path.lineTo(points[1][0] + arrowLength * Math.cos(rotate - angle), points[1][1] + arrowLength * Math.sin(rotate - angle))
    this.boxPath = path;
    return path
  }
  create = Utils.dblPointHandler
}
export class LeadLineBox extends Box {
  type = Utils.BoxTypeEnum.leadLine;
  /** @param {(type:string,box:Box,time:number)=>Promise} handler */
  async create(handler = () => { }) {
    const { manager, data } = this
    const pages = manager.getAllPage();
    let e
    let i = 0;
    const moveHandler = (e) => {
      const { point } = manager.getEventData(e)
      const [x, y] = point;
      data.points.splice(2, 2, x, y)
      data.mark.splice(0, 2, x, y)
      manager.renderView();
    }
    await handler(Utils.EventTypeEnum.POINT, this, 0);
    e = await manager._events.update(pages, 'pointerdown')
    const { el, index } = manager.getEventData(e)
    this.pageDom = el;
    this.index = index;
    await handler(Utils.EventTypeEnum.POINT, this, i++);
    e = await manager._events.update(el, 'pointerup', { pointermove: moveHandler, pointerup: moveHandler })
    await handler(Utils.EventTypeEnum.DONE, this, 0);
  }
  setBoxPath() {
    const path = new Path2D()
    const { points: [p1, p3] } = this.boxRect;
    const isLeft = p1[0] < p3[0];
    const width = Math.abs(p1[0] - p3[0]) * .1;
    const lineSize = Math.max(width, 30);
    const breakLine = isLeft ? -lineSize : lineSize;
    const p2 = [p3[0] + breakLine, p3[1]]
    path.moveTo(...p3);
    path.lineTo(...p2);
    path.lineTo(...p1);
    this.boxPath = path;
    return path
  }
}