import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { Settings } from '@shared/ipc-types';

interface SettingsState extends Settings {
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default settings
      theme: 'system',
      fontSize: 16,
      fontFamily: 'system-ui',
      autoSave: true,
      autoSaveInterval: 30000,
      isLoading: false,
      error: null,

      loadSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const settings = await window.api.getSettings();
          set({ ...settings, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      updateSettings: async (updates) => {
        set({ isLoading: true, error: null });
        try {
          const settings = await window.api.setSettings(updates);
          set({ ...settings, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },
    }),
    {
      name: 'esquisse-settings',
    }
  )
);
