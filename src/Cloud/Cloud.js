import { first, last } from "lodash-es";
import RectBox from "./Rect"; import Utils from "./utils";
export default class CloudBox extends RectBox {
  static type = Utils.BoxTypeEnum.cloud;
  /**  @param {import("./Box").BoxData} data */
  constructor(data) {
    const d = CloudBox.data(data)
    d.type = CloudBox.type;
    super(d);
  }
  // 计算云线波浪线
  #getBoxCell() {
    const { x1, y1, x2, y2 } = this.boxRect;
    const r = 10;
    const l = r * Math.SQRT2;
    const axis = [[], []];
    const balls = [];
    let _w = x1,
      _h = y1;
    while (_w < x2) {
      _w += l;
      axis[0].push(_w - r);
    }
    while (_h < y2) {
      _h += l;
      axis[1].push(_h - r);
    }
    const rad = Math.PI / 4
    balls.push(
      ...axis[0].map((x) => ({ x, y: first(axis[1]), r, s: 5 * rad, e: 7 * rad })),
      ...axis[1].map((y) => ({ x: last(axis[0]), y, r, s: -rad, e: rad })),
      ...axis[0].map((x) => ({ x, y: last(axis[1]), r, s: rad, e: rad * 3 })).reverse(),
      ...axis[1].map((y) => ({ x: first(axis[0]), y, r, s: rad * 3, e: rad * 5 })).reverse(),
    );
    return balls;
  }
  setBoxPath() {
    const path = new Path2D()
    const { boxRect: { points } } = this;
    if (!points.length) return path
    const list = this.#getBoxCell();
    for (let i = 0; i < list.length; i++) {
      const { x, y, r, s, e } = list[i];
      path.arc(x, y, r, s, e);
    }
    this.boxPath = path;
    return path
  }
}