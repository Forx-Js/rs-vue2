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
  .list
    button(
      v-for="(cloud, index) in clouds",
      :key="index",
      @click="clickHandler(cloud)"
    ) {{ cloud.data.strText }}
</template>
<script>
import { onUnmounted, ref } from "vue";
import { Cloud, PdfManager } from "./Cloud/index";
import { min, max } from "lodash-es";
export default {
  setup() {
    const canvas = ref(),
      iframe = ref();
    const clouds = ref([]);
    let manager = new PdfManager();
    manager.onClouds(() => {
      console.log(manager.clouds);
      clouds.value = [...manager.clouds];
    });
    onUnmounted(() => {
      manager.destroy();
    });
    function onFrameLoad() {
      manager.setIframe(iframe.value);
      manager.setCanvas(canvas.value);
      manager.add([
        new Cloud(
          Cloud.data({
            mark: [0.2, 0.2],
            points: [0.2, 0.1, 0.6, 0.125],
            index: 1,
            scale: 1,
            type: 1,
            strText: "99999999",
          })
        ),
        new Cloud(
          Cloud.data({
            mark: [0.4, 0.65],
            points: [0.3, 0.7, 0.35, 0.725],
            index: 10,
            scale: 5,
            strText: "22222",
          })
        ),
      ]);
    }
    async function clickHandler(cloud) {
      manager.jump(cloud);
    }
    let name = 1;
    async function createCloud() {
      // 准备阶段
      const a = manager.createCloud();
      // 确定框体位置
      const { value: cloud } = await a.next();
      // 确定框体大小
      await a.next();
      // 确定文字位置
      cloud.data.strText = name++ + "";
      await a.next();
      // 框体挂载完成，清理监听器
      manager.add(cloud);
    }
    return {
      onFrameLoad,
      createCloud,
      canvas,
      iframe,
      clouds,
      clickHandler,
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
.list {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  z-index: 1;
  background-color: #fff;
}
</style>
