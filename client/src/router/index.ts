import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SettingsView from '../views/SettingsView.vue'
import DocsView from "../views/DocsView.vue";
import DoubleChat from "../views/DoubleChat.vue";

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
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
    {
      path: '/api-docs',
      name: 'docs',
      component: DocsView,
    },
  ],
})

export default router
