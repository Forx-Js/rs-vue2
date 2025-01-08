<template lang="pug">
div
  .bar.fixed.top-0.z-1
    input.border.p-1.m-1(type="text" v-model.lazy="token")
  iframe.border.fixed.h-full.w-full.top-0(
    ref="iframe"
    :src="iframeUrl"
    @load="onFrameLoad"
  )
  MangerPane(:manager="manager")
</template>
<script>
import { ref } from "vue";
import MangerPane from "@/components/Manger/index.vue";
import { KKPptManager } from "@/Cloud/kk/index";
import { ArrowBox, CloudMark } from "@/Cloud";
import { useOnlinePreview } from "./use";
export default {
  components: { MangerPane },
  setup() {
    const iframe = ref();
    const { iframeUrl, token } = useOnlinePreview(
      "kk-ppt",
      "aHR0cDovL2xvY2FsaG9zdDozMDAwL2trL2RlbW8vVmZvcm3lvIDlj5HlvJXlrZAucHB0eA%3D%3D"
    );
    const manager = new KKPptManager();
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
          index: 4,
          scale: 1,
          color: 0x0000ff,
          strText: "22222",
        }),
        new ArrowBox({
          points: [0.3, 0.7, 0.35, 0.725],
          index: 1,
          scale: 1,
          color: 0x0000ff,
        }),
      ]);
    }
    return {
      token,
      iframe,
      iframeUrl,
      manager,
      onFrameLoad,
    };
  },
};
</script>
