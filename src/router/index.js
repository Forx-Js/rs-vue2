import Router from "vue-router";
import Vue from 'vue';
Vue.use(Router);
export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      redirect: { name: 'icon' }
    },
    {
      name: 'pdf',
      path: '/pdf',
      component: () => import('../pages/pdf.vue')
    },
    {
      name: 'icon',
      path: '/icon',
      component: () => import('../pages/icon/index.vue')
    }
  ]
});