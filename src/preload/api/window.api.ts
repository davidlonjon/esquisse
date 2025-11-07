/**
 * Window API for preload
 * Exposes window control operations to the renderer process
 */

import { ipcRenderer } from 'electron';

import { IPC_CHANNELS } from '@shared/ipc';

export const windowAPI = {
  minimizeWindow: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),

  maximizeWindow: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),

  closeWindow: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
};
