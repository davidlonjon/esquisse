import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ElectronAPI } from '@shared/ipc';
import type { Result, Settings, UpdateSettingsInput } from '@shared/types';

import { settingsService } from './settings.service';

describe('settings.service.ts - Settings Service', () => {
  let mockApi: Partial<ElectronAPI>;
  let originalWindowApi: ElectronAPI | undefined;

  beforeEach(() => {
    originalWindowApi = window.api;

    mockApi = {
      getSettings: vi.fn(),
      setSettings: vi.fn(),
    };

    window.api = mockApi as ElectronAPI;
  });

  afterEach(() => {
    if (originalWindowApi) {
      window.api = originalWindowApi;
    } else {
      delete (window as { api?: ElectronAPI }).api;
    }
  });

  describe('get', () => {
    it('should return default settings', async () => {
      const mockSettings: Settings = {
        theme: 'system',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      const result: Result<Settings> = {
        ok: true,
        data: mockSettings,
      };

      vi.mocked(mockApi.getSettings!).mockResolvedValue(result);

      const settings = await settingsService.get();

      expect(mockApi.getSettings).toHaveBeenCalledWith();
      expect(settings).toEqual(mockSettings);
    });

    it('should return custom settings', async () => {
      const mockSettings: Settings = {
        theme: 'dark',
        fontSize: 20,
        fontFamily: 'Monaco',
        autoSave: false,
        autoSaveInterval: 60000,
        language: 'fr',
      };

      const result: Result<Settings> = {
        ok: true,
        data: mockSettings,
      };

      vi.mocked(mockApi.getSettings!).mockResolvedValue(result);

      const settings = await settingsService.get();

      expect(settings).toEqual(mockSettings);
    });

    it('should throw error on failure', async () => {
      const result: Result<Settings> = {
        ok: false,
        error: {
          message: 'Failed to fetch settings',
        },
      };

      vi.mocked(mockApi.getSettings!).mockResolvedValue(result);

      await expect(settingsService.get()).rejects.toThrow('Failed to fetch settings');
    });

    it('should call getSettings without parameters', async () => {
      const mockSettings: Settings = {
        theme: 'system',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      const result: Result<Settings> = {
        ok: true,
        data: mockSettings,
      };

      vi.mocked(mockApi.getSettings!).mockResolvedValue(result);

      await settingsService.get();

      expect(mockApi.getSettings).toHaveBeenCalledTimes(1);
      expect(mockApi.getSettings).toHaveBeenCalledWith();
    });
  });

  describe('update', () => {
    it('should update single setting', async () => {
      const updates: UpdateSettingsInput = {
        theme: 'dark',
      };

      const mockSettings: Settings = {
        theme: 'dark',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      const result: Result<Settings> = {
        ok: true,
        data: mockSettings,
      };

      vi.mocked(mockApi.setSettings!).mockResolvedValue(result);

      const settings = await settingsService.update(updates);

      expect(mockApi.setSettings).toHaveBeenCalledWith(updates);
      expect(settings.theme).toBe('dark');
    });

    it('should update multiple settings', async () => {
      const updates: UpdateSettingsInput = {
        theme: 'dark',
        fontSize: 20,
        language: 'fr',
      };

      const mockSettings: Settings = {
        theme: 'dark',
        fontSize: 20,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'fr',
      };

      const result: Result<Settings> = {
        ok: true,
        data: mockSettings,
      };

      vi.mocked(mockApi.setSettings!).mockResolvedValue(result);

      const settings = await settingsService.update(updates);

      expect(settings).toEqual(mockSettings);
    });

    it('should update theme setting', async () => {
      const updates: UpdateSettingsInput = {
        theme: 'light',
      };

      const mockSettings: Settings = {
        theme: 'light',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      const result: Result<Settings> = {
        ok: true,
        data: mockSettings,
      };

      vi.mocked(mockApi.setSettings!).mockResolvedValue(result);

      const settings = await settingsService.update(updates);

      expect(settings.theme).toBe('light');
    });

    it('should update fontSize setting', async () => {
      const updates: UpdateSettingsInput = {
        fontSize: 24,
      };

      const mockSettings: Settings = {
        theme: 'system',
        fontSize: 24,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      const result: Result<Settings> = {
        ok: true,
        data: mockSettings,
      };

      vi.mocked(mockApi.setSettings!).mockResolvedValue(result);

      const settings = await settingsService.update(updates);

      expect(settings.fontSize).toBe(24);
    });

    it('should update fontFamily setting', async () => {
      const updates: UpdateSettingsInput = {
        fontFamily: 'Consolas',
      };

      const mockSettings: Settings = {
        theme: 'system',
        fontSize: 16,
        fontFamily: 'Consolas',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      const result: Result<Settings> = {
        ok: true,
        data: mockSettings,
      };

      vi.mocked(mockApi.setSettings!).mockResolvedValue(result);

      const settings = await settingsService.update(updates);

      expect(settings.fontFamily).toBe('Consolas');
    });

    it('should update autoSave setting', async () => {
      const updates: UpdateSettingsInput = {
        autoSave: false,
      };

      const mockSettings: Settings = {
        theme: 'system',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: false,
        autoSaveInterval: 30000,
        language: 'en',
      };

      const result: Result<Settings> = {
        ok: true,
        data: mockSettings,
      };

      vi.mocked(mockApi.setSettings!).mockResolvedValue(result);

      const settings = await settingsService.update(updates);

      expect(settings.autoSave).toBe(false);
    });

    it('should update autoSaveInterval setting', async () => {
      const updates: UpdateSettingsInput = {
        autoSaveInterval: 45000,
      };

      const mockSettings: Settings = {
        theme: 'system',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 45000,
        language: 'en',
      };

      const result: Result<Settings> = {
        ok: true,
        data: mockSettings,
      };

      vi.mocked(mockApi.setSettings!).mockResolvedValue(result);

      const settings = await settingsService.update(updates);

      expect(settings.autoSaveInterval).toBe(45000);
    });

    it('should update language setting', async () => {
      const updates: UpdateSettingsInput = {
        language: 'fr',
      };

      const mockSettings: Settings = {
        theme: 'system',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'fr',
      };

      const result: Result<Settings> = {
        ok: true,
        data: mockSettings,
      };

      vi.mocked(mockApi.setSettings!).mockResolvedValue(result);

      const settings = await settingsService.update(updates);

      expect(settings.language).toBe('fr');
    });

    it('should handle empty update object', async () => {
      const updates: UpdateSettingsInput = {};

      const mockSettings: Settings = {
        theme: 'system',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      const result: Result<Settings> = {
        ok: true,
        data: mockSettings,
      };

      vi.mocked(mockApi.setSettings!).mockResolvedValue(result);

      const settings = await settingsService.update(updates);

      expect(mockApi.setSettings).toHaveBeenCalledWith({});
      expect(settings).toEqual(mockSettings);
    });

    it('should throw error on update failure', async () => {
      const updates: UpdateSettingsInput = {
        theme: 'dark',
      };

      const result: Result<Settings> = {
        ok: false,
        error: {
          message: 'Update failed',
          code: 'UPDATE_ERROR',
        },
      };

      vi.mocked(mockApi.setSettings!).mockResolvedValue(result);

      await expect(settingsService.update(updates)).rejects.toThrow('Update failed (UPDATE_ERROR)');
    });
  });

  describe('Integration Tests', () => {
    it('should support get and update workflow', async () => {
      const defaultSettings: Settings = {
        theme: 'system',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      const updatedSettings: Settings = {
        theme: 'dark',
        fontSize: 20,
        fontFamily: 'Monaco',
        autoSave: false,
        autoSaveInterval: 60000,
        language: 'fr',
      };

      // Get initial settings
      vi.mocked(mockApi.getSettings!).mockResolvedValue({
        ok: true,
        data: defaultSettings,
      });

      const initial = await settingsService.get();
      expect(initial).toEqual(defaultSettings);

      // Update settings
      vi.mocked(mockApi.setSettings!).mockResolvedValue({
        ok: true,
        data: updatedSettings,
      });

      const updated = await settingsService.update({
        theme: 'dark',
        fontSize: 20,
        fontFamily: 'Monaco',
        autoSave: false,
        autoSaveInterval: 60000,
        language: 'fr',
      });
      expect(updated).toEqual(updatedSettings);

      // Get updated settings
      vi.mocked(mockApi.getSettings!).mockResolvedValue({
        ok: true,
        data: updatedSettings,
      });

      const final = await settingsService.get();
      expect(final).toEqual(updatedSettings);
    });

    it('should handle partial updates preserving other settings', async () => {
      const initialSettings: Settings = {
        theme: 'system',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      const partiallyUpdated: Settings = {
        theme: 'dark',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      vi.mocked(mockApi.getSettings!).mockResolvedValue({
        ok: true,
        data: initialSettings,
      });

      await settingsService.get();

      vi.mocked(mockApi.setSettings!).mockResolvedValue({
        ok: true,
        data: partiallyUpdated,
      });

      const updated = await settingsService.update({ theme: 'dark' });
      expect(updated.theme).toBe('dark');
      expect(updated.fontSize).toBe(16); // Preserved
      expect(updated.language).toBe('en'); // Preserved
    });
  });
});
