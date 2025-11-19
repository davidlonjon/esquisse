/**
 * Settings Service
 * Business logic layer for settings operations
 */

import type { Settings } from '@shared/types';

import type { ISettingsRepository } from './settings.repository.interface';

export class SettingsService {
  constructor(private readonly repository: ISettingsRepository) {}

  /**
   * Get all settings
   */
  getAllSettings(): Settings {
    return this.repository.getAll();
  }

  /**
   * Get a specific setting value
   */
  getSetting<K extends keyof Settings>(key: K): Settings[K] {
    return this.repository.get(key);
  }

  /**
   * Update multiple settings at once
   * Business rules:
   * - Font size must be between 10 and 32
   * - Auto save interval must be at least 1000ms
   * - Language must be a valid locale code
   */
  updateSettings(updates: Partial<Settings>): Settings {
    // Validate font size
    if (updates.fontSize !== undefined && (updates.fontSize < 10 || updates.fontSize > 32)) {
      throw new Error('Font size must be between 10 and 32');
    }

    // Validate auto save interval
    if (updates.autoSaveInterval !== undefined && updates.autoSaveInterval < 1000) {
      throw new Error('Auto save interval must be at least 1000ms');
    }

    // Validate language (basic check)
    if (updates.language !== undefined) {
      const validLanguages = ['en', 'fr'];
      if (!validLanguages.includes(updates.language)) {
        throw new Error(`Language must be one of: ${validLanguages.join(', ')}`);
      }
    }

    return this.repository.updateMultiple(updates);
  }

  /**
   * Update a single setting
   */
  updateSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
    // Reuse updateSettings validation
    this.updateSettings({ [key]: value } as Partial<Settings>);
  }
}
