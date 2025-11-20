/**
 * Database Transaction Helpers
 *
 * Provides utilities for managing SQLite transactions with automatic
 * rollback on error, support for nested transactions via savepoints,
 * and both synchronous and asynchronous operation modes.
 *
 * @module database/transactions
 */

import type Database from 'better-sqlite3';

import { getDatabase } from './index';

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
}

/**
 * Execute a synchronous operation within a database transaction.
 *
 * If the operation completes successfully, the transaction is committed.
 * If an error occurs, the transaction is automatically rolled back.
 * With better-sqlite3, all changes are automatically persisted via WAL mode.
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
 *   db.prepare('INSERT INTO journals (id, name) VALUES (?, ?)').run(id, name);
 *   return { id, name };
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Multi-step operation with automatic rollback on error
 * const result = withTransaction((db) => {
 *   db.prepare('INSERT INTO journals (id, name) VALUES (?, ?)').run(journalId, name);
 *   db.prepare('INSERT INTO entries (id, journal_id, content) VALUES (?, ?, ?)').run(entryId, journalId, content);
 *   return { journalId, entryId };
 * }); // Both inserts committed together, or both rolled back on error
 * ```
 */
export function withTransaction<T>(
  fn: (database: Database.Database) => T,
  options: TransactionOptions & { database?: Database.Database } = {}
): T {
  const { mode = 'IMMEDIATE', database: db } = options;
  const database = db || getDatabase();

  database.prepare(`BEGIN ${mode}`).run();
  try {
    const result = fn(database);
    database.prepare('COMMIT').run();
    return result;
  } catch (error) {
    database.prepare('ROLLBACK').run();
    throw error;
  }
}

/**
 * Execute an asynchronous operation within a database transaction.
 *
 * Similar to {@link withTransaction} but supports async functions.
 * Note: better-sqlite3 operations are synchronous, but this allows wrapping
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
 *   db.prepare('INSERT INTO journals (id, name) VALUES (?, ?)').run(id, name);
 *   await someAsyncValidation(id);
 *   return { id, name };
 * });
 * ```
 */
export async function withTransactionAsync<T>(
  fn: (database: Database.Database) => Promise<T>,
  options: TransactionOptions & { database?: Database.Database } = {}
): Promise<T> {
  const { mode = 'IMMEDIATE', database: db } = options;
  const database = db || getDatabase();

  database.prepare(`BEGIN ${mode}`).run();
  try {
    const result = await fn(database);
    database.prepare('COMMIT').run();
    return result;
  } catch (error) {
    database.prepare('ROLLBACK').run();
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
 *   db.prepare('INSERT INTO journals (id, name) VALUES (?, ?)').run(id1, 'Journal 1');
 *
 *   const sp = savepoint(db, 'entry_insert');
 *   try {
 *     db.prepare('INSERT INTO entries (id, journal_id) VALUES (?, ?)').run(entryId, id1);
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
 *   db.prepare('INSERT INTO journals (id, name) VALUES (?, ?)').run(id, name);
 *
 *   // Create savepoint for inner operation
 *   const sp = savepoint(db, 'inner_op');
 *   try {
 *     db.prepare('INSERT INTO entries (id, journal_id) VALUES (?, ?)').run(entryId, id);
 *     sp.release(); // Success - commit savepoint
 *   } catch (error) {
 *     sp.rollback(); // Error - rollback only the entry insert
 *     // Journal insert is preserved
 *   }
 * });
 * ```
 */
export function savepoint(database: Database.Database, name?: string): Savepoint {
  const savepointName = name || `sp_${++savepointCounter}`;

  // Create the savepoint
  database.prepare(`SAVEPOINT ${savepointName}`).run();

  return {
    name: savepointName,

    release() {
      database.prepare(`RELEASE SAVEPOINT ${savepointName}`).run();
    },

    rollback() {
      database.prepare(`ROLLBACK TO SAVEPOINT ${savepointName}`).run();
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
 *   db.prepare('INSERT INTO journals (id, name) VALUES (?, ?)').run(id, name);
 *
 *   // Nested operation with automatic savepoint management
 *   try {
 *     withSavepoint(db, (db) => {
 *       db.prepare('INSERT INTO entries (id, journal_id) VALUES (?, ?)').run(entryId, id);
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
  database: Database.Database,
  fn: (database: Database.Database) => T,
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
  database: Database.Database,
  fn: (database: Database.Database) => Promise<T>,
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
