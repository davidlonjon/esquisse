/**
 * SQLite Settings Repository Implementation
 * Handles settings data access using SQLite via better-sqlite3
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
    const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{
      key: string;
      value: string;
    }>;

    const settings: Partial<Settings> = {};

    for (const row of rows) {
      try {
        settings[row.key as keyof Settings] = JSON.parse(row.value);
      } catch {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        settings[row.key as keyof Settings] = row.value as any;
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
        db.prepare(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`).run(
          key,
          JSON.stringify(value),
          now
        );
      }

      return this.getAll();
    });
  }

  updateSingle<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.updateMultiple({ [key]: value } as Partial<Settings>);
  }
}
