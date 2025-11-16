import { getErrorMessage } from '@lib/utils';
import type { ElectronAPI } from '@shared/ipc';
import type { Result } from '@shared/types';

export { getErrorMessage };

export const getWindowAPI = (): ElectronAPI => {
  if (!window.api) {
    throw new Error('Electron renderer API is unavailable.');
  }
  return window.api;
};

export const resolveResult = <T>(result: Result<T>): T => {
  if (result.ok) {
    return result.data;
  }

  const message = result.error.message || 'Unknown IPC error';
  const code = result.error.code ? ` (${result.error.code})` : '';
  throw new Error(`${message}${code}`);
};
