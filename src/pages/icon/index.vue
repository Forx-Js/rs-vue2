<template lang="pug">
div
  select(v-model="iconSetName", @change="getIconSet")
    option(v-for="item in collections", :key="item.key", :value="item.key") {{ item.key }}[{{ item.name }}]
  ul.icon-list
    li(v-for="item in iconList", :key="item.id", :title="item.key")
      label {{ item.id }}
      //- Icon(:icon="item.key")
      .svg(v-html="item.el") 
  //- Icon(icon="mdi-light:home", color="red")/
</template>
<script>
// import { Icon, addCollection } from "@iconify/vue";
import { computed, onMounted, ref } from "vue";
import { find } from "lodash-es";
// import { icons, info, metadata, chars } from "@iconify-json/mdi";
// const d = addCollection({ icons, info, metadata, chars });
// console.log(d);

// const iconSet =new IconSet(icon);
// const rootSvg = document.createElement("svg");
// rootSvg.setAttribute("aria-hidden", "true");
// rootSvg.style.position = "absolute";
// rootSvg.style.width = 0;
// rootSvg.style.height = 0;
// rootSvg.style.overflow = "hidden";
// document.body.appendChild(rootSvg);
// const
export default {
  // components: { Icon },
  setup() {
    const collections = ref([]);
    const iconList = ref([]);
    const iconSetName = ref("");
    async function getIconCollections() {
      const res = await fetch("//api.iconify.design/collections");
      const json = await res.json();
      const list = Object.keys(json).map((key) => ({
        key,
        ...json[key],
      }));
      collections.value = list;
    }
    const curIconSet = computed(() => {
      return find(collections.value, { key: iconSetName.value });
    });
    async function getIconSet() {
      const iconSet = curIconSet.value;
      if (iconSet) {
        const json = await (
          await fetch(
            `//api.iconify.design/${
              iconSet.key
            }.json?icons=${iconSet.samples.join(",")}`
          )
        ).json();
        // addCollection(json);
        const { width, height, icons, prefix } = json;
        const list = Object.keys(icons).map((key) => ({
          ...icons[key],
          id: key,
          key: `${prefix}:${key}`,
          el: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="1em" height="1em">${icons[key].body}</svg>`,
        }));
        iconList.value = list;
      }
    }
    onMounted(async () => {
      await getIconCollections();
      iconSetName.value = collections.value[0].key;
      getIconSet();
    });
    return { getIconSet, iconList, collections, iconSetName, curIconSet };
  },
};
</script>
<style lang="scss">
.icon-list {
  display: flex;
  flex-flow: row wrap;
  li {
    text-align: center;
    border: 1px solid #ccc;
    margin: 4px;
    padding: 8px;
    width: 100px;
    height: 100px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    &:hover {
      color: red;
    }
    .svg {
      font-size: 40px;
    }
    svg {
      margin: 0 auto;
      display: block;
    }
  }
}
</style>