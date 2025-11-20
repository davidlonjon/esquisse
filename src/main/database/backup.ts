import { app } from 'electron';
import fs from 'fs';
import path from 'path';

/**
 * Database backup utility
 * Creates timestamped backups of the database file
 */

const MAX_BACKUPS = 10; // Keep only the last 10 backups

/**
 * Get the backup directory path
 * Lazy initialization to avoid accessing app.getPath during module load
 */
function getBackupDir(): string {
  return path.join(app.getPath('userData'), 'backups');
}

/**
 * Ensure backup directory exists
 */
function ensureBackupDir() {
  const BACKUP_DIR = getBackupDir();
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Create a backup of the database file
 */
export function createBackup(dbPath: string): string | null {
  try {
    ensureBackupDir();

    if (!fs.existsSync(dbPath)) {
      console.warn('Database file does not exist, cannot create backup');
      return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `esquisse-backup-${timestamp}.db`;
    const backupPath = path.join(getBackupDir(), backupFileName);

    fs.copyFileSync(dbPath, backupPath);
    console.log('Database backup created:', backupPath);

    // Clean up old backups
    cleanupOldBackups();

    return backupPath;
  } catch (error) {
    console.error('Failed to create database backup:', error);
    return null;
  }
}

/**
 * Remove old backups, keeping only the most recent MAX_BACKUPS
 */
function cleanupOldBackups() {
  try {
    const BACKUP_DIR = getBackupDir();
    const files = fs.readdirSync(BACKUP_DIR);
    const backupFiles = files
      .filter((file) => file.startsWith('esquisse-backup-') && file.endsWith('.db'))
      .map((file) => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    // Remove old backups beyond MAX_BACKUPS
    if (backupFiles.length > MAX_BACKUPS) {
      backupFiles.slice(MAX_BACKUPS).forEach((file) => {
        fs.unlinkSync(file.path);
        console.log('Removed old backup:', file.name);
      });
    }
  } catch (error) {
    console.error('Failed to cleanup old backups:', error);
  }
}

/**
 * Restore database from a backup file
 */
export function restoreBackup(backupPath: string, targetPath: string): boolean {
  try {
    if (!fs.existsSync(backupPath)) {
      console.error('Backup file does not exist:', backupPath);
      return false;
    }

    fs.copyFileSync(backupPath, targetPath);
    console.log('Database restored from backup:', backupPath);
    return true;
  } catch (error) {
    console.error('Failed to restore database from backup:', error);
    return false;
  }
}

/**
 * List all available backups
 */
export function listBackups(): Array<{ name: string; path: string; date: Date; size: number }> {
  try {
    ensureBackupDir();

    const BACKUP_DIR = getBackupDir();
    const files = fs.readdirSync(BACKUP_DIR);
    return files
      .filter((file) => file.startsWith('esquisse-backup-') && file.endsWith('.db'))
      .map((file) => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          date: stats.mtime,
          size: stats.size,
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error('Failed to list backups:', error);
    return [];
  }
}
