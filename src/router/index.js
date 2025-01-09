import Router from "vue-router";
import Vue from "vue";
Vue.use(Router);
export default new Router({
  mode: "history",
  routes: [
    {
      path: "/",
      redirect: { name: "office" },
    },
    {
      name: "pdf",
      path: "/pdf",
      component: () => import("../pages/pdf.vue"),
    },
    {
      name: "icon",
      path: "/icon",
      component: () => import("../pages/icon/index.vue"),
    },
    {
      name: "office",
      path: "/office",
      redirect: { name: "ppt" },
    },
    {
      name: "doc",
      path: "/doc",
      alias: "/word",
      component: () => import("../pages/office/doc.vue"),
    },
    {
      name: "xls",
      alias: "/excel",
      path: "/xls",
      component: () => import("../pages/office/xls.vue"),
    },
    {
      name: "ppt",
      path: "/ppt",
      alias: "/powerpoint",
      component: () => import("../pages/office/ppt.vue"),
    },
  ],
});
