import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './lang'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import { agentMdPreset } from './theme'

import '@mdi/font/css/materialdesignicons.css'
import './style.css'

const app = createApp(App)
app.use(router)
app.use(i18n)
app.use(PrimeVue, {
  inputVariant: 'outlined',
  theme: {
    preset: agentMdPreset,
    options: {
      cssLayer: false,
    },
  },
})
app.use(ToastService)
app.mount('#app')
