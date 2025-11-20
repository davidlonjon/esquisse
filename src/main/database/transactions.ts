/**
 * Database Transaction Helpers
 *
 * Provides utilities for managing SQLite transactions with automatic
 * rollback on error, support for nested transactions via savepoints,
 * and both synchronous and asynchronous operation modes.
 *
 * @module database/transactions
 */

import type { Database } from 'sql.js';

import { getDatabase, saveDatabase } from './index';

/**
 * Transaction isolation levels supported by SQLite
 */
export type TransactionMode = 'DEFERRED' | 'IMMEDIATE' | 'EXCLUSIVE';

/**
 * Options for transaction configuration
 */
export interface TransactionOptions {
  /**
   * Transaction isolation mode
   * @default 'IMMEDIATE'
   *
   * - DEFERRED: Lock acquired when first read/write happens
   * - IMMEDIATE: Write lock acquired immediately
   * - EXCLUSIVE: Exclusive lock acquired immediately
   */
  mode?: TransactionMode;

  /**
   * Whether to save database to disk after successful commit
   * @default true
   */
  autoSave?: boolean;
}

/**
 * Execute a synchronous operation within a database transaction.
 *
 * If the operation completes successfully, the transaction is committed
 * and the database is saved to disk (unless autoSave is false).
 * If an error occurs, the transaction is automatically rolled back.
 *
 * @template T The return type of the operation
 * @param fn Function to execute within the transaction
 * @param options Transaction configuration options
 * @returns The result of the operation
 * @throws Re-throws any error that occurs within the transaction after rollback
 *
 * @example
 * ```typescript
 * const journal = withTransaction((db) => {
 *   db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [id, name]);
 *   return { id, name };
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Multi-step operation with automatic rollback on error
 * const result = withTransaction((db) => {
 *   db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [journalId, name]);
 *   db.run('INSERT INTO entries (id, journal_id, content) VALUES (?, ?, ?)', [entryId, journalId, content]);
 *   return { journalId, entryId };
 * }); // Both inserts committed together, or both rolled back on error
 * ```
 */
export function withTransaction<T>(
  fn: (database: Database) => T,
  options: TransactionOptions & { database?: Database } = {}
): T {
  const { mode = 'IMMEDIATE', autoSave = true, database: db } = options;
  const database = db || getDatabase();

  database.run(`BEGIN ${mode} TRANSACTION`);
  try {
    const result = fn(database);
    database.run('COMMIT');
    if (autoSave) {
      saveDatabase();
    }
    return result;
  } catch (error) {
    database.run('ROLLBACK');
    throw error;
  }
}

/**
 * Execute an asynchronous operation within a database transaction.
 *
 * Similar to {@link withTransaction} but supports async functions.
 * Note: sql.js operations are synchronous, but this allows wrapping
 * operations that include async business logic.
 *
 * @template T The return type of the async operation
 * @param fn Async function to execute within the transaction
 * @param options Transaction configuration options
 * @returns Promise resolving to the result of the operation
 * @throws Re-throws any error that occurs within the transaction after rollback
 *
 * @example
 * ```typescript
 * const result = await withTransactionAsync(async (db) => {
 *   db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [id, name]);
 *   await someAsyncValidation(id);
 *   return { id, name };
 * });
 * ```
 */
export async function withTransactionAsync<T>(
  fn: (database: Database) => Promise<T>,
  options: TransactionOptions & { database?: Database } = {}
): Promise<T> {
  const { mode = 'IMMEDIATE', autoSave = true, database: db } = options;
  const database = db || getDatabase();

  database.run(`BEGIN ${mode} TRANSACTION`);
  try {
    const result = await fn(database);
    database.run('COMMIT');
    if (autoSave) {
      saveDatabase();
    }
    return result;
  } catch (error) {
    database.run('ROLLBACK');
    throw error;
  }
}

/**
 * Savepoint manager for nested transaction support.
 *
 * Savepoints allow creating transaction checkpoints that can be
 * rolled back independently without affecting the outer transaction.
 *
 * @example
 * ```typescript
 * withTransaction((db) => {
 *   db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [id1, 'Journal 1']);
 *
 *   const sp = savepoint(db, 'entry_insert');
 *   try {
 *     db.run('INSERT INTO entries (id, journal_id) VALUES (?, ?)', [entryId, id1]);
 *     sp.release(); // Commit the savepoint
 *   } catch (error) {
 *     sp.rollback(); // Rollback only the entry insert
 *     // Journal insert is still active
 *   }
 * });
 * ```
 */
export interface Savepoint {
  /**
   * Name of the savepoint
   */
  readonly name: string;

  /**
   * Release (commit) the savepoint.
   * Makes changes since the savepoint permanent within the transaction.
   */
  release(): void;

  /**
   * Rollback to the savepoint.
   * Undoes all changes made since the savepoint was created.
   */
  rollback(): void;
}

/**
 * Internal counter for generating unique savepoint names
 */
let savepointCounter = 0;

/**
 * Create a savepoint within the current transaction.
 *
 * Savepoints enable nested transaction-like behavior by creating
 * checkpoints that can be independently committed or rolled back.
 *
 * @param database The database instance
 * @param name Optional savepoint name (auto-generated if not provided)
 * @returns Savepoint controller object
 *
 * @example
 * ```typescript
 * withTransaction((db) => {
 *   // Outer operation
 *   db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [id, name]);
 *
 *   // Create savepoint for inner operation
 *   const sp = savepoint(db, 'inner_op');
 *   try {
 *     db.run('INSERT INTO entries (id, journal_id) VALUES (?, ?)', [entryId, id]);
 *     sp.release(); // Success - commit savepoint
 *   } catch (error) {
 *     sp.rollback(); // Error - rollback only the entry insert
 *     // Journal insert is preserved
 *   }
 * });
 * ```
 */
export function savepoint(database: Database, name?: string): Savepoint {
  const savepointName = name || `sp_${++savepointCounter}`;

  // Create the savepoint
  database.run(`SAVEPOINT ${savepointName}`);

  return {
    name: savepointName,

    release() {
      database.run(`RELEASE SAVEPOINT ${savepointName}`);
    },

    rollback() {
      database.run(`ROLLBACK TO SAVEPOINT ${savepointName}`);
    },
  };
}

/**
 * Execute an operation within a savepoint (nested transaction).
 *
 * Convenience wrapper that automatically manages savepoint lifecycle.
 * On success, releases the savepoint. On error, rolls back to the savepoint.
 *
 * @template T The return type of the operation
 * @param database The database instance
 * @param fn Function to execute within the savepoint
 * @param name Optional savepoint name
 * @returns The result of the operation
 * @throws Re-throws any error after rolling back the savepoint
 *
 * @example
 * ```typescript
 * withTransaction((db) => {
 *   db.run('INSERT INTO journals (id, name) VALUES (?, ?)', [id, name]);
 *
 *   // Nested operation with automatic savepoint management
 *   try {
 *     withSavepoint(db, (db) => {
 *       db.run('INSERT INTO entries (id, journal_id) VALUES (?, ?)', [entryId, id]);
 *       if (someCondition) {
 *         throw new Error('Validation failed');
 *       }
 *     });
 *   } catch (error) {
 *     // Entry insert rolled back, journal insert preserved
 *     console.log('Entry creation failed, continuing without it');
 *   }
 * });
 * ```
 */
export function withSavepoint<T>(
  database: Database,
  fn: (database: Database) => T,
  name?: string
): T {
  const sp = savepoint(database, name);
  try {
    const result = fn(database);
    sp.release();
    return result;
  } catch (error) {
    sp.rollback();
    throw error;
  }
}

/**
 * Execute an async operation within a savepoint (nested transaction).
 *
 * Async version of {@link withSavepoint}.
 *
 * @template T The return type of the async operation
 * @param database The database instance
 * @param fn Async function to execute within the savepoint
 * @param name Optional savepoint name
 * @returns Promise resolving to the result of the operation
 * @throws Re-throws any error after rolling back the savepoint
 */
export async function withSavepointAsync<T>(
  database: Database,
  fn: (database: Database) => Promise<T>,
  name?: string
): Promise<T> {
  const sp = savepoint(database, name);
  try {
    const result = await fn(database);
    sp.release();
    return result;
  } catch (error) {
    sp.rollback();
    throw error;
  }
}
