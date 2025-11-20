/**
 * Tests for database transaction helpers
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getTestDatabase, useDatabaseTest } from '@test/helpers/database.helper';

import {
  savepoint,
  withSavepoint,
  withSavepointAsync,
  withTransaction,
  withTransactionAsync,
} from './transactions';

import * as indexModule from './index';

// Mock the database module
vi.mock('./index', async () => {
  const actual = await vi.importActual('./index');
  return {
    ...actual,
    getDatabase: vi.fn(),
  };
});

describe('Transaction Helpers', () => {
  useDatabaseTest();

  beforeEach(() => {
    const db = getTestDatabase();
    vi.mocked(indexModule.getDatabase).mockReturnValue(db);
  });

  describe('withTransaction', () => {
    it('should commit transaction on success', () => {
      const db = getTestDatabase();

      // Execute operation in transaction
      const result = withTransaction(
        (txDb) => {
          txDb.prepare(
            "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j1', 'Test Journal', datetime('now'), datetime('now'))"
          ).run();
          return { id: 'j1' };
        },
        { database: db }
      );

      // Verify result
      expect(result).toEqual({ id: 'j1' });

      // Verify data was committed
      const row = db.prepare('SELECT id, name FROM journals WHERE id = ?').get('j1');
      expect(row).toBeDefined();
    });

    it('should rollback transaction on error', () => {
      const db = getTestDatabase();

      // Execute operation that throws error
      expect(() => {
        withTransaction(
          (txDb) => {
            txDb.prepare(
              "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j2', 'Journal 2', datetime('now'), datetime('now'))"
            ).run();
            throw new Error('Intentional error');
          },
          { database: db }
        );
      }).toThrow('Intentional error');

      // Verify data was rolled back
      const result = db.prepare('SELECT COUNT(*) as count FROM journals WHERE id = ?').get('j2') as {
        count: number;
      };
      expect(result.count).toBe(0);
    });

    it('should support different transaction modes', () => {
      const db = getTestDatabase();

      // Test with EXCLUSIVE mode
      const result = withTransaction(
        (txDb) => {
          txDb.prepare(
            "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j3', 'Journal 3', datetime('now'), datetime('now'))"
          ).run();
          return { success: true };
        },
        { mode: 'EXCLUSIVE', database: db }
      );

      expect(result.success).toBe(true);

      // Verify commit
      const row = db.prepare('SELECT id FROM journals WHERE id = ?').get('j3');
      expect(row).toBeDefined();
    });

    it('should handle multiple operations in single transaction', () => {
      const db = getTestDatabase();

      withTransaction(
        (txDb) => {
          // Insert journal
          txDb.run(
            "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j4', 'Journal 4', datetime('now'), datetime('now'))"
          );

          // Insert entry for that journal
          txDb.run(
            "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e1', 'j4', 'Entry content', datetime('now'), datetime('now'))"
          );
        },
        { database: db }
      );

      // Verify both were committed
      const journalStmt = db.prepare('SELECT id FROM journals WHERE id = ?');
      journalStmt.bind(['j4']);
      expect(journalStmt.step()).toBe(true);
      journalStmt.free();

      const entryStmt = db.prepare('SELECT id FROM entries WHERE id = ?');
      entryStmt.bind(['e1']);
      expect(entryStmt.step()).toBe(true);
      entryStmt.free();
    });

    it('should rollback all operations on error in multi-step transaction', () => {
      const db = getTestDatabase();

      expect(() => {
        withTransaction(
          (txDb) => {
            // Insert journal
            txDb.run(
              "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j5', 'Journal 5', datetime('now'), datetime('now'))"
            );

            // Insert entry
            txDb.run(
              "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e2', 'j5', 'Entry', datetime('now'), datetime('now'))"
            );

            // Throw error
            throw new Error('Transaction failed');
          },
          { database: db }
        );
      }).toThrow('Transaction failed');

      // Verify both were rolled back
      const journalStmt = db.prepare('SELECT COUNT(*) as count FROM journals WHERE id = ?');
      journalStmt.bind(['j5']);
      journalStmt.step();
      expect(journalStmt.getAsObject().count).toBe(0);
      journalStmt.free();

      const entryStmt = db.prepare('SELECT COUNT(*) as count FROM entries WHERE id = ?');
      entryStmt.bind(['e2']);
      entryStmt.step();
      expect(entryStmt.getAsObject().count).toBe(0);
      entryStmt.free();
    });
  });

  describe('withTransactionAsync', () => {
    it('should commit async transaction on success', async () => {
      const db = getTestDatabase();

      const result = await withTransactionAsync(
        async (txDb) => {
          txDb.run(
            "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j6', 'Journal 6', datetime('now'), datetime('now'))"
          );
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { id: 'j6' };
        },
        { database: db }
      );

      expect(result).toEqual({ id: 'j6' });

      // Verify commit
      const row = db.prepare('SELECT id FROM journals WHERE id = ?').get('j6');
      expect(row).toBeDefined();
    });

    it('should rollback async transaction on error', async () => {
      const db = getTestDatabase();

      await expect(
        withTransactionAsync(
          async (txDb) => {
            txDb.prepare(
              "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j7', 'Journal 7', datetime('now'), datetime('now'))"
            ).run();
            await new Promise((resolve) => setTimeout(resolve, 10));
            throw new Error('Async error');
          },
          { database: db }
        )
      ).rejects.toThrow('Async error');

      // Verify rollback
      const result = db.prepare('SELECT COUNT(*) as count FROM journals WHERE id = ?').get('j7') as {
        count: number;
      };
      expect(result.count).toBe(0);
    });
  });

  describe('savepoint', () => {
    it('should create and release savepoint', () => {
      const db = getTestDatabase();

      withTransaction(
        (txDb) => {
          // Outer operation
          txDb.run(
            "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j8', 'Journal 8', datetime('now'), datetime('now'))"
          );

          // Create savepoint
          const sp = savepoint(txDb, 'test_sp');

          // Inner operation
          txDb.run(
            "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e3', 'j8', 'Entry', datetime('now'), datetime('now'))"
          );

          // Release savepoint (commit inner operation)
          sp.release();
        },
        { database: db }
      );

      // Verify both operations committed
      const journalStmt = db.prepare('SELECT id FROM journals WHERE id = ?');
      journalStmt.bind(['j8']);
      expect(journalStmt.step()).toBe(true);
      journalStmt.free();

      const entryStmt = db.prepare('SELECT id FROM entries WHERE id = ?');
      entryStmt.bind(['e3']);
      expect(entryStmt.step()).toBe(true);
      entryStmt.free();
    });

    it('should rollback to savepoint without affecting outer transaction', () => {
      const db = getTestDatabase();

      withTransaction(
        (txDb) => {
          // Outer operation
          txDb.run(
            "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j9', 'Journal 9', datetime('now'), datetime('now'))"
          );

          // Create savepoint
          const sp = savepoint(txDb, 'rollback_sp');

          // Inner operation
          txDb.run(
            "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e4', 'j9', 'Entry', datetime('now'), datetime('now'))"
          );

          // Rollback savepoint (undo inner operation)
          sp.rollback();

          // Outer transaction continues
        },
        { database: db }
      );

      // Verify outer operation committed, inner operation rolled back
      const journalStmt = db.prepare('SELECT id FROM journals WHERE id = ?');
      journalStmt.bind(['j9']);
      expect(journalStmt.step()).toBe(true);
      journalStmt.free();

      const entryStmt = db.prepare('SELECT COUNT(*) as count FROM entries WHERE id = ?');
      entryStmt.bind(['e4']);
      entryStmt.step();
      expect(entryStmt.getAsObject().count).toBe(0);
      entryStmt.free();
    });

    it('should support nested savepoints', () => {
      const db = getTestDatabase();

      withTransaction(
        (txDb) => {
          // Level 0: Insert journal
          txDb.run(
            "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j10', 'Journal 10', datetime('now'), datetime('now'))"
          );

          // Level 1: Savepoint for first entry
          const sp1 = savepoint(txDb, 'sp1');
          txDb.run(
            "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e5', 'j10', 'Entry 5', datetime('now'), datetime('now'))"
          );
          sp1.release();

          // Level 1: Savepoint for second entry (will be rolled back)
          const sp2 = savepoint(txDb, 'sp2');
          txDb.run(
            "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e6', 'j10', 'Entry 6', datetime('now'), datetime('now'))"
          );
          sp2.rollback();

          // Level 1: Savepoint for third entry
          const sp3 = savepoint(txDb, 'sp3');
          txDb.run(
            "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e7', 'j10', 'Entry 7', datetime('now'), datetime('now'))"
          );
          sp3.release();
        },
        { database: db }
      );

      // Verify: journal committed, e5 and e7 committed, e6 rolled back
      const journalStmt = db.prepare('SELECT id FROM journals WHERE id = ?');
      journalStmt.bind(['j10']);
      expect(journalStmt.step()).toBe(true);
      journalStmt.free();

      const e5Stmt = db.prepare('SELECT id FROM entries WHERE id = ?');
      e5Stmt.bind(['e5']);
      expect(e5Stmt.step()).toBe(true);
      e5Stmt.free();

      const e6Stmt = db.prepare('SELECT COUNT(*) as count FROM entries WHERE id = ?');
      e6Stmt.bind(['e6']);
      e6Stmt.step();
      expect(e6Stmt.getAsObject().count).toBe(0);
      e6Stmt.free();

      const e7Stmt = db.prepare('SELECT id FROM entries WHERE id = ?');
      e7Stmt.bind(['e7']);
      expect(e7Stmt.step()).toBe(true);
      e7Stmt.free();
    });
  });

  describe('withSavepoint', () => {
    it('should automatically release savepoint on success', () => {
      const db = getTestDatabase();

      withTransaction(
        (txDb) => {
          txDb.run(
            "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j11', 'Journal 11', datetime('now'), datetime('now'))"
          );

          withSavepoint(txDb, (db) => {
            db.run(
              "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e8', 'j11', 'Entry', datetime('now'), datetime('now'))"
            );
          });
        },
        { database: db }
      );

      // Verify both committed
      const journalStmt = db.prepare('SELECT id FROM journals WHERE id = ?');
      journalStmt.bind(['j11']);
      expect(journalStmt.step()).toBe(true);
      journalStmt.free();

      const entryStmt = db.prepare('SELECT id FROM entries WHERE id = ?');
      entryStmt.bind(['e8']);
      expect(entryStmt.step()).toBe(true);
      entryStmt.free();
    });

    it('should automatically rollback savepoint on error', () => {
      const db = getTestDatabase();

      withTransaction(
        (txDb) => {
          txDb.run(
            "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j12', 'Journal 12', datetime('now'), datetime('now'))"
          );

          try {
            withSavepoint(txDb, (db) => {
              db.run(
                "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e9', 'j12', 'Entry', datetime('now'), datetime('now'))"
              );
              throw new Error('Savepoint error');
            });
          } catch {
            // Catch and ignore the error to continue outer transaction
          }
        },
        { database: db }
      );

      // Verify journal committed, entry rolled back
      const journalStmt = db.prepare('SELECT id FROM journals WHERE id = ?');
      journalStmt.bind(['j12']);
      expect(journalStmt.step()).toBe(true);
      journalStmt.free();

      const entryStmt = db.prepare('SELECT COUNT(*) as count FROM entries WHERE id = ?');
      entryStmt.bind(['e9']);
      entryStmt.step();
      expect(entryStmt.getAsObject().count).toBe(0);
      entryStmt.free();
    });
  });

  describe('withSavepointAsync', () => {
    it('should handle async operations with savepoint', async () => {
      const db = getTestDatabase();

      await withTransactionAsync(
        async (txDb) => {
          txDb.run(
            "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j13', 'Journal 13', datetime('now'), datetime('now'))"
          );

          await withSavepointAsync(txDb, async (db) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            db.run(
              "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e10', 'j13', 'Entry', datetime('now'), datetime('now'))"
            );
          });
        },
        { database: db }
      );

      // Verify both committed
      const journalStmt = db.prepare('SELECT id FROM journals WHERE id = ?');
      journalStmt.bind(['j13']);
      expect(journalStmt.step()).toBe(true);
      journalStmt.free();

      const entryStmt = db.prepare('SELECT id FROM entries WHERE id = ?');
      entryStmt.bind(['e10']);
      expect(entryStmt.step()).toBe(true);
      entryStmt.free();
    });
  });

  describe('Error Propagation', () => {
    it('should propagate custom error types', () => {
      const db = getTestDatabase();

      class CustomError extends Error {
        constructor(
          message: string,
          public code: string
        ) {
          super(message);
          this.name = 'CustomError';
        }
      }

      expect(() => {
        withTransaction(
          (txDb) => {
            txDb.run(
              "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j14', 'Journal 14', datetime('now'), datetime('now'))"
            );
            throw new CustomError('Custom error', 'CUSTOM_CODE');
          },
          { database: db }
        );
      }).toThrow(CustomError);
    });

    it('should preserve error stack traces', () => {
      const db = getTestDatabase();
      let caughtError: Error | null = null;

      try {
        withTransaction(
          (txDb) => {
            txDb.run(
              "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j15', 'Journal 15', datetime('now'), datetime('now'))"
            );
            throw new Error('Stack test');
          },
          { database: db }
        );
      } catch (error) {
        caughtError = error as Error;
      }

      expect(caughtError).toBeTruthy();
      expect(caughtError?.stack).toBeTruthy();
      expect(caughtError?.stack).toContain('Stack test');
    });
  });
});
