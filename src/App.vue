<template lang="pug">
.content
  iframe(
    ref="iframe",
    src="/pdf/web/viewer.html?file=compressed.tracemonkey-pldi-09.pdf",
    border="0",
    frameborder="0",
    @load="onFrameLoad"
  )
  canvas.create(ref="canvas")
  button.btn(@click="createCloud") 添加
</template>
<script>
import { onUnmounted, ref } from "vue";
import { Cloud, PdfManager } from "./Cloud/index";
export default {
  setup() {
    const canvas = ref(),
      iframe = ref();
    let manager = new PdfManager();
    onUnmounted(() => {
      manager.destroy();
    });
    function onFrameLoad() {
      manager.setIframe(iframe.value);
      manager.setCanvas(canvas.value);
      const data = Cloud.data({
        mark: [0.2, 0.7],
        points: [0.45, 0.45, 0.6, 0.6],
        index: 1,
        color: 0xff0000,
        strText: "pppppp",
      });
      const cloud = new Cloud(data);
      manager.add(cloud);
    }
    async function createCloud() {
      const a = manager.createCloud();
      // 准备阶段
      const { value: cloud } = await a.next();
      // 确定框体位置
      await a.next();
      // 确定框体大小
      cloud.data.strText = "6666";
      await a.next();
      // 确定文字位置
      await a.next();
      // 框体挂载完成，清理监听器
    }
    return {
      onFrameLoad,
      createCloud,
      canvas,
      iframe,
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
