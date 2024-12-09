import { pullAll, throttle } from "lodash-es";
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
  clouds = []
  visibleClouds = []
  #activePage = new Set()
  #scroll_obs
  #page_obs
  #size_obs
  /** @type {HTMLDivElement} */
  #pageRootDom
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
  renderView = throttle(() => {
    this.renderPage();
  }, 60)
  #onPageScroll = () => {
    setTimeout(this.renderView, 10)
  }
  renderPage() {
    const visibleClouds = [];
    const clouds = this.clouds
    const activePage = this.#activePage
    const _tem_cloud = this._tem_cloud;
    for (const page of activePage) {
      const index = ~~page.dataset.pageNumber;
      const pdf = this.pdfViewer ? this.pdfViewer._pages[index - 1] : {};
      const _transform = function (_data) {
        const rotation = pdf.viewport.rotation;
        const d = rotation / 90;
        const x = d === 2 || d === 1
        const y = d === 2 || d === 3
        const data = {
          ..._data,
          points: [..._data.points],
          mark: [..._data.mark]
        }
        if (d) {
          if (x) {
            for (let i = 0; i < data.points.length; i += 2)
              data.points[i] = 1 - data.points[i]
            data.mark[0] = 1 - data.mark[0]
          }
          if (y) {
            for (let i = 1; i < data.points.length; i += 2)
              data.points[i] = 1 - data.points[i]
            data.mark[1] = 1 - data.mark[1]
          }
        }
        return data
      }

      for (const cloud of clouds) {
        cloud._transform = _transform
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
    this.#size_obs.observe(root);
    this.#page_obs.observe(viewer, { childList: true });
    root.addEventListener("scroll", this.#onPageScroll);
    this.#pageRootDom = root
  }
  #initObs() {
    this.#scroll_obs = new IntersectionObserver((rectList) => {
      const activePage = this.#activePage
      for (const rect of rectList) {
        if (rect.isIntersecting || rect.isVisible) {
          activePage.add(rect.target);
        } else {
          activePage.delete(rect.target);
        }
      }
    });
    this.#page_obs = new MutationObserver(() => {
      const pages = this.#pageRootDom.querySelectorAll(".page");
      const scroll_obs = this.#scroll_obs
      const size_obs = this.#size_obs
      for (const page of pages) {
        scroll_obs.observe(page);
        size_obs.observe(page);
      }
    });
    this.#size_obs = new ResizeObserver(() => {
      const iframe = this.iframe
      const pageRootDom = this.#pageRootDom
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
    return [...this.#pageRootDom.querySelectorAll(".page")];
  }
  removePageEvent() {
    const pages = this.getAllPage();
    for (const page of pages) {
      page.removeEventListener("mousemove", moveHandler);
      page.removeEventListener("click", clickHandler);
    }
  }
  createCloud() {
    this.renderView();
    this.removePageEvent();
    return this.createStep()
  }
  /** 异步方法 */
  async *createStep() {
    const pages = this.getAllPage();
    let e, x, y
    e = await addPageEvent.call(this, pages)
    const data = Cloud.data();
    const _tem_cloud = new Cloud(data);
    this._tem_cloud = _tem_cloud;
    const page = getEventPage(e);
    const index = ~~page.dataset.pageNumber;
    _tem_cloud.index = index;
    _tem_cloud.pageDom = page;
    [x, y] = getXY(e);
    _tem_cloud.data.points = [x, y, x, y];
    this.removePageEvent();
    this.renderView();
    yield _tem_cloud;
    e = await addPageEvent.call(this, page, createMove1);
    [x, y] = getXY(e);
    _tem_cloud.data.points[2] = x;
    _tem_cloud.data.points[3] = y;
    this.renderView();
    this.removePageEvent();
    yield _tem_cloud;
    e = await addPageEvent.call(this, page, createMove2);
    [x, y] = getXY(e);
    _tem_cloud.data.mark[0] = x;
    _tem_cloud.data.mark[1] = y;
    this.removePageEvent();
    yield _tem_cloud;
    this._tem_cloud = null;
    this.add(_tem_cloud);
    this.renderView();
    return _tem_cloud
  }
  destroy() {
    this.removePageEvent();
    this._tem_cloud = null
    this.clear()
    this.#scroll_obs.disconnect();
    this.#page_obs.disconnect();
    this.#size_obs.disconnect();
    this.#pageRootDom.removeEventListener("scroll", this.#onPageScroll);
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
/** 
 * @description 给dom添加点击事件,并返回一个promise,限制到点击事件第一次触发
 * @param {HTMLDivElement|HTMLDivElement[]} page
 * @param {(e:MouseEvent)=>void} move
 **/
function addPageEvent(page, move) {
  /**  @type {HTMLDivElement[]} */
  const pages = [].concat(page);
  const { resolve, promise } = withResolvers()
  if (move) moveHandler = (e) => { move.call(this, e) }
  clickHandler = resolve
  for (const page of pages) {
    page.addEventListener("click", clickHandler);
    move && page.addEventListener("mousemove", moveHandler);
  }
  return promise
}
/** @param {MouseEvent} e */
function createMove1(e) {
  e.preventDefault();
  const [x, y] = getXY(e);
  const _tem_cloud = this._tem_cloud
  _tem_cloud.data.points[2] = x;
  _tem_cloud.data.points[3] = y;
  this.renderView(_tem_cloud);
}
function createMove2(e) {
  e.preventDefault();
  const _tem_cloud = this._tem_cloud
  const [x, y] = getXY(e);
  _tem_cloud.data.mark[0] = x;
  _tem_cloud.data.mark[1] = y;
  this.renderView(_tem_cloud);
}
function getEventPage(e) {
  const page = e.target.closest(".page");
  return page;
}
function getXY(e) {
  const page = getEventPage(e);
  const rect = page.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  return [x, y];
}