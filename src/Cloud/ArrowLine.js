import {Box} from "./Box"; 
import {Utils} from "./utils";
export class ArrowBox extends Box {
  static type = Utils.BoxTypeEnum.arrow;
  /**  @param {BoxData} data */
  constructor(data) {
    const d = ArrowBox.data(data)
    d.type = ArrowBox.type;
    super(d);
  }
  setBoxPath() {
    const path = new Path2D()
    const { boxRect :{ points },data:{textHeight} } = this;
    path.moveTo(...points[0]);
    for (const [x, y] of points)
      path.lineTo(x, y);
    const path2=new Path2D()
    const rotate=Math.atan2(points[1][1]-points[0][1],points[1][0]-points[0][0])/Math.PI*180;
    const tr=new DOMMatrix()
      .translate(...points[1])
      .rotate(rotate)
    path2.moveTo(-textHeight,-textHeight>>1)
    path2.lineTo(0,0)
    path2.lineTo(-textHeight,textHeight>>1)
    path.addPath(path2,tr);
    path.addPath(path2);
    this.boxPath = path;
    return path
  }
  create=Utils.dblPointHandler
}