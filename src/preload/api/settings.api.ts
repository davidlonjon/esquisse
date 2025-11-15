/**
 * Settings API for preload
 * Exposes settings operations to the renderer process
 */

import { ipcRenderer } from 'electron';

import { IPC_CHANNELS } from '@shared/ipc';
import type { Settings, UpdateSettingsInput, Result } from '@shared/types';

export const settingsAPI = {
  getSettings: (): Promise<Result<Settings>> => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),

  setSettings: (settings: UpdateSettingsInput): Promise<Result<Settings>> =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, settings),
};
