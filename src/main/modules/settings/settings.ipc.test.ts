import { describe, it, expect, vi, beforeEach } from 'vitest';

import { IPC_CHANNELS } from '@shared/ipc';
import type { Settings } from '@shared/types';

import * as settingsDb from '../../database/settings';

// Mock the database module
vi.mock('../../database/settings');

// Mock the safe handler registration
const mockHandlers = new Map<string, (...args: unknown[]) => unknown>();
vi.mock('../../ipc/safe-handler', () => ({
  registerSafeHandler: vi.fn(
    (channel: string, _schema: unknown, handler: (...args: unknown[]) => unknown) => {
      mockHandlers.set(channel, handler);
    }
  ),
}));

// Import after mocks are set up
import { registerSettingsHandlers } from './settings.ipc';

describe('settings.ipc.ts - Settings IPC Handlers', () => {
  const mockEvent = {} as never;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHandlers.clear();
    registerSettingsHandlers();
  });

  describe('registerSettingsHandlers', () => {
    it('should register all settings IPC handlers', () => {
      expect(mockHandlers.size).toBe(2);
      expect(mockHandlers.has(IPC_CHANNELS.SETTINGS_GET)).toBe(true);
      expect(mockHandlers.has(IPC_CHANNELS.SETTINGS_SET)).toBe(true);
    });
  });

  describe('SETTINGS_GET handler', () => {
    it('should return default settings', async () => {
      const mockSettings: Settings = {
        theme: 'system',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      vi.mocked(settingsDb.getSettings).mockReturnValue(mockSettings);

      const handler = mockHandlers.get(IPC_CHANNELS.SETTINGS_GET)!;
      const result = await handler(mockEvent, []);

      expect(settingsDb.getSettings).toHaveBeenCalledWith();
      expect(result).toEqual(mockSettings);
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

      vi.mocked(settingsDb.getSettings).mockReturnValue(mockSettings);

      const handler = mockHandlers.get(IPC_CHANNELS.SETTINGS_GET)!;
      const result = await handler(mockEvent, []);

      expect(result).toEqual(mockSettings);
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

      vi.mocked(settingsDb.getSettings).mockReturnValue(mockSettings);

      const handler = mockHandlers.get(IPC_CHANNELS.SETTINGS_GET)!;
      await handler(mockEvent, []);

      expect(settingsDb.getSettings).toHaveBeenCalledTimes(1);
      expect(settingsDb.getSettings).toHaveBeenCalledWith();
    });
  });

  describe('SETTINGS_SET handler', () => {
    it('should update single setting', async () => {
      const mockSettings: Settings = {
        theme: 'dark',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      vi.mocked(settingsDb.setSettings).mockReturnValue(mockSettings);

      const handler = mockHandlers.get(IPC_CHANNELS.SETTINGS_SET)!;
      const result = await handler(mockEvent, [{ theme: 'dark' }]);

      expect(settingsDb.setSettings).toHaveBeenCalledWith({ theme: 'dark' });
      expect(result).toEqual(mockSettings);
    });

    it('should update multiple settings', async () => {
      const mockSettings: Settings = {
        theme: 'dark',
        fontSize: 20,
        fontFamily: 'Monaco',
        autoSave: false,
        autoSaveInterval: 60000,
        language: 'fr',
      };

      vi.mocked(settingsDb.setSettings).mockReturnValue(mockSettings);

      const handler = mockHandlers.get(IPC_CHANNELS.SETTINGS_SET)!;
      const result = await handler(mockEvent, [
        {
          theme: 'dark',
          fontSize: 20,
          fontFamily: 'Monaco',
          autoSave: false,
          autoSaveInterval: 60000,
          language: 'fr',
        },
      ]);

      expect(settingsDb.setSettings).toHaveBeenCalledWith({
        theme: 'dark',
        fontSize: 20,
        fontFamily: 'Monaco',
        autoSave: false,
        autoSaveInterval: 60000,
        language: 'fr',
      });
      expect(result).toEqual(mockSettings);
    });

    it('should update theme setting', async () => {
      const mockSettings: Settings = {
        theme: 'light',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      vi.mocked(settingsDb.setSettings).mockReturnValue(mockSettings);

      const handler = mockHandlers.get(IPC_CHANNELS.SETTINGS_SET)!;
      const result = (await handler(mockEvent, [{ theme: 'light' }])) as Settings;

      expect(settingsDb.setSettings).toHaveBeenCalledWith({ theme: 'light' });
      expect(result.theme).toBe('light');
    });

    it('should update fontSize setting', async () => {
      const mockSettings: Settings = {
        theme: 'system',
        fontSize: 24,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      vi.mocked(settingsDb.setSettings).mockReturnValue(mockSettings);

      const handler = mockHandlers.get(IPC_CHANNELS.SETTINGS_SET)!;
      const result = (await handler(mockEvent, [{ fontSize: 24 }])) as Settings;

      expect(settingsDb.setSettings).toHaveBeenCalledWith({ fontSize: 24 });
      expect(result.fontSize).toBe(24);
    });

    it('should update fontFamily setting', async () => {
      const mockSettings: Settings = {
        theme: 'system',
        fontSize: 16,
        fontFamily: 'Consolas',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      vi.mocked(settingsDb.setSettings).mockReturnValue(mockSettings);

      const handler = mockHandlers.get(IPC_CHANNELS.SETTINGS_SET)!;
      const result = (await handler(mockEvent, [{ fontFamily: 'Consolas' }])) as Settings;

      expect(settingsDb.setSettings).toHaveBeenCalledWith({ fontFamily: 'Consolas' });
      expect(result.fontFamily).toBe('Consolas');
    });

    it('should update autoSave setting', async () => {
      const mockSettings: Settings = {
        theme: 'system',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: false,
        autoSaveInterval: 30000,
        language: 'en',
      };

      vi.mocked(settingsDb.setSettings).mockReturnValue(mockSettings);

      const handler = mockHandlers.get(IPC_CHANNELS.SETTINGS_SET)!;
      const result = (await handler(mockEvent, [{ autoSave: false }])) as Settings;

      expect(settingsDb.setSettings).toHaveBeenCalledWith({ autoSave: false });
      expect(result.autoSave).toBe(false);
    });

    it('should update autoSaveInterval setting', async () => {
      const mockSettings: Settings = {
        theme: 'system',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 45000,
        language: 'en',
      };

      vi.mocked(settingsDb.setSettings).mockReturnValue(mockSettings);

      const handler = mockHandlers.get(IPC_CHANNELS.SETTINGS_SET)!;
      const result = (await handler(mockEvent, [{ autoSaveInterval: 45000 }])) as Settings;

      expect(settingsDb.setSettings).toHaveBeenCalledWith({ autoSaveInterval: 45000 });
      expect(result.autoSaveInterval).toBe(45000);
    });

    it('should update language setting', async () => {
      const mockSettings: Settings = {
        theme: 'system',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'fr',
      };

      vi.mocked(settingsDb.setSettings).mockReturnValue(mockSettings);

      const handler = mockHandlers.get(IPC_CHANNELS.SETTINGS_SET)!;
      const result = (await handler(mockEvent, [{ language: 'fr' }])) as Settings;

      expect(settingsDb.setSettings).toHaveBeenCalledWith({ language: 'fr' });
      expect(result.language).toBe('fr');
    });

    it('should handle empty update object', async () => {
      const mockSettings: Settings = {
        theme: 'system',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      vi.mocked(settingsDb.setSettings).mockReturnValue(mockSettings);

      const handler = mockHandlers.get(IPC_CHANNELS.SETTINGS_SET)!;
      const result = await handler(mockEvent, [{}]);

      expect(settingsDb.setSettings).toHaveBeenCalledWith({});
      expect(result).toEqual(mockSettings);
    });

    it('should handle partial updates preserving other settings', async () => {
      const mockSettings: Settings = {
        theme: 'dark',
        fontSize: 16,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      vi.mocked(settingsDb.setSettings).mockReturnValue(mockSettings);

      const handler = mockHandlers.get(IPC_CHANNELS.SETTINGS_SET)!;
      await handler(mockEvent, [{ theme: 'dark' }]);

      expect(settingsDb.setSettings).toHaveBeenCalledTimes(1);
      expect(settingsDb.setSettings).toHaveBeenCalledWith({ theme: 'dark' });
    });
  });

  describe('Error Handling', () => {
    it('should propagate database errors from getSettings', async () => {
      const error = new Error('Database error');
      vi.mocked(settingsDb.getSettings).mockImplementation(() => {
        throw error;
      });

      const handler = mockHandlers.get(IPC_CHANNELS.SETTINGS_GET)!;

      await expect(handler(mockEvent, [])).rejects.toThrow('Database error');
    });

    it('should propagate errors from setSettings', async () => {
      const error = new Error('Update failed');
      vi.mocked(settingsDb.setSettings).mockImplementation(() => {
        throw error;
      });

      const handler = mockHandlers.get(IPC_CHANNELS.SETTINGS_SET)!;

      await expect(handler(mockEvent, [{ theme: 'dark' }])).rejects.toThrow('Update failed');
    });
  });

  describe('Integration Tests', () => {
    it('should support getting and setting settings workflow', async () => {
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
      vi.mocked(settingsDb.getSettings).mockReturnValue(defaultSettings);
      const getHandler = mockHandlers.get(IPC_CHANNELS.SETTINGS_GET)!;
      const initial = await getHandler(mockEvent, []);
      expect(initial).toEqual(defaultSettings);

      // Update settings
      vi.mocked(settingsDb.setSettings).mockReturnValue(updatedSettings);
      const setHandler = mockHandlers.get(IPC_CHANNELS.SETTINGS_SET)!;
      const updated = await setHandler(mockEvent, [
        {
          theme: 'dark',
          fontSize: 20,
          fontFamily: 'Monaco',
          autoSave: false,
          autoSaveInterval: 60000,
          language: 'fr',
        },
      ]);
      expect(updated).toEqual(updatedSettings);

      // Get updated settings
      vi.mocked(settingsDb.getSettings).mockReturnValue(updatedSettings);
      const final = await getHandler(mockEvent, []);
      expect(final).toEqual(updatedSettings);
    });
  });
});
