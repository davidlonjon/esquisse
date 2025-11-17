import { describe, it, expect, vi, beforeEach } from 'vitest';

import { IPC_CHANNELS } from '@shared/ipc';
import type { BackupInfo } from '@shared/types';

import * as database from '../../database';
import * as backupService from '../../database/backup';

// Mock the database module
vi.mock('../../database', () => ({
  getDatabasePath: vi.fn(),
  forceFlushDatabase: vi.fn(),
}));

// Mock the backup service
vi.mock('../../database/backup', () => ({
  createBackup: vi.fn(),
  listBackups: vi.fn(),
  restoreBackup: vi.fn(),
}));

// Mock the safe handler registration
const mockHandlers = new Map<string, (...args: unknown[]) => unknown>();
vi.mock('../../ipc/safe-handler', () => ({
  registerSafeHandler: vi.fn(
    (channel: string, _schema: unknown, handler: (...args: unknown[]) => unknown) => {
      mockHandlers.set(channel, handler);
    }
  ),
}));

// Import after mocks are set up
import { registerBackupHandlers } from './backup.ipc';

describe('backup.ipc.ts - Backup IPC Handlers', () => {
  const mockEvent = {} as never;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHandlers.clear();
    registerBackupHandlers();
  });

  describe('registerBackupHandlers', () => {
    it('should register all backup IPC handlers', () => {
      expect(mockHandlers.size).toBe(3);
      expect(mockHandlers.has(IPC_CHANNELS.BACKUP_CREATE)).toBe(true);
      expect(mockHandlers.has(IPC_CHANNELS.BACKUP_LIST)).toBe(true);
      expect(mockHandlers.has(IPC_CHANNELS.BACKUP_RESTORE)).toBe(true);
    });
  });

  describe('BACKUP_CREATE handler', () => {
    it('should create a backup and return the path', async () => {
      const mockDbPath = '/path/to/esquisse.db';
      const mockBackupPath = '/path/to/backups/esquisse-backup-2025-11-17.db';

      vi.mocked(database.getDatabasePath).mockReturnValue(mockDbPath);
      vi.mocked(backupService.createBackup).mockReturnValue(mockBackupPath);

      const handler = mockHandlers.get(IPC_CHANNELS.BACKUP_CREATE)!;
      const result = await handler(mockEvent, []);

      expect(database.forceFlushDatabase).toHaveBeenCalled();
      expect(database.getDatabasePath).toHaveBeenCalled();
      expect(backupService.createBackup).toHaveBeenCalledWith(mockDbPath);
      expect(result).toBe(mockBackupPath);
    });

    it('should flush database before creating backup', async () => {
      const mockDbPath = '/path/to/esquisse.db';
      vi.mocked(database.getDatabasePath).mockReturnValue(mockDbPath);
      vi.mocked(backupService.createBackup).mockReturnValue('/backup/path');

      const handler = mockHandlers.get(IPC_CHANNELS.BACKUP_CREATE)!;
      await handler(mockEvent, []);

      // Verify flush is called before createBackup
      const flushOrder = vi.mocked(database.forceFlushDatabase).mock.invocationCallOrder[0];
      const createOrder = vi.mocked(backupService.createBackup).mock.invocationCallOrder[0];
      expect(flushOrder).toBeLessThan(createOrder);
    });

    it('should return null if backup creation fails', async () => {
      const mockDbPath = '/path/to/esquisse.db';
      vi.mocked(database.getDatabasePath).mockReturnValue(mockDbPath);
      vi.mocked(backupService.createBackup).mockReturnValue(null);

      const handler = mockHandlers.get(IPC_CHANNELS.BACKUP_CREATE)!;
      const result = await handler(mockEvent, []);

      expect(result).toBeNull();
    });
  });

  describe('BACKUP_LIST handler', () => {
    it('should list all available backups', async () => {
      const mockBackups = [
        {
          name: 'esquisse-backup-2025-11-17.db',
          path: '/path/to/backups/esquisse-backup-2025-11-17.db',
          date: new Date('2025-11-17T10:30:00Z'),
          size: 1024000,
        },
        {
          name: 'esquisse-backup-2025-11-16.db',
          path: '/path/to/backups/esquisse-backup-2025-11-16.db',
          date: new Date('2025-11-16T15:20:00Z'),
          size: 950000,
        },
      ];

      vi.mocked(backupService.listBackups).mockReturnValue(mockBackups);

      const handler = mockHandlers.get(IPC_CHANNELS.BACKUP_LIST)!;
      const result = (await handler(mockEvent, [])) as BackupInfo[];

      expect(backupService.listBackups).toHaveBeenCalled();
      expect(result).toHaveLength(2);

      // Verify date conversion to ISO string
      expect(result[0]).toEqual({
        name: 'esquisse-backup-2025-11-17.db',
        path: '/path/to/backups/esquisse-backup-2025-11-17.db',
        date: '2025-11-17T10:30:00.000Z',
        size: 1024000,
      });

      expect(result[1]).toEqual({
        name: 'esquisse-backup-2025-11-16.db',
        path: '/path/to/backups/esquisse-backup-2025-11-16.db',
        date: '2025-11-16T15:20:00.000Z',
        size: 950000,
      });
    });

    it('should return empty array when no backups exist', async () => {
      vi.mocked(backupService.listBackups).mockReturnValue([]);

      const handler = mockHandlers.get(IPC_CHANNELS.BACKUP_LIST)!;
      const result = await handler(mockEvent, []);

      expect(result).toEqual([]);
    });

    it('should format all backup info correctly', async () => {
      const mockBackups = [
        {
          name: 'test-backup.db',
          path: '/test/path/test-backup.db',
          date: new Date('2025-01-01T00:00:00Z'),
          size: 500,
        },
      ];

      vi.mocked(backupService.listBackups).mockReturnValue(mockBackups);

      const handler = mockHandlers.get(IPC_CHANNELS.BACKUP_LIST)!;
      const result = (await handler(mockEvent, [])) as BackupInfo[];

      expect(result[0].name).toBe('test-backup.db');
      expect(result[0].path).toBe('/test/path/test-backup.db');
      expect(result[0].date).toBe('2025-01-01T00:00:00.000Z');
      expect(result[0].size).toBe(500);
    });
  });

  describe('BACKUP_RESTORE handler', () => {
    it('should restore a backup from given path', async () => {
      const backupPath = '/path/to/backups/esquisse-backup-2025-11-17.db';
      const targetDbPath = '/path/to/esquisse.db';

      vi.mocked(database.getDatabasePath).mockReturnValue(targetDbPath);
      vi.mocked(backupService.restoreBackup).mockReturnValue(true);

      const handler = mockHandlers.get(IPC_CHANNELS.BACKUP_RESTORE)!;
      const result = await handler(mockEvent, [{ path: backupPath }]);

      expect(database.forceFlushDatabase).toHaveBeenCalled();
      expect(database.getDatabasePath).toHaveBeenCalled();
      expect(backupService.restoreBackup).toHaveBeenCalledWith(backupPath, targetDbPath);
      expect(result).toBe(true);
    });

    it('should flush database before restoring backup', async () => {
      const backupPath = '/backup/path.db';
      const targetDbPath = '/target/path.db';

      vi.mocked(database.getDatabasePath).mockReturnValue(targetDbPath);
      vi.mocked(backupService.restoreBackup).mockReturnValue(true);

      const handler = mockHandlers.get(IPC_CHANNELS.BACKUP_RESTORE)!;
      await handler(mockEvent, [{ path: backupPath }]);

      // Verify flush is called before restoreBackup
      const flushOrder = vi.mocked(database.forceFlushDatabase).mock.invocationCallOrder[0];
      const restoreOrder = vi.mocked(backupService.restoreBackup).mock.invocationCallOrder[0];
      expect(flushOrder).toBeLessThan(restoreOrder);
    });

    it('should return false if restore fails', async () => {
      const backupPath = '/invalid/backup/path.db';
      const targetDbPath = '/path/to/esquisse.db';

      vi.mocked(database.getDatabasePath).mockReturnValue(targetDbPath);
      vi.mocked(backupService.restoreBackup).mockReturnValue(false);

      const handler = mockHandlers.get(IPC_CHANNELS.BACKUP_RESTORE)!;
      const result = await handler(mockEvent, [{ path: backupPath }]);

      expect(result).toBe(false);
    });

    it('should extract path from object parameter', async () => {
      const backupPath = '/my/backup/file.db';
      vi.mocked(database.getDatabasePath).mockReturnValue('/target.db');
      vi.mocked(backupService.restoreBackup).mockReturnValue(true);

      const handler = mockHandlers.get(IPC_CHANNELS.BACKUP_RESTORE)!;
      await handler(mockEvent, [{ path: backupPath }]);

      expect(backupService.restoreBackup).toHaveBeenCalledWith(backupPath, '/target.db');
    });
  });

  describe('Error Handling', () => {
    it('should propagate errors from createBackup', async () => {
      vi.mocked(database.getDatabasePath).mockReturnValue('/path/to/db');
      vi.mocked(backupService.createBackup).mockImplementation(() => {
        throw new Error('Backup creation failed');
      });

      const handler = mockHandlers.get(IPC_CHANNELS.BACKUP_CREATE)!;

      await expect(handler(mockEvent, [])).rejects.toThrow('Backup creation failed');
    });

    it('should propagate errors from listBackups', async () => {
      vi.mocked(backupService.listBackups).mockImplementation(() => {
        throw new Error('Failed to list backups');
      });

      const handler = mockHandlers.get(IPC_CHANNELS.BACKUP_LIST)!;

      await expect(handler(mockEvent, [])).rejects.toThrow('Failed to list backups');
    });

    it('should propagate errors from restoreBackup', async () => {
      vi.mocked(database.getDatabasePath).mockReturnValue('/path/to/db');
      vi.mocked(backupService.restoreBackup).mockImplementation(() => {
        throw new Error('Restore failed');
      });

      const handler = mockHandlers.get(IPC_CHANNELS.BACKUP_RESTORE)!;

      await expect(handler(mockEvent, [{ path: '/backup.db' }])).rejects.toThrow('Restore failed');
    });

    it('should propagate errors from getDatabasePath', async () => {
      vi.mocked(database.getDatabasePath).mockImplementation(() => {
        throw new Error('Database path not found');
      });

      const handler = mockHandlers.get(IPC_CHANNELS.BACKUP_CREATE)!;

      await expect(handler(mockEvent, [])).rejects.toThrow('Database path not found');
    });
  });
});
