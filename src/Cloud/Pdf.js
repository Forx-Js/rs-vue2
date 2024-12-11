import { chunk, flatten, max, min, pullAll, throttle } from "lodash-es";
import { CloudManager } from "./Manager";
import { Cloud } from "./Box";
let moveHandler, clickHandler;
export class PdfManager extends CloudManager {
  constructor() {
    super();
    this.#initObs();
  }
  /** @type {HTMLIFrameElement} */
  iframe;
  get pdfViewer() {
    return this.iframe.contentWindow?.PDFViewerApplication?.pdfViewer
  }
  /** @type {Cloud[]} */
  clouds = []
  /** @type {Cloud[]} */
  visibleClouds = []
  #activePage = new Set()
  /** @type {IntersectionObserver} */
  #scroll_obs
  /** @type {MutationObserver} */
  #page_obs
  /** @type {ResizeObserver} */
  #size_obs
  /** @type {HTMLDivElement} */
  pageRootDom
  #onChange
  onClouds(fn) {
    this.#onChange = fn;
  }
  add(cloud) {
    let tem = cloud ? [].concat(cloud).filter(f => f instanceof Cloud) : []
    if (!cloud) return
    this.clouds.push(...tem);
    this.#onChange?.(this.clouds)
    this.renderView()
  }
  clear(cloud) {
    let tem = cloud ? [].concat(cloud) : this.clouds
    pullAll(this.clouds, tem)
    this.#onChange?.(this.clouds)
    this.renderView()
  }
  renderView = throttle(this.renderPage, 45, { leading: false, trailing: true })
  #onPageScroll = () => this.renderView()
  hoverPoint = []
  baseCanvasMove = (e) => {
    if (!this.ctx || !this.visibleClouds.length) {
      this.hoverPoint = []
    } else {
      this.hoverPoint = this.getXY(e);
    }
    this.renderView()
  }
  renderPage() {
    const visibleClouds = [];
    const clouds = this.clouds
    const activePage = this.#activePage
    const _tem_cloud = this._tem_cloud;
    for (const page of activePage) {
      const index = ~~page.dataset.pageNumber;
      for (const cloud of clouds) {
        if (cloud.index === index) {
          cloud.pageDom = page;
          visibleClouds.push(cloud);
        }
      }
      if (_tem_cloud && _tem_cloud.index === index)
        visibleClouds.push(_tem_cloud);
    }
    this.visibleClouds = visibleClouds;
    this.render(visibleClouds);
  }
  setIframe(iframe) {
    this.iframe = iframe;
    const doc = iframe.contentDocument;
    const root = doc.querySelector("#viewerContainer");
    const viewer = doc.querySelector("#viewer");
    this.setCanvas()
    doc.body.appendChild(this.canvas);
    this.#size_obs.observe(root);
    this.#page_obs.observe(viewer, { childList: true });
    root.addEventListener("scroll", this.#onPageScroll);
    this.pageRootDom = root
  }
  // 初始化观察器
  #initObs() {
    // 实时更新增在视口的页面,避免渲染不必要的元素
    this.#scroll_obs = new IntersectionObserver((rectList) => {
      const activePage = this.#activePage
      for (const rect of rectList) {
        if (rect.isIntersecting || rect.isVisible) {
          activePage.add(rect.target);
        } else {
          activePage.delete(rect.target);
        }
      }
      this.renderView();
    });
    // 当添加新页面时,可以直接更新
    this.#page_obs = new MutationObserver(() => {
      const pages = this.pageRootDom.querySelectorAll(".page");
      const scroll_obs = this.#scroll_obs
      const size_obs = this.#size_obs
      for (const page of pages) {
        // page.addEventListener('pointermove', this.baseCanvasMove)
        scroll_obs.observe(page);
        size_obs.observe(page);
      }
    });
    this.#size_obs = new ResizeObserver(() => {
      const iframe = this.iframe
      const pageRootDom = this.pageRootDom
      const iframeRect = iframe.getBoundingClientRect();
      const pageRect = pageRootDom.getBoundingClientRect();
      this.canvas.height = pageRect.height;
      this.canvas.width = pageRect.width;
      const left = pageRect.left + iframeRect.left;
      const top = pageRect.top + iframeRect.top;
      this.canvas.style.left = left + 'px';
      this.canvas.style.top = top + 'px';
      this.renderView();
    });
  }
  getAllPage() {
    return [...this.pageRootDom.querySelectorAll(".page")];
  }
  create() {
    this.renderView();
    this.#removePageEvent();
    return this.createStep()
  }
  /** 异步方法 */
  async * createStep() {
    const pages = this.getAllPage();
    let e, x, y
    const data = Cloud.data({ scale: 1 });
    const _tem_cloud = new Cloud(data);
    const pointNum = yield _tem_cloud || 2;
    this._tem_cloud = _tem_cloud;
    let page, index;
    e = await this.#addPageEvent(pages)
    page = getEventPage(e);
    index = ~~page.dataset.pageNumber;
    _tem_cloud.index = index;
    _tem_cloud.pageDom = page;
    if (pointNum > 0) {
      [x, y] = this.getXY(e);
      data.points.push(x, y);
      this.renderView(_tem_cloud);
    }
    for (let i = 1; i < pointNum; i++) {
      const length = data.points.length
      await this.#addPageEvent(page, (e) => {
        e.preventDefault();
        [x, y] = this.getXY(e);
        data.points[length] = x;
        data.points[length + 1] = y;
        this.renderView(_tem_cloud);
      });
    }
    const markNum = yield _tem_cloud || 1;
    for (let i = 0; i < markNum; i++) {
      const length = data.mark.length;
      await this.#addPageEvent(page, (e) => {
        e.preventDefault();
        const [x, y] = this.getXY(e);
        data.mark[length] = x;
        data.mark[length + 1] = y;
        this.renderView(_tem_cloud);
      });
    }
    const pdf = this.pdfViewer ? this.pdfViewer._pages[index - 1] : {};
    _tem_cloud.data.scale = pdf.viewport.scale;
    this._tem_cloud = null;
    return _tem_cloud
  }
  stopCreate() {
    this._tem_cloud = null;
    this.#removePageEvent();
    this.renderView();
  }
  getXY(e) {
    const page = getEventPage(e);
    const rect = page.getBoundingClientRect();
    const index = ~~page.dataset.pageNumber;
    const pdf = this.pdfViewer ? this.pdfViewer._pages[index - 1] : {};
    let x = (e.clientX - rect.left) / rect.width;
    let y = (e.clientY - rect.top) / rect.height;
    const xy = this.getRotateXY([x, y], 360 - pdf.viewport.rotation)
    return xy;
  }
  getRotateXY(xy = [], rotation = 0) {
    const d = rotation / 90;
    const kx = d === 2 || d === 1
    const ky = d === 2 || d === 3
    if (d % 2) xy.reverse();
    if (kx) xy[0] = 1 - xy[0]
    if (ky) xy[1] = 1 - xy[1]
    return xy
  }
  /** @param {Cloud} cloud */
  _transform(cloud) {
    const { data: _data, index } = cloud
    const pdf = this.pdfViewer ? this.pdfViewer._pages[index - 1] : {};
    const data = {
      ..._data,
      points: [],
      mark: []
    }
    data.points = flatten(chunk(_data.points, 2).map(xy => this.getRotateXY(xy, pdf.viewport.rotation)))
    data.mark = this.getRotateXY([..._data.mark], pdf.viewport.rotation)
    return data
  }
  /** 
   * @description 给dom添加点击事件,并返回一个promise,限制到点击事件第一次触发
   * @param {HTMLDivElement|HTMLDivElement[]} page
   * @param {(e:MouseEvent)=>void} move
   **/
  #addPageEvent(page, move) {
    /**  @type {HTMLDivElement[]} */
    const pages = [].concat(page);
    const { resolve, promise } = withResolvers()
    if (move) moveHandler = (e) => { move.call(this, e) }
    clickHandler = (e) => {
      move && move.call(this, e);
      e.preventDefault();
      this.#removePageEvent()
      resolve(e)
    }
    for (const page of pages) {
      move && page.addEventListener("pointermove", moveHandler);
      page.addEventListener("pointerdown", clickHandler, { once: true });
    }
    return promise
  }
  #removePageEvent() {
    const pages = this.getAllPage();
    for (const page of pages) {
      page.removeEventListener('pointermove', moveHandler);
      page.removeEventListener("pointerdown", clickHandler);
    }
  }
  jump(cloud) {
    const { pdfViewer, canvas } = this;
    pdfViewer.currentScale = cloud.data.scale;
    const page = pdfViewer._pages[cloud.index - 1];
    const pageDom = page.div;
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
    const left = pageDom.offsetLeft + page.width * cx - (width >> 1);
    const top = pageDom.offsetTop + page.height * cy - (height >> 1);
    pdfViewer.container.scrollTo({ left, top });
  }
  destroy() {
    this.#removePageEvent();
    this._tem_cloud = null
    this.clear()
    this.#scroll_obs.disconnect();
    this.#page_obs.disconnect();
    this.#size_obs.disconnect();
    this.pageRootDom.removeEventListener("scroll", this.#onPageScroll);
  }
}
/**
 * @description 同 {Promise.withResolvers}
 * @returns {{ promise: Promise, resolve: (value: any) => void, reject:(reason?: any) => void }}
 */
function withResolvers() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const resolver = { promise, resolve, reject };
  return resolver;
}
function getEventPage(e) {
  const page = e.target.closest(".page");
  return page;
}