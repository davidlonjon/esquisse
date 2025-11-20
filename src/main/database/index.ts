import { app } from 'electron';
import fs from 'fs';
import path from 'path';

import initSqlJs, { Database } from 'sql.js';

import { runMigrations } from './migrations';

let db: Database | null = null;
let dbPath: string | null = null;
let saveInFlight: Promise<void> | null = null;
let pendingSave = false;

const writeDatabaseFile = (): Buffer => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  const data = db.export();
  return Buffer.from(data);
};

const scheduleSave = () => {
  if (!db || !dbPath) {
    return;
  }

  if (saveInFlight) {
    pendingSave = true;
    return;
  }

  pendingSave = false;
  const buffer = writeDatabaseFile();

  saveInFlight = fs.promises
    .writeFile(dbPath, buffer)
    .catch((error) => {
      console.error('Failed to write database file:', error);
    })
    .finally(() => {
      saveInFlight = null;
      if (pendingSave) {
        scheduleSave();
      }
    });
};

function flushDatabaseSync() {
  if (!db || !dbPath) {
    return;
  }
  const buffer = writeDatabaseFile();
  fs.writeFileSync(dbPath, buffer);
  pendingSave = false;
}

export function forceFlushDatabase(): void {
  flushDatabaseSync();
}

export function getDatabasePath(): string {
  if (!dbPath) {
    throw new Error('Database path not initialized');
  }
  return dbPath;
}

/**
 * Save database to file
 */
function saveDatabase(): void {
  scheduleSave();
}

/**
 * Initialize the database connection and create tables if they don't exist
 */
export async function initializeDatabase(): Promise<Database> {
  if (db) {
    return db;
  }

  try {
    console.log('Initializing sql.js...');

    // Initialize sql.js
    const SQL = await initSqlJs({
      locateFile: (file) => {
        // In development, use node_modules path
        // In production, the file will be packaged with the app
        const wasmPath =
          process.env.NODE_ENV === 'development'
            ? path.join(process.cwd(), 'node_modules/sql.js/dist', file)
            : path.join(process.resourcesPath, 'sql.js', file);

        console.log('Loading sql.js wasm from:', wasmPath);
        return wasmPath;
      },
    });

    console.log('sql.js initialized successfully');

    // Get the user data path (platform-specific)
    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, 'esquisse.db');

    // Ensure the directory exists
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    console.log('Database path:', dbPath);

    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    runMigrations(db);
    flushDatabaseSync();

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
export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    if (saveInFlight) {
      try {
        await saveInFlight;
      } catch {
        // already logged inside scheduleSave
      }
    }
    flushDatabaseSync();
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

/**
 * Export saveDatabase for use in other modules
 */
export { saveDatabase };

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
