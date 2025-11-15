import { create } from 'zustand';

import { settingsService } from '@services/settings.service';
import type { Settings, UpdateSettingsInput } from '@shared/types';

import type { RequestState } from '../../store/utils';
import { withRequestStatus } from '../../store/utils';

interface SettingsState extends Settings, RequestState {
  isSaving: boolean;
  loadSettings: () => Promise<Settings>;
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

let hasLoadedSettings = false;

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,
  status: 'idle',
  error: null,
  isSaving: false,

  loadSettings: async () => {
    if (hasLoadedSettings) {
      const { theme, fontSize, fontFamily, autoSave, autoSaveInterval, language } = get();
      return { theme, fontSize, fontFamily, autoSave, autoSaveInterval, language };
    }

    return withRequestStatus(set, async () => {
      const settings = await settingsService.get();
      set({ ...settings });
      hasLoadedSettings = true;
      return settings;
    });
  },

  updateSettings: async (updates) =>
    withRequestStatus(set, async () => {
      set({ isSaving: true });
      try {
        const settings = await settingsService.update(updates);
        set({ ...settings, isSaving: false });
        return settings;
      } catch (error) {
        set({ isSaving: false });
        throw error;
      }
    }),
}));
