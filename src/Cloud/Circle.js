import { Utils } from "./utils";
import { Box } from "./Box";
export class CircleBox extends Box {
  type = Utils.BoxTypeEnum.circle;
  setBoxPath() {
    const path = new Path2D()
    const { x2, y2, cx, cy } = this.boxRect;
    path.ellipse(cx, cy, x2 - cx, y2 - cy, 0, 0, 2 * Math.PI);
    this.boxPath = path;
    return path
  }
  create = Utils.dblPointHandler
}