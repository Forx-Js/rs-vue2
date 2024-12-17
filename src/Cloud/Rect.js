import { Box } from "./Box";
import { Utils } from "./utils";
export class RectBox extends Box {
  type = Utils.BoxTypeEnum.rect;
  create = Utils.dblPointHandler
  setBoxPath() {
    const path = new Path2D()
    const { x1, y1, x2, y2 } = this.boxRect;
    path.rect(x1, y1, x2 - x1, y2 - y1);
    this.boxPath = path;
    return path
  }
}