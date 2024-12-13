import { Box } from "./Box";
import {Utils} from "./utils";
export class PencilBox extends Box {
  static type = Utils.BoxTypeEnum.pencil;
  /**  @param {BoxData} data */
  constructor(data) {
    const d = PencilBox.data(data);
    d.type = PencilBox.type;
    super(d);
  }
  setBoxPath() {
    const path = new Path2D()
    const { points } = this.boxRect;
    const list = points;
    path.moveTo(list[0][0], list[0][1]);
    for (const [x, y] of list) path.lineTo(x, y);
    this.boxPath = path;
    return path
  }
  /**
   * @param {(type:string,time:number)=>Promise} handler
   */
  async create(handler = () => {}) {
    const { manager, data } = this;
    const pages = manager.getAllPage();
    let e;
    let i = 0;
    const moveHandler = (e) => {
      const { point } = manager.getEventData(e);
      const [x, y] = point;
      handler(Utils.EventTypeEnum.POINT, i++);
      data.points.push(x, y);
      manager.renderView();
    };
    await handler(Utils.EventTypeEnum.POINT, i++);
    e = await manager._events.update(pages, "pointerdown");
    const { el, index } = manager.getEventData(e);
    this.pageDom = el;
    this.index = index;
    e = await manager._events.update(el, "pointerup", {pointermove: moveHandler,});
    handler(Utils.EventTypeEnum.DONE, 0);
  }
}
