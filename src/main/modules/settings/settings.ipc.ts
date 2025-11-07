/**
 * Settings IPC Handlers
 * Handles settings-related IPC communication between renderer and main process
 */

import { ipcMain } from 'electron';

import { IPC_CHANNELS } from '@shared/ipc-types';

import * as settingsDb from '../../database/settings';

/**
 * Register all settings-related IPC handlers
 */
export function registerSettingsHandlers(): void {
  // Get all settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => {
    return settingsDb.getSettings();
  });

  // Set settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_event, settings) => {
    return settingsDb.setSettings(settings);
  });
}
