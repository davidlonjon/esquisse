import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getTestDatabase, useDatabaseTest, queryOne } from '@test/helpers/database.helper';

import { getSettings, setSettings, getSetting, setSetting } from './settings';

import * as indexModule from './index';

// Mock the database module
vi.mock('./index', async () => {
  const actual = await vi.importActual('./index');
  return {
    ...actual,
    getDatabase: vi.fn(),
    withTransaction: vi.fn(),
  };
});

describe('settings.ts - Database Settings Operations', () => {
  useDatabaseTest();

  beforeEach(() => {
    const db = getTestDatabase();
    vi.mocked(indexModule.getDatabase).mockReturnValue(db);
    // Mock withTransaction to execute the callback with the test database
    vi.mocked(indexModule.withTransaction).mockImplementation((fn) => {
      return fn(db);
    });
  });

  describe('getSettings', () => {
    it('should return default settings when no settings exist', () => {
      const settings = getSettings();

      expect(settings).toEqual({
        theme: 'system',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      });
    });

    it('should merge stored settings with defaults', () => {
      const db = getTestDatabase();

      // Insert a single setting
      db.prepare(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)`).run(
        'theme',
        JSON.stringify('dark'),
        new Date().toISOString()
      );

      const settings = getSettings();

      expect(settings).toMatchObject({
        theme: 'dark',
        fontSize: 16, // Default
        fontFamily: 'system-ui', // Default
        autoSave: true, // Default
        autoSaveInterval: 30000, // Default
        language: 'en', // Default
      });
    });

    it('should parse JSON values correctly', () => {
      const db = getTestDatabase();
      const now = new Date().toISOString();

      db.prepare(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)`).run(
        'fontSize',
        JSON.stringify(20),
        now
      );
      db.prepare(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)`).run(
        'autoSave',
        JSON.stringify(false),
        now
      );

      const settings = getSettings();

      expect(settings.fontSize).toBe(20);
      expect(settings.autoSave).toBe(false);
      expect(typeof settings.fontSize).toBe('number');
      expect(typeof settings.autoSave).toBe('boolean');
    });

    it('should handle all settings being customized', () => {
      const db = getTestDatabase();
      const now = new Date().toISOString();
      const customSettings = {
        theme: 'light',
        fontSize: 18,
        fontFamily: 'Monaco',
        autoSave: false,
        autoSaveInterval: 60000,
        language: 'fr',
      };

      Object.entries(customSettings).forEach(([key, value]) => {
        db.prepare(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)`).run(
          key,
          JSON.stringify(value),
          now
        );
      });

      const settings = getSettings();

      expect(settings).toEqual(customSettings);
    });

    it('should handle malformed JSON gracefully', () => {
      const db = getTestDatabase();
      const now = new Date().toISOString();

      // Insert non-JSON value (should fall back to raw value)
      db.prepare(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)`).run(
        'theme',
        'dark',
        now
      );

      const settings = getSettings();

      expect(settings.theme).toBe('dark');
    });
  });

  describe('setSettings', () => {
    it('should set a single setting', () => {
      const result = setSettings({ theme: 'dark' });

      expect(result.theme).toBe('dark');
      expect(result.fontSize).toBe(16); // Default remains
    });

    it('should set multiple settings', () => {
      const result = setSettings({
        theme: 'dark',
        fontSize: 20,
        language: 'fr',
      });

      expect(result).toMatchObject({
        theme: 'dark',
        fontSize: 20,
        language: 'fr',
        fontFamily: 'system-ui', // Default
        autoSave: true, // Default
        autoSaveInterval: 30000, // Default
      });
    });

    it('should persist settings to database', () => {
      setSettings({ theme: 'dark', fontSize: 18 });

      const settings = getSettings();

      expect(settings.theme).toBe('dark');
      expect(settings.fontSize).toBe(18);
    });

    it('should update existing settings', () => {
      setSettings({ theme: 'dark' });
      const updated = setSettings({ theme: 'light' });

      expect(updated.theme).toBe('light');
    });

    it('should handle INSERT OR REPLACE correctly', () => {
      const db = getTestDatabase();

      // First insert
      setSettings({ theme: 'dark' });
      let row = queryOne(db, `SELECT value FROM settings WHERE key = ?`, ['theme']);
      expect(JSON.parse(row?.value as string)).toBe('dark');

      // Replace
      setSettings({ theme: 'light' });
      row = queryOne(db, `SELECT value FROM settings WHERE key = ?`, ['theme']);
      expect(JSON.parse(row?.value as string)).toBe('light');

      // Should only have one row for theme
      const result = db.prepare(`SELECT COUNT(*) as count FROM settings WHERE key = ?`).get('theme') as {
        count: number;
      };
      expect(result.count).toBe(1);
    });

    it('should store values as JSON strings', () => {
      const db = getTestDatabase();
      setSettings({ fontSize: 20, autoSave: false });

      const fontSizeRow = queryOne(db, `SELECT value FROM settings WHERE key = ?`, ['fontSize']);
      const autoSaveRow = queryOne(db, `SELECT value FROM settings WHERE key = ?`, ['autoSave']);

      expect(fontSizeRow?.value).toBe('20');
      expect(autoSaveRow?.value).toBe('false');
      expect(JSON.parse(fontSizeRow?.value as string)).toBe(20);
      expect(JSON.parse(autoSaveRow?.value as string)).toBe(false);
    });

    it('should set updated_at timestamp', () => {
      const beforeSet = new Date().toISOString();
      setSettings({ theme: 'dark' });
      const afterSet = new Date().toISOString();

      const db = getTestDatabase();
      const row = queryOne(db, `SELECT updated_at FROM settings WHERE key = ?`, ['theme']);

      expect(row?.updated_at).toBeDefined();
      const timestamp = row?.updated_at as string;
      expect(timestamp >= beforeSet).toBe(true);
      expect(timestamp <= afterSet).toBe(true);
    });

    it('should handle boolean values', () => {
      const result = setSettings({ autoSave: false });

      expect(result.autoSave).toBe(false);
      expect(typeof result.autoSave).toBe('boolean');
    });

    it('should handle number values', () => {
      const result = setSettings({ fontSize: 24, autoSaveInterval: 45000 });

      expect(result.fontSize).toBe(24);
      expect(result.autoSaveInterval).toBe(45000);
      expect(typeof result.fontSize).toBe('number');
      expect(typeof result.autoSaveInterval).toBe('number');
    });

    it('should handle string values', () => {
      const result = setSettings({ theme: 'light', fontFamily: 'Consolas', language: 'fr' });

      expect(result.theme).toBe('light');
      expect(result.fontFamily).toBe('Consolas');
      expect(result.language).toBe('fr');
      expect(typeof result.theme).toBe('string');
    });
  });

  describe('getSetting', () => {
    it('should get a specific setting that exists', () => {
      setSettings({ theme: 'dark' });
      const theme = getSetting('theme');

      expect(theme).toBe('dark');
    });

    it('should return default value for non-existent setting', () => {
      const theme = getSetting('theme');

      expect(theme).toBe('system');
    });

    it('should handle all setting types correctly', () => {
      setSettings({
        theme: 'light',
        fontSize: 18,
        fontFamily: 'Monaco',
        autoSave: false,
        autoSaveInterval: 45000,
        language: 'fr',
      });

      expect(getSetting('theme')).toBe('light');
      expect(getSetting('fontSize')).toBe(18);
      expect(getSetting('fontFamily')).toBe('Monaco');
      expect(getSetting('autoSave')).toBe(false);
      expect(getSetting('autoSaveInterval')).toBe(45000);
      expect(getSetting('language')).toBe('fr');
    });
  });

  describe('setSetting', () => {
    it('should set a specific setting', () => {
      setSetting('theme', 'dark');
      const theme = getSetting('theme');

      expect(theme).toBe('dark');
    });

    it('should update existing setting', () => {
      setSetting('fontSize', 18);
      setSetting('fontSize', 22);

      expect(getSetting('fontSize')).toBe(22);
    });

    it('should preserve other settings', () => {
      setSetting('theme', 'dark');
      setSetting('fontSize', 20);

      expect(getSetting('theme')).toBe('dark');
      expect(getSetting('fontSize')).toBe(20);
      expect(getSetting('language')).toBe('en'); // Default
    });

    it('should handle all setting types', () => {
      setSetting('theme', 'light');
      setSetting('fontSize', 24);
      setSetting('autoSave', false);

      expect(getSetting('theme')).toBe('light');
      expect(getSetting('fontSize')).toBe(24);
      expect(getSetting('autoSave')).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should support complex workflow', () => {
      // Start with defaults
      const initial = getSettings();
      expect(initial.theme).toBe('system');

      // Update some settings
      setSettings({ theme: 'dark', fontSize: 18 });

      // Get individual setting
      expect(getSetting('theme')).toBe('dark');

      // Update via setSetting
      setSetting('language', 'fr');

      // Verify all settings
      const final = getSettings();
      expect(final).toEqual({
        theme: 'dark',
        fontSize: 18,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'fr',
      });
    });

    it('should maintain consistency across multiple updates', () => {
      // Multiple sequential updates
      setSettings({ theme: 'dark' });
      setSettings({ fontSize: 18 });
      setSettings({ language: 'fr' });

      const settings = getSettings();

      expect(settings.theme).toBe('dark');
      expect(settings.fontSize).toBe(18);
      expect(settings.language).toBe('fr');
    });

    it('should handle rapid updates to same setting', () => {
      setSetting('theme', 'dark');
      setSetting('theme', 'light');
      setSetting('theme', 'system');

      expect(getSetting('theme')).toBe('system');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty update object', () => {
      const result = setSettings({});

      // Should return defaults since nothing was updated
      expect(result).toEqual({
        theme: 'system',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      });
    });

    it('should handle setting values to their defaults', () => {
      setSettings({ theme: 'dark' });
      const result = setSettings({ theme: 'system' });

      expect(result.theme).toBe('system');
    });

    it('should handle minimum and maximum reasonable values', () => {
      setSettings({ fontSize: 8, autoSaveInterval: 1000 });
      let settings = getSettings();
      expect(settings.fontSize).toBe(8);
      expect(settings.autoSaveInterval).toBe(1000);

      setSettings({ fontSize: 72, autoSaveInterval: 300000 });
      settings = getSettings();
      expect(settings.fontSize).toBe(72);
      expect(settings.autoSaveInterval).toBe(300000);
    });
  });
});
