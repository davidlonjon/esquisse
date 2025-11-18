import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { createAsyncSlice, withAsyncHandler, type AsyncSlice } from '@lib/store';
import { settingsService } from '@services/settings.service';
import type { Settings, UpdateSettingsInput } from '@shared/types';

interface SettingsProgressState {
  load: AsyncSlice;
  save: AsyncSlice;
}

interface SettingsState extends Settings {
  hasLoaded: boolean;
  progress: SettingsProgressState;
  loadSettings: (options?: { force?: boolean }) => Promise<Settings>;
  updateSettings: (settings: UpdateSettingsInput) => Promise<Settings>;
}

const defaultSettings: Settings = {
  theme: 'system',
  fontSize: 16,
  fontFamily: 'system-ui',
  autoSave: true,
  autoSaveInterval: 30000,
  language: 'en',
};

const pickSettings = (state: SettingsState): Settings => ({
  theme: state.theme,
  fontSize: state.fontSize,
  fontFamily: state.fontFamily,
  autoSave: state.autoSave,
  autoSaveInterval: state.autoSaveInterval,
  language: state.language,
});

export const useSettingsStore = create(
  immer<SettingsState>((set, get) => ({
    ...defaultSettings,
    hasLoaded: false,
    progress: {
      load: createAsyncSlice(),
      save: createAsyncSlice(),
    },

    loadSettings: async (options) => {
      if (get().hasLoaded && !options?.force) {
        return pickSettings(get());
      }

      return withAsyncHandler(set, 'load', async () => {
        const settings = await settingsService.get();
        set((state) => {
          Object.assign(state, settings);
          state.hasLoaded = true;
        });
        return settings;
      });
    },

    updateSettings: async (updates) => {
      return withAsyncHandler(set, 'save', async () => {
        const settings = await settingsService.update(updates);
        set((state) => {
          Object.assign(state, settings);
        });
        return settings;
      });
    },
  }))
);

export const selectSettings = (state: SettingsState): Settings => pickSettings(state);
export const selectSettingsProgress = (state: SettingsState) => state.progress;
