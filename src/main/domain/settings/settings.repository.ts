/**
 * SQLite Settings Repository Implementation
 * Handles settings data access using SQLite via sql.js
 */

import type { Settings } from '@shared/types';

import { getDatabase, withTransaction } from '../../database/index';

import type { ISettingsRepository } from './settings.repository.interface';

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  fontSize: 16,
  fontFamily: 'system-ui',
  autoSave: true,
  autoSaveInterval: 30000,
  language: 'en',
};

export class SettingsRepository implements ISettingsRepository {
  getAll(): Settings {
    const db = getDatabase();
    // Note: db.exec is sql.js Database method, not child_process.exec
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

    return { ...DEFAULT_SETTINGS, ...settings };
  }

  get<K extends keyof Settings>(key: K): Settings[K] {
    const settings = this.getAll();
    return settings[key];
  }

  updateMultiple(updates: Partial<Settings>): Settings {
    return withTransaction((db) => {
      const now = new Date().toISOString();

      for (const [key, value] of Object.entries(updates)) {
        db.run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`, [
          key,
          JSON.stringify(value),
          now,
        ]);
      }

      return this.getAll();
    });
  }

  updateSingle<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.updateMultiple({ [key]: value } as Partial<Settings>);
  }
}
