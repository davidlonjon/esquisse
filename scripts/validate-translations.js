#!/usr/bin/env node

/**
 * Translation Validation Script
 *
 * Validates that all non-English locale files contain the same keys as the
 * base English locale. This ensures translation completeness across all
 * supported languages.
 *
 * Usage: node scripts/validate-translations.js
 * Exit code: 0 on success, 1 on validation failure
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOCALES_DIR = join(__dirname, '../src/renderer/locales');
const BASE_LOCALE = 'en';
const LOCALES = ['fr']; // Add more locales here as they're added

/**
 * Recursively get all keys from a nested object
 * @param {object} obj - The object to extract keys from
 * @param {string} prefix - The current key prefix (for nested objects)
 * @returns {string[]} Array of dot-notation keys
 */
function getKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

/**
 * Load a translation file
 * @param {string} locale - The locale code (e.g., 'en', 'fr')
 * @returns {object} The parsed translation object
 */
function loadTranslations(locale) {
  const path = join(LOCALES_DIR, locale, 'common.json');
  try {
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to load ${locale}/common.json:`, error.message);
    process.exit(1);
  }
}

/**
 * Validate translations for a specific locale
 * @param {string} locale - The locale to validate
 * @param {string[]} baseKeys - The keys from the base locale
 * @returns {object} Validation result with missing and extra keys
 */
function validateLocale(locale, baseKeys) {
  const translations = loadTranslations(locale);
  const localeKeys = getKeys(translations);

  const missing = baseKeys.filter((key) => !localeKeys.includes(key));
  const extra = localeKeys.filter((key) => !baseKeys.includes(key));

  return { missing, extra };
}

/**
 * Main validation function
 */
function main() {
  console.log('🔍 Validating translations...\n');

  // Load base locale
  const baseTranslations = loadTranslations(BASE_LOCALE);
  const baseKeys = getKeys(baseTranslations);

  console.log(`📋 Base locale (${BASE_LOCALE}): ${baseKeys.length} keys\n`);

  let hasErrors = false;

  // Validate each locale
  for (const locale of LOCALES) {
    console.log(`Checking ${locale}/common.json...`);
    const { missing, extra } = validateLocale(locale, baseKeys);

    if (missing.length === 0 && extra.length === 0) {
      console.log(`✅ ${locale}: All keys match (${baseKeys.length} keys)\n`);
    } else {
      hasErrors = true;

      if (missing.length > 0) {
        console.log(`\n❌ ${locale}: Missing ${missing.length} key(s):`);
        missing.forEach((key) => console.log(`   - ${key}`));
      }

      if (extra.length > 0) {
        console.log(`\n⚠️  ${locale}: Extra ${extra.length} key(s) (not in base locale):`);
        extra.forEach((key) => console.log(`   - ${key}`));
      }

      console.log('');
    }
  }

  if (hasErrors) {
    console.log('❌ Translation validation failed\n');
    console.log('💡 Tip: Update locale files to match the base locale (en/common.json)');
    process.exit(1);
  } else {
    console.log('✅ All translations are valid!\n');
    process.exit(0);
  }
}

main();
