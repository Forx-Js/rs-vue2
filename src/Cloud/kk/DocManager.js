import { Manager } from "@/Cloud/Manager";
import { Box } from "../Box";
const PageFlag = ".img-area";
export class KKDocManager extends Manager {
  constructor() {
    super();
    this._initObs();
  }
  /** @type {Box[]} */
  visibleClouds = [];
  #activePage = new Set();
  /** @type {IntersectionObserver} */
  _scroll_obs;
  /** @type {MutationObserver} */
  _page_obs;
  /** @type {ResizeObserver} */
  _size_obs;
  /** @type {HTMLDivElement} */
  pageRootDom;
  // 初始化观察器
  _initObs() {
    // 实时更新增在视口的页面,避免渲染不必要的元素
    this._scroll_obs = new IntersectionObserver(
      this.onIntersectionObserver.bind(this)
    );
    // 当添加新页面时,可以直接更新
    this._page_obs = new MutationObserver(this.onMutationObserver.bind(this));
    this._size_obs = new ResizeObserver(this.onResizeObserver.bind(this));
  }
  /** @param {IntersectionObserverEntry} rectList  */
  onIntersectionObserver(rectList) {
    const activePage = this.#activePage;
    for (const rect of rectList) {
      if (rect.isIntersecting || rect.isVisible) {
        activePage.add(rect.target);
      } else {
        activePage.delete(rect.target);
      }
    }
    this.renderView();
  }
  onResizeObserver() {
    const iframe = this.iframe;
    const pageRootDom = this.pageRootDom;
    const iframeRect = iframe.getBoundingClientRect();
    const pageRect = pageRootDom.getBoundingClientRect();
    this.canvas.height = pageRect.height;
    this.canvas.width = pageRect.width;
    const left = pageRect.left + iframeRect.left;
    const top = pageRect.top + iframeRect.top;
    this.canvas.style.left = left + "px";
    this.canvas.style.top = top + "px";
    this.renderView();
  }
  onMutationObserver() {
    const pages = this.pageRootDom.querySelectorAll(PageFlag);
    const scroll_obs = this._scroll_obs;
    const size_obs = this._size_obs;
    let index = 0;
    for (const page of pages) {
      index++;
      page.dataset.pageNumber = index;
      scroll_obs.observe(page);
      size_obs.observe(page);
    }
  }
  renderFn() {
    const clouds = this.list;
    const visibleClouds = [];
    const activePage = this.#activePage;
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
  setIframe(iframe) {
    this.iframe = iframe;
    const doc = iframe.contentDocument;
    const root = doc.querySelector(".container");
    const viewer = root;
    this.setCanvas();
    doc.body.appendChild(this.canvas);
    this._size_obs.observe(root);
    this._page_obs.observe(viewer, { childList: true });
    root.addEventListener("scroll", this.#onPageScroll);
    root.addEventListener("contextmenu", this.#onContextmenu);
    this.pageRootDom = root;
    this.onMutationObserver();
  }
  #onPageScroll = () => this.renderView();
  /**
   * @param {Box} box
   * @param {(type:string,box:Box,time:number)=>Promise} handler
   **/
  async create(box, handler) {
    this.renderView();
    this._tem_box = box;
    box.manager = this;
    const dragstartCon = new AbortController();
    this.pageRootDom.style.touchAction = "none";
    this.pageRootDom.querySelectorAll("img").forEach((img) => {
      img.addEventListener(
        "dragstart",
        function (event) {
          event.preventDefault(); // 阻止默认的拖拽行为
        },
        { signal: dragstartCon.signal }
      );
    });
    try {
      await box.create(handler);
    } finally {
      this.pageRootDom.style.removeProperty("touch-action");
      dragstartCon.abort();
    }
    if (this._tem_box === box) {
      this._tem_box = null;
    }
  }
  getAllPage() {
    return [...this.pageRootDom.querySelectorAll(PageFlag)];
  }
  destroy() {
    this._scroll_obs.disconnect();
    this._page_obs.disconnect();
    this._size_obs.disconnect();
    this.pageRootDom.removeEventListener("scroll", this.#onPageScroll);
    super.destroy();
  }
  getEventData(e) {
    const el = getEventPage(e);
    const index = ~~el.dataset.pageNumber;
    return {
      e: e,
      index,
      el,
      point: this.getXY(e),
    };
  }
  getXY(e) {
    const page = getEventPage(e);
    const rect = page.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    let y = (e.clientY - rect.top) / rect.height;
    return [x, y];
  }
  #onContextmenu(e) {
    e.preventDefault();
  }
}

function getEventPage(e) {
  const page = e.target.closest(PageFlag);
  return page;
}
