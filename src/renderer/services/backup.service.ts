import type { BackupInfo } from '@shared/types';

import { getWindowAPI, resolveResult } from './utils';

export const backupService = {
  async create(): Promise<string | null> {
    const api = getWindowAPI();
    return resolveResult(await api.createBackup());
  },

  async list(): Promise<BackupInfo[]> {
    const api = getWindowAPI();
    return resolveResult(await api.listBackups());
  },

  async restore(path: string): Promise<boolean> {
    const api = getWindowAPI();
    return resolveResult(await api.restoreBackup(path));
  },
};
