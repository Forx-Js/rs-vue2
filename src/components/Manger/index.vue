<template lang="pug">
  .shadow-sm.border-1.transition-right.w-60.fixed.top-2.bottom-2.right--60.z-1.bg-white.p-2.rounded(
    un-hover="right-0"
  )
    .bar(
      un-text="center 3",
      un-absolute,
      un-left="-6",
      un-w="6",
      un-h="24",
      un-top="50",
      un-rounded="l",
      un-bg="blue-800"
    )
    .border-b-1.border-b-solid.border-gray.pb-2
      div {{ color }}
        input(type="checkbox", v-model="isContinuous")
        input(type="color", v-model="color")
      button.mr-1.mt-1.bg-blue-500.rounded(
        un-text="3 white",
        un-p="x-3 y-1",
        un-hover="bg-blue",
        @click="createCloud()"
      ) 添加云线框
      button.mr-1.mt-1.bg-blue-500.rounded(
        un-text="3 white",
        un-p="x-3 y-1",
        un-hover="bg-blue",
        @click="createCloudMark()"
      ) 添加云线
      button.mr-1.mt-1.px-3.py-1.text-3.bg-blue-500.text-white.rounded(
        class="hover:bg-blue",
        @click="createRect()"
      ) 添加矩形
      button.mr-1.mt-1.px-3.py-1.text-3.bg-blue-500.text-white.rounded(
        class="hover:bg-blue",
        @click="createLine()"
      ) 添加线
      button.mr-1.mt-1.px-3.py-1.text-3.bg-blue-500.text-white.rounded(
        class="hover:bg-blue",
        @click="createLeadLine()"
      ) 添加引线
      button.mr-1.mt-1.px-3.py-1.text-3.bg-blue-500.text-white.rounded(
        class="hover:bg-blue",
        @click="createArrow()"
      ) 添加箭头
      button.mr-1.mt-1.px-3.py-1.text-3.bg-blue-500.text-white.rounded(
        class="hover:bg-blue",
        @click="createPencil()"
      ) 添加画笔
      button.mr-1.mt-1.px-3.py-1.text-3.bg-blue-500.text-white.rounded(
        class="hover:bg-blue",
        @click="createCircle()"
      ) 添加圆
      button.mr-1.mt-1.px-3.py-1.text-3.bg-blue-500.text-white.rounded(
        class="hover:bg-blue",
        @click="createText()"
      ) 添加文本
    ul.divide-y
      li.px-2.py-1.select-none(
        v-for="(cloud, index) in clouds",
        :key="index",
        @click="clickHandler(cloud)"
      )
        span.text-black {{ cloud.data.strText }}
</template>
<script>
import { computed, defineComponent, ref } from "vue";
import { uniqueId } from "lodash-es";
import {
  ArrowBox,
  CircleBox,
  CloudBox,
  CloudMark,
  LeadLineBox,
  LineBox,
  PencilBox,
  RectBox,
  TextBox,
  Utils,
} from "../../Cloud";

export default defineComponent({
  props: {
    manager: {
      type: Object,
      required: true,
    },
  },
  setup({ manager }) {
    const color = ref("#ff0000");
    const isContinuous = ref(false);
    const clouds = ref([]);
    const colorNum = computed(() => {
      return parseInt(color.value.replace("#", ""), 16);
    });
    manager.onChange(() => {
      clouds.value = [...manager.list];
    });
    async function clickHandler(cloud) {
      manager.jump(cloud);
    }
    async function createCloud() {
      const box = new CloudBox();
      await manager.create(box);
      manager.add(box);
    }
    async function createCloudMark() {
      const box = new CloudMark();
      await manager.create(box, (type, box) => {
        if (type === Utils.EventTypeEnum.MARK)
          box.data.strText = uniqueId("Cloud_");
      });
      manager.add(box);
    }
    async function createRect() {
      const box = new RectBox();
      await manager.create(box);
      manager.add(box);
    }
    async function createLine() {
      const box = new LineBox();
      await manager.create(box);
      manager.add(box);
    }

    async function createLeadLine() {
      const box = new LeadLineBox({
        strText: "请输入文本",
      });
      await manager.create(box);
      manager.add(box);
    }
    async function createPencil() {
      do {
        const box = new PencilBox();
        box.data.color = colorNum.value;
        await manager.create(box);
        manager.add(box);
      } while (isContinuous.value);
    }
    async function createCircle() {
      const box = new CircleBox();
      await manager.create(box);
      manager.add(box);
    }
    async function createArrow() {
      const box = new ArrowBox();
      await manager.create(box);
      manager.add(box);
    }
    async function createText() {
      const box = new TextBox();
      box.data.strText = window.prompt("请输入文本");
      box.data.textHeight = 30;
      await manager.create(box);
      manager.add(box);
    }
    return {
      createArrow,
      createText,
      createCircle,
      createPencil,
      createRect,
      createLine,
      createLeadLine,
      createCloudMark,
      createCloud,
      isContinuous,
      clouds,
      clickHandler,
      color,
    };
  },
});
</script>
