/**
 * Type-safe i18next configuration
 *
 * This module augments the i18next library with type information derived from
 * our translation files, enabling compile-time validation of translation keys
 * and autocomplete in IDEs.
 */

import type common from '../locales/en/common.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
    };
  }
}
