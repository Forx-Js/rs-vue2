import { Box } from "./Box";
import { Utils } from "./utils";
export class TextBox extends Box {
  type = Utils.BoxTypeEnum.text;
  /**
   * @param {(type:string,time:number)=>Promise} handler
   */
  async create(handler = () => { }) {
    const { manager, data } = this;
    const pages = manager.getAllPage();
    let e;
    const moveHandler = (e) => {
      const { point } = manager.getEventData(e);
      data.points = [...point];
      data.mark = [...point]
      manager.renderView();
    };
    await handler(Utils.EventTypeEnum.POINT, 0,);
    e = await manager._events.update(pages, "pointerdown", { pointerdown: moveHandler });
    const { el, index } = manager.getEventData(e);
    this.pageDom = el;
    this.index = index;
    e = await manager._events.update(el, "pointerup", { pointermove: moveHandler, });
    handler(Utils.EventTypeEnum.DONE, 0);
  }
}
