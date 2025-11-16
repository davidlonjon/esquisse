import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { settingsService } from '@services/settings.service';
import type { Settings, UpdateSettingsInput } from '@shared/types';

import { selectSettings, selectSettingsProgress, useSettingsStore } from './settings.store';

vi.mock('@services/settings.service', () => ({
  settingsService: {
    get: vi.fn(),
    update: vi.fn(),
  },
}));

const mockedSettingsService = vi.mocked(settingsService);
const initialState = useSettingsStore.getState();

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState(initialState, true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadSettings', () => {
    it('loads settings and updates state', async () => {
      const settings: Settings = {
        theme: 'dark',
        fontSize: 18,
        fontFamily: 'Monaco',
        autoSave: false,
        autoSaveInterval: 60000,
        language: 'fr',
      };

      mockedSettingsService.get.mockResolvedValue(settings);

      await useSettingsStore.getState().loadSettings();

      const state = useSettingsStore.getState();
      expect(state.theme).toBe('dark');
      expect(state.fontSize).toBe(18);
      expect(state.hasLoaded).toBe(true);
      expect(state.progress.load.status).toBe('success');
    });

    it('only loads once unless force option is used', async () => {
      const settings: Settings = {
        theme: 'dark',
        fontSize: 18,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      mockedSettingsService.get.mockResolvedValue(settings);

      await useSettingsStore.getState().loadSettings();
      await useSettingsStore.getState().loadSettings();

      expect(mockedSettingsService.get).toHaveBeenCalledTimes(1);
    });

    it('reloads when force option is true', async () => {
      const settings: Settings = {
        theme: 'dark',
        fontSize: 18,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      mockedSettingsService.get.mockResolvedValue(settings);

      await useSettingsStore.getState().loadSettings();
      await useSettingsStore.getState().loadSettings({ force: true });

      expect(mockedSettingsService.get).toHaveBeenCalledTimes(2);
    });

    it('records error state when load fails', async () => {
      mockedSettingsService.get.mockRejectedValue(new Error('load failed'));

      await expect(useSettingsStore.getState().loadSettings()).rejects.toThrow('load failed');

      const state = useSettingsStore.getState();
      expect(state.progress.load.status).toBe('error');
      expect(state.progress.load.error).toBe('load failed');
    });
  });

  describe('updateSettings', () => {
    it('updates settings and state', async () => {
      const updates: UpdateSettingsInput = {
        theme: 'dark',
        fontSize: 20,
      };

      const updatedSettings: Settings = {
        theme: 'dark',
        fontSize: 20,
        fontFamily: 'system-ui',
        autoSave: true,
        autoSaveInterval: 30000,
        language: 'en',
      };

      mockedSettingsService.update.mockResolvedValue(updatedSettings);

      await useSettingsStore.getState().updateSettings(updates);

      const state = useSettingsStore.getState();
      expect(state.theme).toBe('dark');
      expect(state.fontSize).toBe(20);
      expect(state.progress.save.status).toBe('success');
    });

    it('records error state when update fails', async () => {
      mockedSettingsService.update.mockRejectedValue(new Error('update failed'));

      const updates: UpdateSettingsInput = { theme: 'dark' };

      await expect(useSettingsStore.getState().updateSettings(updates)).rejects.toThrow(
        'update failed'
      );

      const state = useSettingsStore.getState();
      expect(state.progress.save.status).toBe('error');
      expect(state.progress.save.error).toBe('update failed');
    });
  });

  describe('Selectors', () => {
    it('selectSettings returns settings object', () => {
      useSettingsStore.setState({
        theme: 'dark',
        fontSize: 20,
        fontFamily: 'Monaco',
        autoSave: false,
        autoSaveInterval: 60000,
        language: 'fr',
      });

      const result = selectSettings(useSettingsStore.getState());
      expect(result).toEqual({
        theme: 'dark',
        fontSize: 20,
        fontFamily: 'Monaco',
        autoSave: false,
        autoSaveInterval: 60000,
        language: 'fr',
      });
    });

    it('selectSettingsProgress returns progress state', () => {
      const result = selectSettingsProgress(useSettingsStore.getState());
      expect(result).toHaveProperty('load');
      expect(result).toHaveProperty('save');
    });
  });
});
