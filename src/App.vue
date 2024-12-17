<template lang="pug">
.content
  iframe.w-screen.h-screen.block(
    ref="iframe",
    src="/pdf/web/viewer.html?file=compressed.tracemonkey-pldi-09.pdf",
    border="0",
    frameborder="0",
    @load="onFrameLoad"
  )
  .shadow-sm.border-1.transition-right.w-60.fixed.top-2.bottom-2.right--60.z-1.bg-white.p-2.rounded(
    un-hover="right-0"
  )
    .bar(
      un-text="center 3",
      un-absolute,
      un-left="-6",
      un-w="6",
      un-h="24",
      un-top="50",
      un-rounded="l",
      un-bg="blue-800"
    )
    .border-b-1.border-b-solid.border-gray.pb-2
      input(type="checkbox", v-model="isContinuous")
      button.mr-1.mt-1.bg-blue-500.rounded(
        un-text="3 white",
        un-p="x-3 y-1",
        un-hover="bg-blue",
        @click="createCloud()"
      ) 添加云线框
      button.mr-1.mt-1.bg-blue-500.rounded(
        un-text="3 white",
        un-p="x-3 y-1",
        un-hover="bg-blue",
        @click="createCloudMark()"
      ) 添加云线
      button.mr-1.mt-1.px-3.py-1.text-3.bg-blue-500.text-white.rounded(
        class="hover:bg-blue",
        @click="createRect()"
      ) 添加矩形
      button.mr-1.mt-1.px-3.py-1.text-3.bg-blue-500.text-white.rounded(
        class="hover:bg-blue",
        @click="createLine()"
      ) 添加线
      button.mr-1.mt-1.px-3.py-1.text-3.bg-blue-500.text-white.rounded(
        class="hover:bg-blue",
        @click="createArrow()"
      ) 添加箭头
      button.mr-1.mt-1.px-3.py-1.text-3.bg-blue-500.text-white.rounded(
        class="hover:bg-blue",
        @click="createPencil()"
      ) 添加画笔
      button.mr-1.mt-1.px-3.py-1.text-3.bg-blue-500.text-white.rounded(
        class="hover:bg-blue",
        @click="createCircle()"
      ) 添加圆
      button.mr-1.mt-1.px-3.py-1.text-3.bg-blue-500.text-white.rounded(
        class="hover:bg-blue",
        @click="createText()"
      ) 添加文本
    ul.divide-y
      li.px-2.py-1.select-none(
        v-for="(cloud, index) in clouds",
        :key="index",
        @click="clickHandler(cloud)"
      )
        span.text-black {{ cloud.data.strText }}
</template>
<script>
import { onUnmounted, ref } from "vue";
import {
  ArrowBox,
  CircleBox,
  CloudBox,
  CloudMark,
  LineBox,
  PdfManager,
  PencilBox,
  RectBox,
  TextBox,
  Utils,
} from "./Cloud";
export default {
  setup() {
    const isContinuous = ref(false);
    const iframe = ref();
    const clouds = ref([]);
    let manager = new PdfManager();
    manager.onChange(() => {
      clouds.value = [...manager.list];
    });
    onUnmounted(() => {
      manager.destroy();
    });
    function onFrameLoad() {
      manager.setIframe(iframe.value);
      manager.add([
        new CloudMark({
          mark: [0.2, 0.2],
          points: [0.2, 0.1, 0.6, 0.125],
          index: 1,
          scale: 1,
          strText: "99999999",
        }),
        new CloudMark({
          mark: [0.4, 0.65],
          points: [0.3, 0.7, 0.35, 0.725],
          index: 10,
          scale: 5,
          color: 0x0000ff,
          strText: "22222",
        }),
        new ArrowBox({
          points: [0.3, 0.7, 0.35, 0.725],
          index: 1,
          scale: 5,
          color: 0x0000ff,
        }),
      ]);
    }
    async function clickHandler(cloud) {
      manager.jump(cloud);
    }
    async function createCloud() {
      const box = new CloudBox();
      await manager.create(box);
      manager.add(box);
    }
    async function createCloudMark() {
      const box = new CloudMark();
      await manager.create(box, (type) => {
        if (type === Utils.EventTypeEnum.MARK) box.data.strText = "strText";
      });
      manager.add(box);
    }
    async function createRect() {
      const box = new RectBox();
      await manager.create(box, (type) => {
        if (type === Utils.EventTypeEnum.MARK) box.data.strText = "strText";
      });
      manager.add(box);
    }
    async function createLine() {
      const box = new LineBox();
      await manager.create(box);
      manager.add(box);
    }
    async function createPencil() {
      do {
        const box = new PencilBox();
        await manager.create(box);
        manager.add(box);
      } while (isContinuous.value);
    }
    async function createCircle() {
      const box = new CircleBox();
      await manager.create(box);
      manager.add(box);
    }
    async function createArrow() {
      const box = new ArrowBox();
      await manager.create(box);
      manager.add(box);
    }
    async function createText() {
      const box = new TextBox();
      box.data.strText = window.prompt("请输入文本");
      box.data.textHeight = 30;
      await manager.create(box);
      manager.add(box);
    }
    return {
      createArrow,
      createText,
      createCircle,
      createPencil,
      createRect,
      createLine,
      onFrameLoad,
      createCloudMark,
      createCloud,
      isContinuous,
      iframe,
      clouds,
      clickHandler,
    };
  },
};
</script>

<style scoped lang="scss">
.content {
  height: 100vh;
  width: 100vw;
  background-image: linear-gradient(20deg, #db43db, #120999);
}
</style>
