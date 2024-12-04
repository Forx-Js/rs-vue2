<template lang="pug">
.content
  iframe(
    ref="iframe",
    src="/pdf/web/viewer.html?file=compressed.tracemonkey-pldi-09.pdf",
    border="0",
    frameborder="0",
    @load="onFrameLoad"
  )
  canvas.create(
    ref="canvas",
    :height="canvasProps.height",
    :width="canvasProps.width",
    :style="canvasStyle"
  )
  button.btn(@click="createCloud") 添加
</template>
<script>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from "vue";
import { CloudManager, Cloud } from "./Cloud/index";
import { throttle } from "lodash-es";
export default {
  setup() {
    let _tem_cloud;
    const canvas = ref(),
      iframe = ref(),
      canvasProps = reactive({ width: 0, height: 0, left: 0, top: 0 });
    let pageRootDom;
    let manager = new CloudManager();
    /** @type {Set<HTMLDivElement> }  */
    let activePage = new Set();
    const scroll_obs = new IntersectionObserver((rectList) => {
      for (const rect of rectList) {
        if (rect.isIntersecting || rect.isVisible) {
          activePage.add(rect.target);
        } else {
          activePage.delete(rect.target);
        }
        renderPageCloud();
      }
    });
    const page_obs = new MutationObserver(() => {
      const pages = pageRootDom.querySelectorAll(".page");
      for (const page of pages) scroll_obs.observe(page);
    });
    const size_obs = new ResizeObserver(async () => {
      const iframeRect = iframe.value.getBoundingClientRect();
      const pageRect = pageRootDom.getBoundingClientRect();
      canvasProps.height = pageRect.height;
      canvasProps.width = pageRect.width;
      canvasProps.left = pageRect.left + iframeRect.left;
      canvasProps.top = pageRect.top + iframeRect.top;
      await nextTick();
      renderPageCloud();
    });
    const canvasStyle = computed(() => {
      return {
        left: canvasProps.left + "px",
        top: canvasProps.top + "px",
      };
    });
    const cloudList = [];
    let visibleClouds = [];
    onMounted(() => {
      initCanvas();
    });
    onUnmounted(() => {
      scroll_obs.disconnect();
      page_obs.disconnect();
      size_obs.disconnect();
      pageRootDom.removeEventListener("scroll", onPageScroll);
    });
    function onFrameLoad() {
      const doc = iframe.value.contentDocument;
      const viewer = doc.querySelector("#viewer");
      pageRootDom = doc.querySelector("#viewerContainer");
      page_obs.observe(viewer, { childList: true });
      size_obs.observe(pageRootDom);
      pageRootDom.addEventListener("scroll", onPageScroll);
    }
    const renderPageCloud = throttle(() => {
      visibleClouds = [];
      for (const page of activePage) {
        const rect = page.getBoundingClientRect();
        const index = ~~page.dataset.pageNumber;
        for (const cloud of cloudList) {
          if (cloud.index === index) {
            cloud.rect = rect;
            visibleClouds.push(cloud);
          }
        }
        if (_tem_cloud && _tem_cloud.index === index)
          visibleClouds.push(_tem_cloud);
      }
      manager.render(visibleClouds);
    });
    const onPageScroll = renderPageCloud;
    function initCanvas() {
      manager.setCanvas(canvas.value);
      const data = Cloud.data();
      data.mark = [0.5, 0.5];
      data.points = [0.1, 0.1, 0.4, 0.3];
      const cloud = new Cloud(data);
      cloud.index = 1;
      cloudList.push(cloud);
    }
    function createClick1(e) {
      const data = Cloud.data();
      _tem_cloud = new Cloud(data);
      const page = getEventPage(e);
      const index = ~~page.dataset.pageNumber;
      const rect = page.getBoundingClientRect();
      _tem_cloud.index = index;
      _tem_cloud.rect = rect;
      const [x, y] = getXY(e);
      _tem_cloud.data.points = [x, y, x, y];
      renderPageCloud();
      removeCreateEvent();
      page.addEventListener("mousemove", createMove1);
      page.addEventListener("click", createClick2);
    }
    function createClick2(e) {
      const page = getEventPage(e);
      const [x, y] = getXY(e);
      _tem_cloud.data.points[2] = x;
      _tem_cloud.data.points[3] = y;
      renderPageCloud();
      removeCreateEvent();
      page.addEventListener("mousemove", createMove2);
      page.addEventListener("click", createClick3);
    }
    function createClick3(e) {
      const [x, y] = getXY(e);
      _tem_cloud.data.mark[0] = x;
      _tem_cloud.data.mark[1] = y;
      renderPageCloud();
      removeCreateEvent();
      cloudList.push(_tem_cloud);
      _tem_cloud = null;
    }
    function createMove1(e) {
      const [x, y] = getXY(e);
      _tem_cloud.data.points[2] = x;
      _tem_cloud.data.points[3] = y;
      renderPageCloud();
    }
    function createMove2(e) {
      const [x, y] = getXY(e);
      _tem_cloud.data.mark[0] = x;
      _tem_cloud.data.mark[1] = y;
      renderPageCloud();
    }
    function getXY(e) {
      const page = getEventPage(e);
      const rect = page.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      return [x, y];
    }
    function getAllPage() {
      return pageRootDom.querySelectorAll(".page");
    }
    function getEventPage(e) {
      const page = e.target.closest(".page");
      return page;
    }
    function removeCreateEvent() {
      const pages = getAllPage();
      for (const page of pages) {
        page.removeEventListener("mousemove", createMove1);
        page.removeEventListener("mousemove", createMove2);
        page.removeEventListener("click", createClick1);
        page.removeEventListener("click", createClick2);
        page.removeEventListener("click", createClick3);
      }
    }
    function createCloud() {
      const pages = getAllPage();
      removeCreateEvent();
      for (const page of pages) {
        page.addEventListener("click", createClick1);
      }
    }
    return {
      onFrameLoad,
      createCloud,
      canvas,
      iframe,
      initCanvas,
      canvasProps,
      canvasStyle,
    };
  },
};
</script>

<style scoped lang="scss">
%full-screen {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
}
.float {
  @extend %full-screen;
}
canvas {
  position: fixed;
  z-index: 1;
  pointer-events: none;
}
iframe {
  width: 100%;
  height: 100%;
  display: block;
  z-index: 0;
}
.btn {
  position: absolute;
  top: 0px;
  left: 0;
  z-index: 2;
}
.content {
  height: 100vh;
  width: 100vw;
  background-image: linear-gradient(20deg, #db43db, #120999);
}
</style>
