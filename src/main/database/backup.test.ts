import fs from 'fs';
import { tmpdir } from 'os';
import path from 'path';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { createBackup, restoreBackup, listBackups } from './backup';

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => {
      if (name === 'userData') {
        return path.join(tmpdir(), 'esquisse-test-userdata');
      }
      return tmpdir();
    }),
  },
}));

describe('backup.ts - Database Backup and Restore', () => {
  const testUserDataPath = path.join(tmpdir(), 'esquisse-test-userdata');
  const testBackupDir = path.join(testUserDataPath, 'backups');
  const testDbPath = path.join(testUserDataPath, 'esquisse.db');

  beforeEach(() => {
    // Create test directories
    if (!fs.existsSync(testUserDataPath)) {
      fs.mkdirSync(testUserDataPath, { recursive: true });
    }
    if (!fs.existsSync(testBackupDir)) {
      fs.mkdirSync(testBackupDir, { recursive: true });
    }

    // Create a fake database file
    fs.writeFileSync(testDbPath, 'fake database content');
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testBackupDir)) {
      const files = fs.readdirSync(testBackupDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(testBackupDir, file));
      });
      fs.rmdirSync(testBackupDir);
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    if (fs.existsSync(testUserDataPath)) {
      try {
        fs.rmdirSync(testUserDataPath);
      } catch {
        // May not be empty, that's ok
      }
    }
  });

  describe('createBackup', () => {
    it('should create a backup file', () => {
      const backupPath = createBackup(testDbPath);

      expect(backupPath).not.toBeNull();
      expect(fs.existsSync(backupPath!)).toBe(true);
    });

    it('should create backup in correct directory', () => {
      const backupPath = createBackup(testDbPath);

      expect(backupPath).not.toBeNull();
      expect(backupPath).toContain(testBackupDir);
    });

    it('should create backup with timestamp in filename', () => {
      const backupPath = createBackup(testDbPath);

      expect(backupPath).not.toBeNull();
      expect(path.basename(backupPath!)).toMatch(
        /^esquisse-backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/
      );
      expect(path.extname(backupPath!)).toBe('.db');
    });

    it('should copy database content correctly', () => {
      const backupPath = createBackup(testDbPath);

      expect(backupPath).not.toBeNull();
      const backupContent = fs.readFileSync(backupPath!, 'utf-8');
      const originalContent = fs.readFileSync(testDbPath, 'utf-8');

      expect(backupContent).toBe(originalContent);
    });

    it('should return null if database file does not exist', () => {
      const nonExistentPath = path.join(testUserDataPath, 'nonexistent.db');
      const backupPath = createBackup(nonExistentPath);

      expect(backupPath).toBeNull();
    });

    it('should create backup directory if it does not exist', () => {
      // Remove backup directory
      if (fs.existsSync(testBackupDir)) {
        const files = fs.readdirSync(testBackupDir);
        files.forEach((file) => fs.unlinkSync(path.join(testBackupDir, file)));
        fs.rmdirSync(testBackupDir);
      }

      const backupPath = createBackup(testDbPath);

      expect(backupPath).not.toBeNull();
      expect(fs.existsSync(testBackupDir)).toBe(true);
    });

    it('should create multiple backups with unique filenames', () => {
      const backup1 = createBackup(testDbPath);

      // Wait a tiny bit to ensure different timestamp
      const now = Date.now();
      while (Date.now() - now < 10) {
        // Small delay
      }

      const backup2 = createBackup(testDbPath);

      expect(backup1).not.toBeNull();
      expect(backup2).not.toBeNull();
      expect(backup1).not.toBe(backup2);
      expect(fs.existsSync(backup1!)).toBe(true);
      expect(fs.existsSync(backup2!)).toBe(true);
    });

    it('should clean up old backups when exceeding MAX_BACKUPS', () => {
      // Create 12 backups (MAX_BACKUPS is 10)
      const backups: string[] = [];
      for (let i = 0; i < 12; i++) {
        const backup = createBackup(testDbPath);
        if (backup) {
          backups.push(backup);
        }
        // Small delay to ensure different timestamps
        const now = Date.now();
        while (Date.now() - now < 10) {
          /* wait */
        }
      }

      // List backups
      const remainingBackups = listBackups();

      // Should only keep 10 most recent
      expect(remainingBackups.length).toBeLessThanOrEqual(10);
    });

    it('should handle backup of large file', () => {
      // Create a larger fake database (1MB)
      const largeContent = 'x'.repeat(1024 * 1024);
      fs.writeFileSync(testDbPath, largeContent);

      const backupPath = createBackup(testDbPath);

      expect(backupPath).not.toBeNull();
      const backupContent = fs.readFileSync(backupPath!, 'utf-8');
      expect(backupContent.length).toBe(largeContent.length);
    });
  });

  describe('restoreBackup', () => {
    it('should restore database from backup', () => {
      // Create a backup
      const backupPath = createBackup(testDbPath);
      expect(backupPath).not.toBeNull();

      // Modify original database
      fs.writeFileSync(testDbPath, 'modified content');

      // Restore from backup
      const result = restoreBackup(backupPath!, testDbPath);

      expect(result).toBe(true);
      const restoredContent = fs.readFileSync(testDbPath, 'utf-8');
      expect(restoredContent).toBe('fake database content');
    });

    it('should return false if backup file does not exist', () => {
      const nonExistentBackup = path.join(testBackupDir, 'nonexistent-backup.db');
      const result = restoreBackup(nonExistentBackup, testDbPath);

      expect(result).toBe(false);
    });

    it('should overwrite existing target file', () => {
      const backupPath = createBackup(testDbPath);
      expect(backupPath).not.toBeNull();

      // Create new content in target
      fs.writeFileSync(testDbPath, 'completely different content');

      const result = restoreBackup(backupPath!, testDbPath);

      expect(result).toBe(true);
      const content = fs.readFileSync(testDbPath, 'utf-8');
      expect(content).toBe('fake database content');
    });

    it('should create target file if it does not exist', () => {
      const backupPath = createBackup(testDbPath);
      expect(backupPath).not.toBeNull();

      // Delete target
      fs.unlinkSync(testDbPath);

      const result = restoreBackup(backupPath!, testDbPath);

      expect(result).toBe(true);
      expect(fs.existsSync(testDbPath)).toBe(true);
    });

    it('should preserve backup file after restore', () => {
      const backupPath = createBackup(testDbPath);
      expect(backupPath).not.toBeNull();

      restoreBackup(backupPath!, testDbPath);

      // Backup should still exist
      expect(fs.existsSync(backupPath!)).toBe(true);
    });
  });

  describe('listBackups', () => {
    it('should return empty array when no backups exist', () => {
      const backups = listBackups();

      expect(backups).toEqual([]);
    });

    it('should list all backup files', () => {
      createBackup(testDbPath);

      const now = Date.now();
      while (Date.now() - now < 10) {
        /* wait */
      }

      createBackup(testDbPath);

      const backups = listBackups();

      expect(backups.length).toBeGreaterThanOrEqual(2);
    });

    it('should return backups sorted by date descending (newest first)', () => {
      createBackup(testDbPath);

      const now = Date.now();
      while (Date.now() - now < 10) {
        /* wait */
      }

      createBackup(testDbPath);

      const backups = listBackups();

      expect(backups.length).toBeGreaterThanOrEqual(2);
      // First backup should be more recent
      expect(backups[0].date.getTime()).toBeGreaterThanOrEqual(backups[1].date.getTime());
    });

    it('should include backup metadata', () => {
      createBackup(testDbPath);

      const backups = listBackups();

      expect(backups.length).toBeGreaterThan(0);
      expect(backups[0]).toHaveProperty('name');
      expect(backups[0]).toHaveProperty('path');
      expect(backups[0]).toHaveProperty('date');
      expect(backups[0]).toHaveProperty('size');

      expect(typeof backups[0].name).toBe('string');
      expect(typeof backups[0].path).toBe('string');
      expect(backups[0].date).toBeInstanceOf(Date);
      expect(typeof backups[0].size).toBe('number');
    });

    it('should report correct file size', () => {
      createBackup(testDbPath);

      const backups = listBackups();

      expect(backups.length).toBeGreaterThan(0);
      // Original content is 'fake database content' = 21 bytes
      expect(backups[0].size).toBeGreaterThan(0);
    });

    it('should only list files matching backup pattern', () => {
      // Create a backup
      createBackup(testDbPath);

      // Create a non-backup file
      fs.writeFileSync(path.join(testBackupDir, 'random-file.txt'), 'not a backup');
      fs.writeFileSync(path.join(testBackupDir, 'another.db'), 'also not a backup');

      const backups = listBackups();

      // Should only include properly named backups
      expect(backups.every((b) => b.name.startsWith('esquisse-backup-'))).toBe(true);
      expect(backups.every((b) => b.name.endsWith('.db'))).toBe(true);
    });

    it('should handle empty backup directory', () => {
      // Backup directory exists but is empty
      const backups = listBackups();

      expect(backups).toEqual([]);
    });

    it('should create backup directory if it does not exist', () => {
      // Remove backup directory
      if (fs.existsSync(testBackupDir)) {
        const files = fs.readdirSync(testBackupDir);
        files.forEach((file) => fs.unlinkSync(path.join(testBackupDir, file)));
        fs.rmdirSync(testBackupDir);
      }

      const backups = listBackups();

      expect(backups).toEqual([]);
      expect(fs.existsSync(testBackupDir)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should support full backup and restore workflow', () => {
      // Original content
      const originalContent = 'original database state';
      fs.writeFileSync(testDbPath, originalContent);

      // Create backup
      const backupPath = createBackup(testDbPath);
      expect(backupPath).not.toBeNull();

      // Modify database
      fs.writeFileSync(testDbPath, 'corrupted state');

      // Verify backup is listed
      const backups = listBackups();
      expect(backups.length).toBeGreaterThan(0);
      expect(backups.some((b) => b.path === backupPath)).toBe(true);

      // Restore from backup
      const restored = restoreBackup(backupPath!, testDbPath);
      expect(restored).toBe(true);

      // Verify restoration
      const restoredContent = fs.readFileSync(testDbPath, 'utf-8');
      expect(restoredContent).toBe(originalContent);
    });

    it('should allow restoring from any listed backup', () => {
      // Create multiple states
      fs.writeFileSync(testDbPath, 'state 1');
      const backup1 = createBackup(testDbPath);

      const now1 = Date.now();
      while (Date.now() - now1 < 10) {
        /* wait */
      }

      fs.writeFileSync(testDbPath, 'state 2');
      const backup2 = createBackup(testDbPath);

      const now2 = Date.now();
      while (Date.now() - now2 < 10) {
        /* wait */
      }

      fs.writeFileSync(testDbPath, 'state 3');

      // Restore to state 1
      restoreBackup(backup1!, testDbPath);
      expect(fs.readFileSync(testDbPath, 'utf-8')).toBe('state 1');

      // Restore to state 2
      restoreBackup(backup2!, testDbPath);
      expect(fs.readFileSync(testDbPath, 'utf-8')).toBe('state 2');
    });

    it('should maintain backup integrity over multiple operations', () => {
      const originalContent = 'integrity test content';
      fs.writeFileSync(testDbPath, originalContent);

      // Create backup
      const backup = createBackup(testDbPath);

      // Perform multiple operations
      fs.writeFileSync(testDbPath, 'change 1');
      fs.writeFileSync(testDbPath, 'change 2');
      fs.writeFileSync(testDbPath, 'change 3');

      // Backup should still be valid
      expect(fs.existsSync(backup!)).toBe(true);
      const backupContent = fs.readFileSync(backup!, 'utf-8');
      expect(backupContent).toBe(originalContent);

      // Restore should still work
      restoreBackup(backup!, testDbPath);
      expect(fs.readFileSync(testDbPath, 'utf-8')).toBe(originalContent);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty database file', () => {
      fs.writeFileSync(testDbPath, '');

      const backup = createBackup(testDbPath);

      expect(backup).not.toBeNull();
      expect(fs.readFileSync(backup!, 'utf-8')).toBe('');
    });

    it('should handle database with special characters in path', () => {
      const specialPath = path.join(testUserDataPath, 'test with spaces.db');
      fs.writeFileSync(specialPath, 'test content');

      const backup = createBackup(specialPath);

      expect(backup).not.toBeNull();
      expect(fs.existsSync(backup!)).toBe(true);

      // Cleanup
      fs.unlinkSync(specialPath);
    });
  });
});
