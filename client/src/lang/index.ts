import { createI18n } from 'vue-i18n'
import it from './it'
import en from './en'

const i18n = createI18n({
  legacy: false,
  locale: 'it',
  fallbackLocale: 'en',
  messages: {
    it,
    en,
  },
})

export default i18n
