import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './lang'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import './style.css'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#4f46e5',
          'primary-darken-1': '#4338ca',
          secondary: '#06b6d4',
          accent: '#8b5cf6',
          info: '#0284c7',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          surface: '#ffffff',
          background: '#f8fafc',
          grey: '#94a3b8',
          'grey-lighten-4': '#f1f5f9'
        },
      },
    },
  },
  defaults: {
    VBtn: {
      rounded: 'lg',
      elevation: 0
    },
    VCard: {
      rounded: 'xl',
      elevation: 0
    },
    VSheet: {
      rounded: 'xl'
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg'
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg'
    },
    VAutocomplete: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg'
    }
  }
})

const app = createApp(App)
app.use(router)
app.use(i18n)
app.use(vuetify)
app.mount('#app')
