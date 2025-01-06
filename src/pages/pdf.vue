<template lang="pug">
.content
  iframe.w-screen.h-screen.block(
    ref="iframe",
    src="/pdf/web/viewer.html?file=compressed.tracemonkey-pldi-09.pdf",
    border="0",
    frameborder="0",
    @load="onFrameLoad"
  )
  MangerPane(:manager="manager")
</template>
<script>
import { defineComponent, onUnmounted, ref } from "vue";
import { ArrowBox, CloudMark, PdfManager } from "../Cloud";
import MangerPane from "@/components/Manger/index.vue";
export default defineComponent({
  components: { MangerPane },
  setup() {
    const iframe = ref();
    let manager = new PdfManager();
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
          lineWidth: 1,
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
    return { MangerPane, onFrameLoad, iframe, manager };
  },
});
</script>

<style scoped lang="scss">
.content {
  height: 100vh;
  width: 100vw;
  background-image: linear-gradient(20deg, #db43db, #120999);
}
</style>
