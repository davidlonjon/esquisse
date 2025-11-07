import { Settings } from '../../shared/ipc-types';

import { getDatabase, saveDatabase } from './index';

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  fontSize: 16,
  fontFamily: 'system-ui',
  autoSave: true,
  autoSaveInterval: 30000,
};

/**
 * Get all settings
 */
export function getSettings(): Settings {
  const db = getDatabase();
  const result = db.exec('SELECT key, value FROM settings');

  const settings: Partial<Settings> = {};

  if (result.length > 0 && result[0].values.length > 0) {
    const columns = result[0].columns;
    const values = result[0].values;

    for (const row of values) {
      const key = row[columns.indexOf('key')] as string;
      const value = row[columns.indexOf('value')] as string;

      try {
        settings[key as keyof Settings] = JSON.parse(value);
      } catch {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        settings[key as keyof Settings] = value as any;
      }
    }
  }

  // Merge with defaults
  return { ...DEFAULT_SETTINGS, ...settings };
}

/**
 * Set settings (partial update)
 */
export function setSettings(updates: Partial<Settings>): Settings {
  const db = getDatabase();
  const now = new Date().toISOString();

  for (const [key, value] of Object.entries(updates)) {
    db.run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`, [
      key,
      JSON.stringify(value),
      now,
    ]);
  }

  saveDatabase();

  return getSettings();
}

/**
 * Get a specific setting
 */
export function getSetting<K extends keyof Settings>(key: K): Settings[K] {
  const settings = getSettings();
  return settings[key];
}

/**
 * Set a specific setting
 */
export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  setSettings({ [key]: value } as Partial<Settings>);
}
