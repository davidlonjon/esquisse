import type { ElectronAPI } from '@shared/ipc';

export const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const getWindowAPI = (): ElectronAPI => {
  if (!window.api) {
    throw new Error('Electron renderer API is unavailable.');
  }
  return window.api;
};
