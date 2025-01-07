<template lang="pug">
div
  .bar.fixed.top-0.z-1
    input.border.p-1.m-1(type="text" v-model.lazy="token",@change="changeUrl")
    label {{fileUrl}}
  iframe.border.fixed.h-full.w-full.top-0(
    ref="iframe"
    :src="iframeUrl"
    @load="onFrameLoad"
  )
  MangerPane(:manager="manager")
</template>
<script>
const KEY = "kk-code";
import { computed, ref } from "vue";
import MangerPane from "@/components/Manger/index.vue";
import { KKExcelManager } from "@/Cloud/kk/ExcelManager";
import { ArrowBox, CloudMark } from "@/Cloud";
export default {
  components: { MangerPane },
  setup() {
    const iframe = ref();
    const token = ref(
      localStorage.getItem(KEY) ||
        "aHR0cDovL2xvY2FsaG9zdDo4MDEyL2trL2RlbW8v5paw5bu6IE1pY3Jvc29mdCBXb3JkIOaWh%2Bahoy5kb2N4"
    );
    const fileUrl = computed(() => {
      const url = atob(decodeURIComponent(token.value));
      const utf8 = Uint8Array.from(url, (m) => m.codePointAt(0));
      const fileUrl = new TextDecoder().decode(utf8);
      const u = new URL(fileUrl);
      u.host = window.location.host;
      return u.href;
    });
    const base64 = computed(() => {
      const base64 = Array.from(
        new TextEncoder().encode(fileUrl.value),
        (byte) => String.fromCodePoint(byte)
      ).join("");
      return btoa(base64);
    });
    const iframeUrl = computed(() => {
      return `/kk/onlinePreview?url=${base64.value}`;
    });
    const manager = new KKExcelManager();
    function changeUrl() {
      if (fileUrl) {
        localStorage.setItem(KEY, base64.value);
      }
    }
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
          index: 8,
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
      fileUrl,
      changeUrl,
      iframe,
      iframeUrl,
      manager,
      onFrameLoad,
    };
  },
};
</script>
