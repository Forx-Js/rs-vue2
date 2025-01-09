import { Manager } from "@/Cloud/Manager";
import { Box } from "../Box";
import { max, min } from "lodash-es";
const PageFlag = ".slide-img-container";
export class KKPptManager extends Manager {
  /** @type {HTMLDivElementF} */
  setIframe(iframe) {
    this.iframe = iframe;
    const viewEl = this.iframe.contentDocument.querySelector(PageFlag);
    const doc = iframe.contentDocument;
    this.setParentEl(doc.body);
    this.setScrollEl(viewEl);
    this._size_obs.observe(viewEl.parentElement);
    this.setViewEl(viewEl);
  }
  setViewEl(el) {
    this._page_obs.observe(el, {
      attributes: true,
    });
    el.addEventListener("contextmenu", this._onContextmenu);
    this.viewEl = el;
  }
  /** @param {IntersectionObserverEntry} rectList  */
  _onMutationObserver() {
    this.pageIndex = ~~this.iframe.contentWindow.curSlide;
    this.renderFn();
  }
  pageIndex = 1;
  renderFn() {
    const page = this.viewEl;
    const { list: clouds, pageIndex: sheetIndex } = this;
    const visibleClouds = [];
    for (const cloud of clouds) {
      if (cloud.index === sheetIndex) {
        cloud.pageDom = page;
        visibleClouds.push(cloud);
      }
    }
    this._tem_box && visibleClouds.push(this._tem_box);
    this.visibleClouds = visibleClouds;
    this.render(visibleClouds);
  }
  /**
   * @param {Box} box
   * @param {(type:string,box:Box,time:number)=>Promise} handler
   **/
  async create(box, handler) {
    this.renderView();
    this._tem_box = box;
    box.manager = this;
    const dragstartCon = new AbortController();
    this.scrollEl.style.touchAction = "none";
    try {
      await box.create(handler);
    } finally {
      this.viewEl.style.removeProperty("touch-action");
      dragstartCon.abort();
    }
    if (this._tem_box === box) {
      this._tem_box = null;
    }
  }
  getAllPage() {
    return [this.viewEl];
  }
  getEventData(e) {
    const el = getEventPage(e);
    const index = this.pageIndex;
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
  /**
   * @param {Box} box
   * @param {(type:string,box:Box,time:number)=>Promise} handler
   **/
  async create(box, handler) {
    this.renderView();
    this._tem_box = box;
    box.manager = this;
    const { scrollEl, viewEl } = this;
    const dragstartCon = new AbortController();
    scrollEl.style.touchAction = "none";
    viewEl.querySelectorAll("img").forEach((img) => {
      img.addEventListener(
        "dragstart",
        function (event) {
          event.preventDefault(); // 阻止默认的拖拽行为
        },
        { signal: dragstartCon.signal }
      );
    });
    const leftBtn = viewEl.querySelector(".ppt-turn-left-mask");
    const rightBtn = viewEl.querySelector(".ppt-turn-right-mask");
    try {
      leftBtn && leftBtn.style.setProperty("display", "none");
      rightBtn && rightBtn.style.setProperty("display", "none");
      await box.create(handler);
    } finally {
      this.viewEl.style.removeProperty("touch-action");
      leftBtn && leftBtn.style.removeProperty("display");
      rightBtn && rightBtn.style.removeProperty("display");
      dragstartCon.abort();
      if (this._tem_box === box) {
        this._tem_box = null;
      }
    }
  }
  jump(cloud) {
    this.iframe.contentWindow.gotoSlide(cloud.index);
  }
}

function getEventPage(e) {
  const page = e.target.closest(PageFlag);
  return page;
}
