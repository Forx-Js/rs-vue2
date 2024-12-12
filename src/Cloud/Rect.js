import Box from "./Box"; import Utils from "./utils";
export default class RectBox extends Box {
  static type = Utils.BoxTypeEnum.rect;
  /**  @param {BoxData} data */
  constructor(data) {
    const d = RectBox.data(data)
    d.type = RectBox.type;
    super(d);
  }
  setBoxPath() {
    const path = new Path2D()
    const { x1, y1, x2, y2 } = this.boxRect;
    path.rect(x1, y1, x2 - x1, y2 - y1);
    this.boxPath = path;
    return path
  }
  /**
   * @param {import('./Manager').default} manager 
   * @param {(type:string,time:number)=>Promise} handler 
   */
  async create(handler = () => { }) {
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