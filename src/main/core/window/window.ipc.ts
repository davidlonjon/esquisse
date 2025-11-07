/**
 * Window IPC Handlers
 * Handles window control operations (minimize, maximize, close)
 */

import { ipcMain } from 'electron';

import { IPC_CHANNELS } from '@shared/ipc-types';

import { closeMainWindow, getMainWindow } from './window-manager';

/**
 * Register all window-related IPC handlers
 */
export function registerWindowHandlers(): void {
  // Minimize window
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    const window = getMainWindow();
    window?.minimize();
  });

  // Toggle maximize/unmaximize
  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    const window = getMainWindow();
    if (window?.isMaximized()) {
      window.unmaximize();
    } else {
      window?.maximize();
    }
  });

  // Close window
  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    closeMainWindow();
  });
}
