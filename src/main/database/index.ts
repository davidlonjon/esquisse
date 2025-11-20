import { app } from 'electron';
import path from 'path';

import Database from 'better-sqlite3';

import { createBackup } from './backup';
import { runMigrations } from './migrations';

let db: Database.Database | null = null;
let dbPath: string | null = null;
let backupTimer: NodeJS.Timeout | null = null;

/**
 * Interval for automatic database backups (milliseconds)
 * Backups are created periodically to enable crash recovery
 */
const BACKUP_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export function getDatabasePath(): string {
  if (!dbPath) {
    throw new Error('Database path not initialized');
  }
  return dbPath;
}

/**
 * Start periodic automatic backups
 * Creates backups at regular intervals for crash recovery
 */
function startAutoBackup(): void {
  if (!dbPath) {
    console.warn('Cannot start auto-backup: database path not initialized');
    return;
  }

  // Clear any existing timer
  if (backupTimer) {
    clearInterval(backupTimer);
  }

  // Create backup immediately on startup
  createBackup(dbPath);

  // Schedule periodic backups
  backupTimer = setInterval(() => {
    if (dbPath) {
      createBackup(dbPath);
    }
  }, BACKUP_INTERVAL_MS);

  console.log(`Auto-backup started: interval ${BACKUP_INTERVAL_MS / 1000 / 60} minutes`);
}

/**
 * Stop periodic automatic backups
 */
function stopAutoBackup(): void {
  if (backupTimer) {
    clearInterval(backupTimer);
    backupTimer = null;
    console.log('Auto-backup stopped');
  }
}

/**
 * Initialize the database connection and create tables if they don't exist
 */
export async function initializeDatabase(): Promise<Database.Database> {
  if (db) {
    return db;
  }

  try {
    console.log('Initializing better-sqlite3...');

    // Get the user data path (platform-specific)
    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, 'esquisse.db');

    console.log('Database path:', dbPath);

    // Open or create database
    db = new Database(dbPath);

    // Enable WAL mode for better concurrency and crash recovery
    db.pragma('journal_mode = WAL');

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Run migrations
    runMigrations(db);

    // Start periodic automatic backups
    startAutoBackup();

    console.log('Database initialized successfully');

    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get the database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection
 * Creates final backup on shutdown
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    // Stop auto-backup and create final backup
    stopAutoBackup();
    if (dbPath) {
      createBackup(dbPath);
    }

    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

/**
 * Export comprehensive transaction helpers
 */
export {
  withTransaction,
  withTransactionAsync,
  savepoint,
  withSavepoint,
  withSavepointAsync,
  type TransactionMode,
  type TransactionOptions,
  type Savepoint,
} from './transactions';
