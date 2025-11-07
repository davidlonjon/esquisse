/**
 * Window Manager
 * Handles creation, lifecycle, and management of application windows
 */

import { BrowserWindow } from 'electron';
import path from 'node:path';

import { getCSP } from './csp';
import { getWindowConfig } from './window-config';

let mainWindow: BrowserWindow | null = null;

/**
 * Create the main application window
 */
export function createMainWindow(devServerUrl?: string, rendererName?: string): BrowserWindow {
  const config = getWindowConfig();
  mainWindow = new BrowserWindow(config);

  // Show window when ready (prevents flash of white)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Set Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const isProduction = !devServerUrl;
    const csp = getCSP(isProduction);

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });

  // Load the app
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else if (rendererName) {
    mainWindow.loadFile(path.join(__dirname, `../../renderer/${rendererName}/index.html`));
  }

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development' || devServerUrl) {
    mainWindow.webContents.openDevTools();
  }

  // Clean up reference on close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

/**
 * Get the main window instance
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

/**
 * Close the main window
 */
export function closeMainWindow(): void {
  mainWindow?.close();
  mainWindow = null;
}
