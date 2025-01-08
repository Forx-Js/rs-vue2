import { max, min, pullAll, throttle } from "lodash-es";
import { Box } from "./Box";
import { DrawEvents } from "./DrawEvent";

export class Manager {
  constructor() {
    this._initObs();
  }
  /** @type {Box[]} */
  list = [];
  #onChange;
  /** @type {Box} */
  _tem_box;
  _events = new DrawEvents(this);
  _activePage = new Set();
  /** @type {IntersectionObserver} */
  _scroll_obs;
  /** @type {MutationObserver} */
  _page_obs;
  /** @type {ResizeObserver} */
  _size_obs;
  /** @type {HTMLDivElement} */
  scrollEl;
  /** @type {HTMLDivElement} */
  parentEl;
  /** @type {HTMLDivElement} */
  viewEl;
  setScrollEl(el) {
    el.addEventListener("scroll", this._onPageScroll);
    this._size_obs.observe(el);
    this.scrollEl = el;
  }
  setParentEl(el) {
    this.setCanvas();
    el.appendChild(this.canvas);
    this.parentEl = el;
  }
  setViewEl(el) {
    this._page_obs.observe(el, { childList: true });
    el.addEventListener("contextmenu", this._onContextmenu);
    this.viewEl = el;
  }
  _onIntersectionObserver(rectList) {
    const activePage = this._activePage;
    for (const rect of rectList) {
      if (rect.isIntersecting || rect.isVisible) activePage.add(rect.target);
      else activePage.delete(rect.target);
    }
    this.renderView();
  }
  _onMutationObserver() {
    const pages = this.parentEl.querySelectorAll(".page");
    const scroll_obs = this._scroll_obs;
    const size_obs = this._size_obs;
    for (const page of pages) {
      scroll_obs.observe(page);
      size_obs.observe(page);
    }
  }
  _obResizeObserver() {
    const parentEl = this.scrollEl;
    const pageRect = parentEl.getBoundingClientRect();
    this.canvas.height = pageRect.height;
    this.canvas.width = pageRect.width;
    const left = pageRect.left;
    const top = pageRect.top;
    this.canvas.style.left = left + "px";
    this.canvas.style.top = top + "px";
    this.renderView();
  }
  _initObs() {
    // 实时更新增在视口的页面,避免渲染不必要的元素
    this._scroll_obs = new IntersectionObserver(
      this._onIntersectionObserver.bind(this)
    );
    // 当添加新页面时,可以直接更新
    this._page_obs = new MutationObserver(this._onMutationObserver.bind(this));
    this._size_obs = new ResizeObserver(this._obResizeObserver.bind(this));
  }
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
  renderFn() {
    const clouds = this.list;
    const visibleClouds = [];
    const activePage = this._activePage;
    const __tem = this._tem_box;
    for (const page of activePage) {
      const index = ~~page.dataset.pageNumber;
      for (const cloud of clouds) {
        if (cloud.index === index) {
          cloud.pageDom = page;
          visibleClouds.push(cloud);
        }
      }
      if (__tem && __tem.index === index) visibleClouds.push(__tem);
    }
    this.visibleClouds = visibleClouds.filter((b) => b.visible);
    this.render(visibleClouds);
  }
  /** @param {Box} box */
  _transform(box) {
    return { ...box.data };
  }
  create() {
    console.warn("create is not implemented");
  }
  stopCreate() {
    this._tem_box = null;
    this.renderView();
    this._events.clear();
  }
  _onPageScroll = () => this.renderView();
  destroy() {
    this._scroll_obs.disconnect();
    this._page_obs.disconnect();
    this._size_obs.disconnect();
    this.scrollEl.removeEventListener("scroll", this._onPageScroll);
    this._tem_box = null;
    this.clear();
    this.renderView();
    this._events.clear();
  }
  getXY() {
    console.warn("getXY is not implemented");
    return [0, 0];
  }
  jump() {
    console.warn("jump is not implemented");
  }
  jumpToPageAndMark(pageDom, cloud) {
    const { canvas } = this;
    const { points, mark } = cloud.data;
    const [xRow, yRow] = [...points, ...mark].reduce(
      (list, val, index) => {
        list[index % 2].push(val);
        return list;
      },
      [[], []]
    );
    const cx = (max(xRow) + min(xRow)) / 2,
      cy = (max(yRow) + min(yRow)) / 2;
    const { height, width } = canvas.getBoundingClientRect();
    const left = pageDom.offsetLeft + pageDom.clientWidth * cx - (width >> 1);
    const top = pageDom.offsetTop + pageDom.clientHeight * cy - (height >> 1);
    this.scrollEl.scrollTo({ left, top });
  }
  getEventData(e) {
    return { e, index: 1, point: this.getXY(e), el: e.target };
  }
  getAllPage() {
    console.warn("getAllPage is not implemented");
    return [];
  }
}
