/**
 * Settings Database Functions
 * Backward-compatible wrapper functions that delegate to the repository layer
 * @deprecated Use SettingsRepository or SettingsService instead
 */

import type { Settings } from '@shared/types';

import { getContainer } from '../domain/container';

/**
 * Get all settings
 * @deprecated Use SettingsService.getAllSettings() instead
 */
export function getSettings(): Settings {
  return getContainer().settingsRepository.getAll();
}

/**
 * Set settings (partial update)
 * @deprecated Use SettingsService.updateSettings() instead
 */
export function setSettings(updates: Partial<Settings>): Settings {
  return getContainer().settingsRepository.updateMultiple(updates);
}

/**
 * Get a specific setting
 * @deprecated Use SettingsService.getSetting() instead
 */
export function getSetting<K extends keyof Settings>(key: K): Settings[K] {
  return getContainer().settingsRepository.get(key);
}

/**
 * Set a specific setting
 * @deprecated Use SettingsService.updateSetting() instead
 */
export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  getContainer().settingsRepository.updateSingle(key, value);
}
