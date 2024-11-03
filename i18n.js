import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import your translation files
const en = require('./locales/en.json');
const es = require('./locales/es.json');
const fr = require('./locales/fr.json');
const ja = require('./locales/ja.json');

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      ja: { translation: ja }
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
