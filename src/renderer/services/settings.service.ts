import type { Settings, UpdateSettingsInput } from '@shared/types';
import { UpdateSettingsInputSchema } from '@shared/types';

import { getWindowAPI, resolveResult } from './utils';

export const settingsService = {
  async get(): Promise<Settings> {
    const api = getWindowAPI();
    return resolveResult(await api.getSettings());
  },

  async update(updates: UpdateSettingsInput): Promise<Settings> {
    const validated = UpdateSettingsInputSchema.parse(updates);
    const api = getWindowAPI();
    return resolveResult(await api.setSettings(validated));
  },
};
