import { ipcRenderer } from 'electron';

import { IPC_CHANNELS } from '@shared/ipc';
import type { BackupInfo, Result } from '@shared/types';

export const backupAPI = {
  createBackup: (): Promise<Result<string | null>> =>
    ipcRenderer.invoke(IPC_CHANNELS.BACKUP_CREATE),

  listBackups: (): Promise<Result<BackupInfo[]>> => ipcRenderer.invoke(IPC_CHANNELS.BACKUP_LIST),

  restoreBackup: (path: string): Promise<Result<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.BACKUP_RESTORE, { path }),
};
