import { chunk } from "lodash-es";
import Box from "./Box"; import Utils from "./utils";
export default class LineBox extends Box {
  static type = Utils.BoxTypeEnum.line;
  /**  @param {BoxData} data */
  constructor(data) {
    const d = LineBox.data(data)
    d.type = LineBox.type;
    super(d);
  }
  setBoxPath() {
    const path = new Path2D()
    const { points } = this.boxRect;
    const list = chunk(points, 2)
    path.moveTo(list[0][0], list[0][1]);
    for (const [x, y] of list) {
      path.lineTo(x, y);
    }
    path.closePath();
    this.boxPath = path;
    return path
  }
  /**
   * @param {import('./Manager').default} manager 
   * @param {(type:string,time:number)=>Promise} handler 
   */
  async create(_manager, handler = () => { }) {
    this.manager = _manager;
    const { manager, data } = this
    manager.renderView();
    manager._tem_box = this;
    await manager.beforeCreateHook(this)
    const pages = manager.getAllPage();
    let e
    let i = 0;
    const moveHandler = (e) => {
      const { point } = manager.getEventData(e)
      const [x, y] = point;
      data.points.splice(i * 2, 2, x, y)
      manager.renderView();
    }
    do {
      await handler(Utils.EventTypeEnum.POINT, i);
      const el = this.pageDom || pages
      e = await manager._events.update(el, ['pointerdown', 'contextmenu'], { pointermove: moveHandler, pointerdown: moveHandler })
      if (e.ctrlKey || e.button === 2) {
        e.defaultPrevented()
        break
      } else {
        const { el, index } = manager.getEventData(e)
        if (!i) {
          this.pageDom = el;
          this.index = index
        }
        i++
      }
    } while (true);
  }
}