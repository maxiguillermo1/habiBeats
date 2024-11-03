// i18n.js
// START of Maxwell Guillermo Contribution

// Import the main i18n library and React integration
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Load translation files for different languages
// These JSON files contain key-value pairs of translated text
const en = require('./locales/en.json');  // English translations
const es = require('./locales/es.json');  // Spanish translations
const fr = require('./locales/fr.json');  // French translations
const ja = require('./locales/ja.json');  // Japanese translations

// Configure i18n for the application
i18n
  // Connect i18n with React
  .use(initReactI18next)
  // Initialize with configuration options
  .init({
    // Ensures compatibility with older versions
    compatibilityJSON: 'v3',
    
    // Define available languages and their translation files
    resources: {
      en: { translation: en },  // Link English translations
      es: { translation: es },  // Link Spanish translations
      fr: { translation: fr },  // Link French translations
      ja: { translation: ja }   // Link Japanese translations
    },
    
    lng: 'en',        // Set English as the default language
    fallbackLng: 'en', // Use English if a translation is missing
    
    interpolation: {
      escapeValue: false  // Don't escape special characters in translations
    }
  });

// Make the configured i18n instance available for import in other files
export default i18n;
// END of Maxwell Guillermo Contribution    
