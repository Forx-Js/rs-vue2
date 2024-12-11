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
    .bar.text-center.left--6.w-6.h-24.text-3.absolute.rounded-l.top-50.bg-blue-500
    .border-b-1.border-b-solid.border-gray.pb-2
      button.bg-blue-500.rounded(
        un-text="3 white",
        un-p="x-3 y-1",
        un-hover="bg-blue",
        @click="createCloud(1)"
      ) 添加云线
      //- button.px-3.py-1.text-3.bg-blue-500.text-white.rounded(
      //-   class="hover:bg-blue",
      //-   @click="createCloud(0)"
      //- ) 添加矩形
      //- button.px-3.py-1.text-3.bg-blue-500.text-white.rounded(
      //-   class="hover:bg-blue",
      //-   @click="createCloud(2)"
      //- ) 添加折线
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
import { Cloud, PdfManager } from "./Cloud/index";
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
            color: 0x0000ff,
            strText: "22222",
          })
        ),
      ]);
    }
    async function clickHandler(cloud) {
      manager.jump(cloud);
    }
    let name = 1;
    async function createCloud(type = 1) {
      // 准备阶段
      const a = manager.create();
      // 确定框体位置
      const { value: cloud } = await a.next();
      cloud.data.type = type;
      // 确定框体大小
      await a.next(2);
      // 确定文字位置
      cloud.data.strText = prompt("请输入文字", "");
      await a.next(1);
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
.content {
  height: 100vh;
  width: 100vw;
  background-image: linear-gradient(20deg, #db43db, #120999);
}
</style>
