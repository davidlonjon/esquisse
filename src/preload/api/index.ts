/**
 * Preload API exports
 * Aggregates all API modules for the preload script
 */

import type { ElectronAPI } from '@shared/ipc';

import { backupAPI } from './backup.api';
import { entryAPI } from './entry.api';
import { journalAPI } from './journal.api';
import { settingsAPI } from './settings.api';
import { windowAPI } from './window.api';

/**
 * Complete Electron API exposed to the renderer process
 */
export const electronAPI: ElectronAPI = {
  ...journalAPI,
  ...entryAPI,
  ...settingsAPI,
  ...backupAPI,
  ...windowAPI,
};
