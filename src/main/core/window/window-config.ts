/**
 * Window configuration for the main application window
 */

import type { BrowserWindowConstructorOptions } from 'electron';
import path from 'node:path';

/**
 * Get browser window configuration
 */
export function getWindowConfig(): BrowserWindowConstructorOptions {
  return {
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
  };
}
