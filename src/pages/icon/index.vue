<template lang="pug">
.p-3
  select(v-model="setName", @change="getIconSet")
    option(
      v-for="item in collections",
      :key="item.provider",
      :value="item.provider"
    ) {{ item.provider }}[{{ item.name }}]
  ul.flex.flex-row.mt-2.flex-wrap
    li.transition-all.border-1.text-center.cursor-pointer.w-25.h-25.truncate.p-2.rounded-md.m-2.shadow-md(
      un-hover="text-blue bg-slate-50",
      v-for="name in iconList",
      :key="name",
      :title="name"
    )
      label {{ name }}
      Icon.text-9.w-9.block.mt-2.mx-auto(:name="name")
  button.block.w-full.py-1.rounded.bg-none.bg-transparent.border.transition-all.text-slate-400(
    v-if="curIconSet",
    @click="getMoreIcon",
    un-hover="border-blue text-blue"
  ) 加载更多
</template>
<script>
import Icon from "./icon.vue";
import { find, get, sortBy } from "lodash-es";
import { computed, onMounted, ref } from "vue";

export default {
  components: { Icon },
  setup() {
    const collections = ref([]);
    const setName = ref("");
    let pageIndex = ref(0);
    const pageSize = 10;
    async function getIconCollections() {
      const res = await fetch("//api.iconify.design/collections");
      const json = await res.json();
      const list = Object.keys(json).map((provider) => ({
        provider,
        ...json[provider],
        icons: [],
      }));
      collections.value = sortBy(list, "provider");
    }
    const curIconSet = computed(() => {
      return find(collections.value, { provider: setName.value });
    });
    const iconList = computed(() => {
      const { value: iconSet } = curIconSet;
      if (!iconSet) return [];
      return iconSet.icons
        .slice(0, pageIndex.value * pageSize)
        .map((name) => `${iconSet.provider}:${name}`);
    });
    async function getIconSet() {
      const { value: iconSet } = curIconSet;
      if (!get(iconSet, "samples.length")) return;
      pageIndex.value = 1;
      getMoreIcon();
    }
    async function getMoreIcon() {
      const { value: iconSet } = curIconSet;
      if (iconSet) {
        if (!iconSet.icons.length) {
          const { uncategorized, categories } = await (
            await fetch(
              `//api.iconify.design/collection?prefix=${iconSet.provider}`
            )
          ).json();
          const icons = [];

          if (uncategorized) icons.push(...uncategorized);
          if (categories) icons.push(...[].concat(...Object.values(categories)));
          iconSet.icons = icons;
        } else {
          pageIndex.value++;
        }
      }
    }
    onMounted(async () => {
      await getIconCollections();
      setName.value = collections.value[0].provider;
      getIconSet();
    });
    return {
      getIconSet,
      iconList,
      collections,
      setName,
      getMoreIcon,
      curIconSet,
    };
  },
};
</script>
<style lang="scss"></style>