/**
 * Preload script that exposes a safe API to the renderer process
 * This creates a bridge between the main process and renderer process
 */

import { contextBridge } from 'electron';

import { electronAPI } from './api';

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('api', electronAPI);
