import { app, BrowserWindow } from 'electron';

import started from 'electron-squirrel-startup';

import { createMainWindow, registerWindowHandlers } from './core/window';
import { initializeDatabase, closeDatabase } from './database';
import { logger } from './logger';
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

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { message: error.message, stack: error.stack });
});

async function initializeDatabaseWithRetry(maxRetries = 3, delayMs = 1000): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await initializeDatabase();
      return;
    } catch (error) {
      logger.error('Database initialization failed', { attempt, error: (error as Error).message });
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
}

async function bootstrap(): Promise<void> {
  try {
    await app.whenReady();
    await initializeDatabaseWithRetry();
    registerIPCHandlers();
    createMainWindow(MAIN_WINDOW_VITE_DEV_SERVER_URL, MAIN_WINDOW_VITE_NAME);
  } catch (error) {
    logger.error('Bootstrap failure', { error: (error as Error).message });
    app.quit();
  }
}

if (!started) {
  void bootstrap();
}

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
