import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './lang'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import './style.css'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#2563eb',
          secondary: '#0f766e',
          surface: '#ffffff',
          background: '#f6f8fb',
          error: '#b42318',
        },
      },
    },
  },
})

const app = createApp(App)
app.use(router)
app.use(i18n)
app.use(vuetify)
app.mount('#app')
