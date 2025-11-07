import { app, BrowserWindow } from 'electron';

import started from 'electron-squirrel-startup';

import { createMainWindow, registerWindowHandlers } from './core/window';
import { initializeDatabase, closeDatabase } from './database';
import { registerEntryHandlers } from './modules/entry';
import { registerJournalHandlers } from './modules/journal';
import { registerSettingsHandlers } from './modules/settings';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

/**
 * Register all IPC handlers for the application
 */
function registerIPCHandlers(): void {
  registerWindowHandlers();
  registerJournalHandlers();
  registerEntryHandlers();
  registerSettingsHandlers();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', async () => {
  await initializeDatabase();
  registerIPCHandlers();
  createMainWindow(MAIN_WINDOW_VITE_DEV_SERVER_URL, MAIN_WINDOW_VITE_NAME);
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase();
    app.quit();
  }
});

// Clean up before quitting
app.on('before-quit', () => {
  closeDatabase();
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow(MAIN_WINDOW_VITE_DEV_SERVER_URL, MAIN_WINDOW_VITE_NAME);
  }
});
