import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import Backend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ar',
    debug: false,
    lng: 'ar',

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },

    // Configure language detection
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  })

// Always return LTR for all languages (no RTL support)
i18n.dir = () => 'ltr'

export default i18n
