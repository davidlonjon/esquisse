import type { Settings, UpdateSettingsInput } from '@shared/types';

import { getWindowAPI } from './utils';

export const settingsService = {
  async get(): Promise<Settings> {
    const api = getWindowAPI();
    return api.getSettings();
  },

  async update(updates: UpdateSettingsInput): Promise<Settings> {
    const api = getWindowAPI();
    return api.setSettings(updates);
  },
};
