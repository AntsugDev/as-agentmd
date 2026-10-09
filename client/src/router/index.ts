import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SettingsView from '../views/SettingsView.vue'
import DocsView from "../views/DocsView.vue";
import DoubleChat from "../views/DoubleChat.vue";
import Rag from "../views/Rag.vue";
import LogsView from "../views/LogsView.vue";
import PreChat from '../views/test/PreChat.vue';
import Index from '../views/test/Index.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/ctrl',
      name: 'double_chat',
      component: DoubleChat,
    },
    {
      path: '/rag',
      name: 'rag',
      component: Rag,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
    {
      path: '/api-docs',
      name: 'docs',
      component: DocsView,
    },
    {
      path: '/logs',
      name: 'logs',
      component: LogsView,
    },
    {
      path:'/test',
      component:Index,
      children:[
        {
          path:'/prechat',
          name:'prechat',
          component:PreChat
        }
      ]
    }
  ],
})


export default router
