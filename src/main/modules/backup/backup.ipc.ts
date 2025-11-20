import { z } from 'zod';

import { IPC_CHANNELS } from '@shared/ipc';
import type { BackupInfo } from '@shared/types';

import { getDatabasePath } from '../../database';
import { createBackup, listBackups, restoreBackup } from '../../database/backup';
import { registerSafeHandler } from '../../ipc/safe-handler';

const emptyArgsSchema = z.tuple([]);
const restoreSchema = z.tuple([
  z.object({
    path: z.string().min(1),
  }),
]);

const formatBackupInfo = (info: ReturnType<typeof listBackups>[number]): BackupInfo => ({
  name: info.name,
  path: info.path,
  date: info.date.toISOString(),
  size: info.size,
});

export function registerBackupHandlers(): void {
  registerSafeHandler(IPC_CHANNELS.BACKUP_CREATE, emptyArgsSchema, async () => {
    const path = getDatabasePath();
    return createBackup(path);
  });

  registerSafeHandler(IPC_CHANNELS.BACKUP_LIST, emptyArgsSchema, async () => {
    return listBackups().map(formatBackupInfo);
  });

  registerSafeHandler(IPC_CHANNELS.BACKUP_RESTORE, restoreSchema, async (_event, [{ path }]) => {
    const targetPath = getDatabasePath();
    return restoreBackup(path, targetPath);
  });
}
