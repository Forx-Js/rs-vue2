<template lang="pug">
div
  select(v-model="setName", @change="getIconSet")
    option(
      v-for="item in collections",
      :key="item.provider",
      :value="item.provider"
    ) {{ item.provider }}[{{ item.name }}]
  ul.icon-list
    li.border-1.text-center.cursor-pointer.w-25.h-25.truncate.p-2.rounded-md.mx-1(
      uno:hover="text-red bg-slate-100",
      v-for="name in curIconSet",
      :key="name",
      :title="name",
      hover="text-red"
    )
      label {{ name }}
      Icon.text-9.w-9.block.mt-2.mx-auto(:name="name")
</template>
<script>
import Icon from "./icon.vue";
import { loadIcon } from "@iconify/vue";
import { find, get } from "lodash-es";
import { computed, onMounted, ref } from "vue";

export default {
  components: { Icon },
  setup() {
    const collections = ref([]);
    const iconList = ref([]);
    const setName = ref("");
    async function getIconCollections() {
      const res = await fetch("//api.iconify.design/collections");
      const json = await res.json();
      const list = Object.keys(json).map((provider) => ({
        provider,
        ...json[provider],
      }));
      collections.value = list;
    }
    const curIconSet = computed(() => {
      const iconSet = find(collections.value, { provider: setName.value });
      if (!iconSet) return [];
      return iconSet.samples.map((name) => `${iconSet.provider}:${name}`);
    });
    async function getIconSet() {
      const { value: iconSet } = curIconSet;
      if (!get(iconSet, "samples.length")) return;
      const { provider } = iconSet;
      const iconKeys = iconSet.samples.map((name) =>
        loadIcon(`${provider}:${name}`)
      );
      const data = await Promise.all(iconKeys);
      const icons = { prefix: provider, icons: {} };
      iconSet.samples.forEach((key, index) => {
        icons.icons[key] = data[index];
      });
    }
    onMounted(async () => {
      await getIconCollections();
      setName.value = collections.value[0].provider;
      console.log(setName.value);
    });
    return { getIconSet, iconList, collections, setName, curIconSet };
  },
};
</script>
<style lang="scss">
.icon-list {
  display: flex;
  flex-flow: row wrap;
}
</style>