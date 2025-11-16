import { create } from 'zustand';

import { settingsService } from '@services/settings.service';
import type { Settings, UpdateSettingsInput } from '@shared/types';

import {
  createAsyncSlice,
  getErrorMessage,
  toAsyncSlice,
  type AsyncSlice,
} from '../../store/utils';

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

export const useSettingsStore = create<SettingsState>((set, get) => ({
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

    set((state) => ({
      progress: { ...state.progress, load: toAsyncSlice('loading') },
    }));

    try {
      const settings = await settingsService.get();
      set((state) => ({
        ...state,
        ...settings,
        hasLoaded: true,
        progress: { ...state.progress, load: toAsyncSlice('success') },
      }));
      return settings;
    } catch (error) {
      const message = getErrorMessage(error);
      set((state) => ({
        progress: { ...state.progress, load: toAsyncSlice('error', message) },
      }));
      throw error;
    }
  },

  updateSettings: async (updates) => {
    set((state) => ({
      progress: { ...state.progress, save: toAsyncSlice('loading') },
    }));

    try {
      const settings = await settingsService.update(updates);
      set((state) => ({
        ...state,
        ...settings,
        progress: { ...state.progress, save: toAsyncSlice('success') },
      }));
      return settings;
    } catch (error) {
      const message = getErrorMessage(error);
      set((state) => ({
        progress: { ...state.progress, save: toAsyncSlice('error', message) },
      }));
      throw error;
    }
  },
}));

export const selectSettings = (state: SettingsState): Settings => pickSettings(state);
export const selectSettingsProgress = (state: SettingsState) => state.progress;

export const selectAppearanceSettings = (state: SettingsState) => ({
  theme: state.theme,
  language: state.language,
});

export const selectEditorSettings = (state: SettingsState) => ({
  fontSize: state.fontSize,
  fontFamily: state.fontFamily,
});

export const selectAutosaveSettings = (state: SettingsState) => ({
  autoSave: state.autoSave,
  autoSaveInterval: state.autoSaveInterval,
});
