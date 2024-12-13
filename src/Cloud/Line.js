import {Box} from "./Box"; 
import {Utils} from "./utils";
export class LineBox extends Box {
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
    const list = points;
    path.moveTo(list[0][0], list[0][1]);
    for (const [x, y] of list) path.lineTo(x, y);
    this.boxPath = path;
    return path
  }
  create=Utils.dblPointHandler
}