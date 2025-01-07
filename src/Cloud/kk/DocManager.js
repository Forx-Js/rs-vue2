import { Manager } from "@/Cloud/Manager";
import { Box } from "../Box";
const PageFlag = ".img-area";
export class KKDocManager extends Manager {
  /** @param {IntersectionObserverEntry} rectList  */
  _onMutationObserver() {
    const pages = this.getAllPage(PageFlag);
    const scroll_obs = this._scroll_obs;
    const size_obs = this._size_obs;
    let index = 1;
    for (const page of pages) {
      page.dataset.pageNumber = index++;
      scroll_obs.observe(page);
      size_obs.observe(page);
    }
  }
  setIframe(iframe) {
    this.iframe = iframe;
    const doc = iframe.contentDocument;
    const root = doc.querySelector(".container");
    const viewer = root;
    this.setScrollEl(root);
    this.setParentEl(doc.body);
    this.setViewEl(viewer);
    this._onMutationObserver();
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
    this.viewEl.querySelectorAll("img").forEach((img) => {
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
