import { Manager } from "@/Cloud/Manager";
import { Box } from "../Box";
import { max, min, set } from "lodash-es";
const PageFlag = ".luckysheetsheetchange";
export class KKXlsManager extends Manager {
  /** @type {HTMLDivElementF} */
  sheetEl;
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
    this.sheetEl = this.scrollEl.querySelector(".luckysheetsheetchange");
    this._luckysheet = excelSheet;
    const index = excelSheet.getSheet().index;
    this.sheetIndex = index;
  }
  sheetIndex = "1";
  renderFn() {
    const page = this.sheetEl;
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
    // 操作iframe里luckysheet的配置
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
    const d = this._luckysheet.getSheet({ index });
    if (!d) return;
    this._luckysheet.setSheetActive(d.order, {
      success: () => {
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
        const pageDom = this.sheetEl;
        const { height, width } = canvas.getBoundingClientRect();
        const scrollLeft =
          pageDom.offsetLeft + pageDom.clientWidth * cx - (width >> 1);
        const scrollTop =
          pageDom.offsetTop + pageDom.clientHeight * cy - (height >> 1);
        this._luckysheet.scroll({ scrollLeft, scrollTop });
      },
    });
  }
}

function getEventPage(e) {
  const page = e.target.closest(PageFlag);
  return page;
}
