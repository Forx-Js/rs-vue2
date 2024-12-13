export class Utils {
  /**
   * @description 同 {Promise.withResolvers}
   * @returns {{ promise: Promise, resolve: (value: any) => void, reject:(reason?: any) => void }}
   */
  static withResolvers() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const resolver = { promise, resolve, reject };
    return resolver;
  }
  static BoxTypeEnum = {
    cloud: 'CLOUD',
    rect: "RECT",
    line: "LINE",
    pencil:"PENCIL",
    circle:'CIRCLE',
    text:'TEXT',
    arrow:'ARROW'
  }
  static ManagerTypeEnum = {
    PDF: 'PDF',
  }
  static EventTypeEnum = {
    POINT: 'POINT',
    MARK: 'MARK',
    DONE: 'DONE',
  }
  /**
   * @description 按下拖拽创建图形
   * @this {import("./Box").Box} 
   * @param {(type:string,time:number)=>Promise} handler*/
  static async dblPointHandler(handler=()=>{}){
    const { manager, data } = this
    const pages = manager.getAllPage();
    let e
    let i = 0;
    const moveHandler = (e) => {
      const { point } = manager.getEventData(e)
      const [x, y] = point;
      data.points.splice(i * 2, 2, x, y)
      manager.renderView();
    }
    await handler(Utils.EventTypeEnum.POINT, 0);
    e = await manager._events.update(pages, 'pointerdown')
    const { el, index } = manager.getEventData(e)
    this.pageDom = el;
    this.index = index;
    await handler(Utils.EventTypeEnum.POINT, i++);
    e = await manager._events.update(el, 'pointerup',{pointermove:moveHandler,pointerup:moveHandler})
    await handler(Utils.EventTypeEnum.DONE, 0);
  }
}