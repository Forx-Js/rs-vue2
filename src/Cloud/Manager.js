import { pullAll } from "lodash-es";
import { Cloud } from "./Box";

export class CloudManager {
  clouds = [];
  constructor() {
    this.clouds = [];
  }
  /** @type {CanvasRenderingContext2D} */
  get ctx() {
    const { canvas } = this
    return canvas ? canvas.getContext('2d') : void 0
  }
  _event = {}
  setCanvas(canvas) {
    if (!canvas) canvas = document.createElement('canvas')
    this.canvas = canvas;
    canvas.addEventListener("click", this._click.bind(this));
    canvas.addEventListener("mousemove", this._move.bind(this));
    return canvas
  }
  render(cloud) {
    const { ctx, clouds, canvas } = this;
    const tem = cloud ? clouds.concat(cloud) : clouds;
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const cloud of tem) {
      cloud.render(ctx);
    }
  }
  _click(e) {
    this._event.click?.(e);
  }
  _move(e) {
    this._event.mousemove?.(e);
  }
  create() {
    const { canvas } = this;
    this.render();
    this._event = {};
    this._event.click = click1;
    const app = this
    let cloud, data;
    function click1(e) {
      data = Cloud.data();
      cloud = new Cloud(data);
      const rect = canvas.getBoundingClientRect();
      data.points[0] = e.clientX - rect.left;
      data.points[1] = e.clientY - rect.top;
      data.points[2] = e.clientX - rect.left;
      data.points[3] = e.clientY - rect.top;
      app.render(cloud);
      app._event.click = click2;
      app._event.mousemove = move1;
    }
    function click2(e) {
      const rect = canvas.getBoundingClientRect();
      data.points[2] = e.clientX - rect.left;
      data.points[3] = e.clientY - rect.top;
      app.render(cloud);
      app._event.mousemove = move2;
      app._event.click = click3;
    }
    function click3(e) {
      const rect = canvas.getBoundingClientRect();
      data.mark[0] = e.clientX - rect.left;
      data.mark[1] = e.clientY - rect.top;
      delete app._event.click;
      delete app._event.mousemove;
      app.add(data);
      app.render();
    }
    function move1(e) {
      const rect = canvas.getBoundingClientRect();
      data.points[2] = e.clientX - rect.left;
      data.points[3] = e.clientY - rect.top;
      app.render(cloud);
    }
    function move2(e) {
      const rect = canvas.getBoundingClientRect();
      data.mark = [e.clientX - rect.left, e.clientY - rect.top];
      app.render(cloud);
    }
  }
  add(data) {
    if (!data) return
    const cloud = new Cloud(data);
    this.clouds.push(cloud)
    cloud.render()
  }
  clear(cloud) {
    let tem = cloud ? [].concat(cloud) : this.clouds
    pullAll(this.clouds, tem)
    this.render()
  }
} 