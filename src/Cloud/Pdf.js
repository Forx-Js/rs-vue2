import { chunk, flatten, max, min, } from "lodash-es";
import Manager from "./Manager";
import Box from "./Box";
// import { DrawEvents } from "./DrawEvent";
export default class PdfManager extends Manager {
  constructor() {
    super();
    this.#initObs();
  }
  /** @type {HTMLIFrameElement} */
  iframe;
  get pdfViewer() {
    return this.iframe.contentWindow?.PDFViewerApplication?.pdfViewer
  }
  // /** @type {Box[]} */
  // list = []
  /** @type {Box[]} */
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
  renderFn() {
    const visibleClouds = [];
    const clouds = this.list
    const activePage = this.#activePage
    const _tem_cloud = this._tem_box;
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
  /** @param {Box} box   */
  async create(box, ...arg) {
    this.renderView();
    this._tem_box = box;
    box.manager = this;
    this.pageRootDom.style.touchAction = 'none'
    try {
      await box.create(...arg)
    } finally {
      this.pageRootDom.style.removeProperty('touch-action')
    }
    const pdf = this.pdfViewer ? this.pdfViewer._pages[box.index - 1] : {};
    box.data.scale = pdf.viewport.scale;
    if (this._tem_box === box) {
      this._tem_box = null;
    }
  }
  getEventData(e) {
    const el = getEventPage(e);
    const index = ~~el.dataset.pageNumber
    return {
      e: e,
      index,
      el,
      point: this.getXY(e)
    }
  }
  stopCreate() {
    this._tem_box = null;
    this.renderView();
    this.pageEvents.clear();
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
  /** @param {Box} cloud */
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
    this.#scroll_obs.disconnect();
    this.#page_obs.disconnect();
    this.#size_obs.disconnect();
    this.pageRootDom.removeEventListener("scroll", this.#onPageScroll);
    super.destroy();
  }
}
function getEventPage(e) {
  const page = e.target.closest(".page");
  return page;
}