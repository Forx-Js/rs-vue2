 import { Box } from "./Box";
import {Utils} from "./utils";
export class RectBox extends Box {
  static type = Utils.BoxTypeEnum.rect;
  /**  @param {BoxData} data */
  constructor(data) {
    const d = RectBox.data(data)
    d.type = RectBox.type;
    super(d);
  }
  create=Utils.dblPointHandler
  setBoxPath() {
    const path = new Path2D()
    const { x1, y1, x2, y2 } = this.boxRect;
    path.rect(x1, y1, x2 - x1, y2 - y1);
    this.boxPath = path;
    return path
  }
}