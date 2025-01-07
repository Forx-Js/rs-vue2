import { Manager } from "@/Cloud/Manager";
import { Box } from "../Box";
import { set } from "lodash-es";
const PageFlag = ".luckysheetsheetchange";
export class KKExcelManager extends Manager {
  // _excelObj = void 0;
  /** @param {IntersectionObserverEntry} rectList  */
  _onMutationObserver() {
    const doc = this.iframe.contentDocument;
    const sheetEl = doc.querySelector("#luckysheet");
    const scroll = doc.querySelector("#luckysheet-cell-main");
    const excelSheet = this.iframe.contentWindow.luckysheet;
    this.viewEl = sheetEl;
    this.setScrollEl(scroll);
    this.setParentEl(doc.body);
    this.canvas.style.zIndex = 1004;
    scroll.addEventListener("scroll", this._onPageScroll);
    this._excelObj = excelSheet;
  }
  sheetIndex = 1;
  renderFn() {
    const page = this.scrollEl.querySelector(".luckysheetsheetchange");
    const { list: clouds, sheetIndex } = this;
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
  setIframe(iframe) {
    this.iframe = iframe;
    const doc = iframe.contentDocument;
    const options = this.iframe.contentWindow.luckysheetOptions;
    set(options, "hook.sheetActivate", (index) => {
      this.sheetIndex = index;
      this.renderView();
    });
    const luckysheet = doc.querySelector("#luckysheet");
    this._page_obs.observe(luckysheet, { childList: true });
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
    return [...this.viewEl.querySelectorAll(PageFlag)];
  }
  getEventData(e) {
    const el = getEventPage(e);
    const index = this.sheetIndex;
    // ~~el.dataset.pageNumber;
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
  jump(cloud) {
    const index = cloud.index;
    const page = this.viewEl.querySelector(
      `.img-area[data-page-number="${index}"]`
    );
    this.jumpToPageAndMark(page, cloud);
  }
}

function getEventPage(e) {
  const page = e.target.closest(PageFlag);
  return page;
}
