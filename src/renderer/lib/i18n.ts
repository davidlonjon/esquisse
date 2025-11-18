/* eslint-disable import/no-named-as-default-member */
import type { i18n as I18nInstance } from 'i18next';
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en/common.json';
import fr from '../locales/fr/common.json';

// Import type declarations for type-safe translation keys
import './i18n.types';

void i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      fr: { common: fr },
    },
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr'],
    ns: ['common'],
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18next as unknown as I18nInstance;
