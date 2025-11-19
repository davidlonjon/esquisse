/**
 * Settings Repository Interface
 * Defines the contract for settings data access operations
 */

import type { Settings } from '@shared/types';

export interface ISettingsRepository {
  /**
   * Get all settings merged with defaults
   */
  getAll(): Settings;

  /**
   * Get a specific setting value
   */
  get<K extends keyof Settings>(key: K): Settings[K];

  /**
   * Update multiple settings at once
   * Returns the updated settings object
   */
  updateMultiple(updates: Partial<Settings>): Settings;

  /**
   * Update a single setting
   */
  updateSingle<K extends keyof Settings>(key: K, value: Settings[K]): void;
}
