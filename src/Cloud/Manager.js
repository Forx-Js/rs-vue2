import { pullAll, throttle } from "lodash-es";
import { Box } from "./Box";
import { DrawEvents } from "./DrawEvent";

export class Manager {
  /** @type {Box[]} */
  list = [];
  #onChange;
  /** @type {Box} */
  _tem_box;
  _events = new DrawEvents(this);
  constructor() {
    this._initObs();
  }
  _initObs() {}
  /** @type {CanvasRenderingContext2D} */
  get ctx() {
    const { canvas } = this;
    return canvas ? canvas.getContext("2d") : void 0;
  }
  onChange(fn) {
    this.#onChange = fn;
  }
  /** @param {HTMLCanvasElement } canvas  */
  setCanvas(canvas) {
    if (!canvas) canvas = document.createElement("canvas");
    canvas.classList.add("cloud-canvas");
    Object.assign(canvas.style, {
      position: "fixed",
      zIndex: 1,
      pointerEvents: "none",
      top: 0,
      left: 0,
    });
    this.canvas = canvas;
    return canvas;
  }
  render(boxList) {
    const { ctx } = this;
    if (!ctx) return;
    ctx.reset();
    for (const box of boxList) box.render();
  }
  add(box) {
    let list = box ? [].concat(box).filter((f) => f instanceof Box) : [];
    if (!box) return;
    for (const box of list) {
      box.manager = this;
      this.list.push(box);
    }
    this.renderView();
    this.#onChange?.(this.list);
  }
  clear(box) {
    let list = box ? [].concat(box) : this.list;
    pullAll(this.list, list);
    this.renderView();
    for (const box of list) box.manager = null;
    this.#onChange?.(list);
  }
  renderView = throttle(this.renderFn, 45, { leading: false, trailing: true });
  renderFn() {}
  /** @param {Box} box */
  _transform(box) {
    return { ...box.data };
  }
  create() {}
  stopCreate() {
    this._tem_box = null;
    this.renderView();
    this._events.clear();
  }
  destroy() {
    this._tem_cloud = null;
    this.clear();
    this.renderView();
    this._events.clear();
  }
  getXY() {
    return [0, 0];
  }
  jump() {}
  getEventData(e) {
    return { e, index: 1, point: this.getXY(e), el: e.target };
  }
  mousePoint = [];
}
