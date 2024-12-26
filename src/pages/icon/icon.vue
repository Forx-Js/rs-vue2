<template lang="pug">
.icon-svg(v-html="svg")
</template>
<script>
import { loadIcon } from "@iconify/vue";
import { iconToHTML, iconToSVG, replaceIDs } from "@iconify/utils";
export default {
  props: { name: { type: String, default: "" } },
  data() {
    return { svg: "" };
  },
  created() {
    this.getIconSet();
  },
  methods: {
    async getIconSet() {
      if (!this.name) return;
      const json = await loadIcon(this.name);
      const renderData = iconToSVG(json, {
        width: "1em",
      });
      const svg = iconToHTML(
        replaceIDs(renderData.body),
        renderData.attributes
      );
      this.svg = svg;
    },
  },
};
</script>