import { chunk, flatten, max, min } from "lodash-es";
import { Manager } from "./Manager";
import { Box } from "./Box";
export class PdfManager extends Manager {
  /** @type {HTMLIFrameElement} */
  iframe;
  get pdfViewer() {
    return this.iframe.contentWindow?.PDFViewerApplication?.pdfViewer;
  }
  setIframe(iframe) {
    this.iframe = iframe;
    const doc = iframe.contentDocument;
    const root = doc.querySelector("#viewerContainer");
    const viewer = doc.querySelector("#viewer");
    this.setScrollEl(root);
    this.setParentEl(doc.body);
    this.setViewEl(viewer);
  }
  /**
   * @param {Box} box
   * @param {(type:string,box:Box,time:number)=>Promise} handler
   **/
  async create(box, handler) {
    this.renderView();
    this._tem_box = box;
    box.manager = this;
    this.scrollEl.style.touchAction = "none";
    try {
      await box.create(handler);
    } finally {
      this.scrollEl.style.removeProperty("touch-action");
    }
    const pdf = this.pdfViewer ? this.pdfViewer._pages[box.index - 1] : {};
    box.data.scale = pdf.viewport.scale;
    if (this._tem_box === box) {
      this._tem_box = null;
    }
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
    const index = ~~page.dataset.pageNumber;
    const pdf = this.pdfViewer ? this.pdfViewer._pages[index - 1] : {};
    let x = (e.clientX - rect.left) / rect.width;
    let y = (e.clientY - rect.top) / rect.height;
    const xy = this.getRotateXY([x, y], 360 - pdf.viewport.rotation);
    return xy;
  }
  getRotateXY(xy = [], rotation = 0) {
    const d = rotation / 90;
    const kx = d === 2 || d === 1;
    const ky = d === 2 || d === 3;
    if (d % 2) xy.reverse();
    if (kx) xy[0] = 1 - xy[0];
    if (ky) xy[1] = 1 - xy[1];
    return xy;
  }
  /** @param {Box} cloud */
  _transform(cloud) {
    const { data: _data, index } = cloud;
    const pdf = this.pdfViewer ? this.pdfViewer._pages[index - 1] : {};
    const data = {
      ..._data,
      points: [],
      mark: [],
    };
    data.points = flatten(
      chunk(_data.points, 2).map((xy) =>
        this.getRotateXY(xy, pdf.viewport.rotation)
      )
    );
    data.mark = this.getRotateXY([..._data.mark], pdf.viewport.rotation);
    return data;
  }
  jump(cloud) {
    const { pdfViewer } = this;
    pdfViewer.currentScale = cloud.data.scale;
    const page = pdfViewer._pages[cloud.index - 1];
    const pageDom = page.div;
    this.jumpToPageAndMark(pageDom, cloud);
  }
  getAllPage() {
    return [...this.viewEl.querySelectorAll(".page")];
  }
}
function getEventPage(e) {
  const page = e.target.closest(".page");
  return page;
}
