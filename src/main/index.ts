import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';

import started from 'electron-squirrel-startup';

import { IPC_CHANNELS } from '../shared/ipc-types';

import { initializeDatabase, closeDatabase } from './database';
import * as entryDb from './database/entries';
import * as journalDb from './database/journals';
import * as settingsDb from './database/settings';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Create the browser window with better defaults for a journaling app
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // Security: don't expose Node.js to renderer
      contextIsolation: true, // Security: isolate context
    },
    titleBarStyle: 'hiddenInset', // Modern look on macOS
    show: false, // Don't show until ready-to-show
  });

  // Show window when ready (prevents flash of white)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Set Content Security Policy based on environment
  // In production: Strict CSP without unsafe directives
  // In development: Relaxed CSP to allow Vite HMR (Hot Module Replacement)
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const isProduction = !MAIN_WINDOW_VITE_DEV_SERVER_URL;

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isProduction
            ? // Strict CSP for production - no unsafe directives
              "default-src 'self'; " +
              "script-src 'self'; " +
              "style-src 'self' https://fonts.googleapis.com; " +
              "img-src 'self' data:; " +
              "font-src 'self' data: https://fonts.gstatic.com; " +
              "connect-src 'self';"
            : // Relaxed CSP for development - allows Vite HMR
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
              "img-src 'self' data:; " +
              "font-src 'self' data: https://fonts.gstatic.com; " +
              "connect-src 'self' ws: wss:;", // WebSocket for HMR
        ],
      },
    });
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open DevTools only in development
  if (process.env.NODE_ENV === 'development' || MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }
};

// Setup IPC handlers
function setupIPCHandlers() {
  // Window operations
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    mainWindow?.minimize();
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    mainWindow?.close();
  });

  // Database handlers will be implemented after SQLite setup
  // For now, we'll add placeholder handlers

  // Journal operations
  ipcMain.handle(IPC_CHANNELS.JOURNAL_CREATE, async (_event, journal) => {
    return journalDb.createJournal(journal);
  });

  ipcMain.handle(IPC_CHANNELS.JOURNAL_GET_ALL, async () => {
    return journalDb.getAllJournals();
  });

  ipcMain.handle(IPC_CHANNELS.JOURNAL_GET_BY_ID, async (_event, id) => {
    return journalDb.getJournalById(id);
  });

  ipcMain.handle(IPC_CHANNELS.JOURNAL_UPDATE, async (_event, id, updates) => {
    return journalDb.updateJournal(id, updates);
  });

  ipcMain.handle(IPC_CHANNELS.JOURNAL_DELETE, async (_event, id) => {
    return journalDb.deleteJournal(id);
  });

  // Entry operations
  ipcMain.handle(IPC_CHANNELS.ENTRY_CREATE, async (_event, entry) => {
    return entryDb.createEntry(entry);
  });

  ipcMain.handle(IPC_CHANNELS.ENTRY_GET_ALL, async (_event, journalId) => {
    return entryDb.getAllEntries(journalId);
  });

  ipcMain.handle(IPC_CHANNELS.ENTRY_GET_BY_ID, async (_event, id) => {
    return entryDb.getEntryById(id);
  });

  ipcMain.handle(IPC_CHANNELS.ENTRY_UPDATE, async (_event, id, updates) => {
    return entryDb.updateEntry(id, updates);
  });

  ipcMain.handle(IPC_CHANNELS.ENTRY_DELETE, async (_event, id) => {
    return entryDb.deleteEntry(id);
  });

  ipcMain.handle(IPC_CHANNELS.ENTRY_SEARCH, async (_event, query) => {
    return entryDb.searchEntries(query);
  });

  // Settings operations
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => {
    return settingsDb.getSettings();
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_event, settings) => {
    return settingsDb.setSettings(settings);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', async () => {
  await initializeDatabase();
  setupIPCHandlers();
  createWindow();
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
    createWindow();
  }
});
