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
      redirect: { name: "doc" },
    },
    {
      name: "doc",
      path: "/doc",
      component: () => import("../pages/office/doc.vue"),
    },
    {
      name: "xls",
      path: "/xls",
      component: () => import("../pages/office/xls.vue"),
    },
  ],
});
