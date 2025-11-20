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
          txDb
            .prepare(
              "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j1', 'Test Journal', datetime('now'), datetime('now'))"
            )
            .run();
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
            txDb
              .prepare(
                "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j2', 'Journal 2', datetime('now'), datetime('now'))"
              )
              .run();
            throw new Error('Intentional error');
          },
          { database: db }
        );
      }).toThrow('Intentional error');

      // Verify data was rolled back
      const result = db
        .prepare('SELECT COUNT(*) as count FROM journals WHERE id = ?')
        .get('j2') as {
        count: number;
      };
      expect(result.count).toBe(0);
    });

    it('should support different transaction modes', () => {
      const db = getTestDatabase();

      // Test with EXCLUSIVE mode
      const result = withTransaction(
        (txDb) => {
          txDb
            .prepare(
              "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j3', 'Journal 3', datetime('now'), datetime('now'))"
            )
            .run();
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
          txDb
            .prepare(
              "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j4', 'Journal 4', datetime('now'), datetime('now'))"
            )
            .run();

          // Insert entry for that journal
          txDb
            .prepare(
              "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e1', 'j4', 'Entry content', datetime('now'), datetime('now'))"
            )
            .run();
        },
        { database: db }
      );

      // Verify both were committed
      const journalRow = db.prepare('SELECT id FROM journals WHERE id = ?').get('j4');
      expect(journalRow).toBeDefined();

      const entryRow = db.prepare('SELECT id FROM entries WHERE id = ?').get('e1');
      expect(entryRow).toBeDefined();
    });

    it('should rollback all operations on error in multi-step transaction', () => {
      const db = getTestDatabase();

      expect(() => {
        withTransaction(
          (txDb) => {
            // Insert journal
            txDb
              .prepare(
                "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j5', 'Journal 5', datetime('now'), datetime('now'))"
              )
              .run();

            // Insert entry
            txDb
              .prepare(
                "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e2', 'j5', 'Entry', datetime('now'), datetime('now'))"
              )
              .run();

            // Throw error
            throw new Error('Transaction failed');
          },
          { database: db }
        );
      }).toThrow('Transaction failed');

      // Verify both were rolled back
      const journalResult = db
        .prepare('SELECT COUNT(*) as count FROM journals WHERE id = ?')
        .get('j5') as {
        count: number;
      };
      expect(journalResult.count).toBe(0);

      const entryResult = db
        .prepare('SELECT COUNT(*) as count FROM entries WHERE id = ?')
        .get('e2') as {
        count: number;
      };
      expect(entryResult.count).toBe(0);
    });
  });

  describe('withTransactionAsync', () => {
    it('should commit async transaction on success', async () => {
      const db = getTestDatabase();

      const result = await withTransactionAsync(
        async (txDb) => {
          txDb
            .prepare(
              "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j6', 'Journal 6', datetime('now'), datetime('now'))"
            )
            .run();
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
            txDb
              .prepare(
                "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j7', 'Journal 7', datetime('now'), datetime('now'))"
              )
              .run();
            await new Promise((resolve) => setTimeout(resolve, 10));
            throw new Error('Async error');
          },
          { database: db }
        )
      ).rejects.toThrow('Async error');

      // Verify rollback
      const result = db
        .prepare('SELECT COUNT(*) as count FROM journals WHERE id = ?')
        .get('j7') as {
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
          txDb
            .prepare(
              "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j8', 'Journal 8', datetime('now'), datetime('now'))"
            )
            .run();

          // Create savepoint
          const sp = savepoint(txDb, 'test_sp');

          // Inner operation
          txDb
            .prepare(
              "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e3', 'j8', 'Entry', datetime('now'), datetime('now'))"
            )
            .run();

          // Release savepoint (commit inner operation)
          sp.release();
        },
        { database: db }
      );

      // Verify both operations committed
      const journalRow = db.prepare('SELECT id FROM journals WHERE id = ?').get('j8');
      expect(journalRow).toBeDefined();

      const entryRow = db.prepare('SELECT id FROM entries WHERE id = ?').get('e3');
      expect(entryRow).toBeDefined();
    });

    it('should rollback to savepoint without affecting outer transaction', () => {
      const db = getTestDatabase();

      withTransaction(
        (txDb) => {
          // Outer operation
          txDb
            .prepare(
              "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j9', 'Journal 9', datetime('now'), datetime('now'))"
            )
            .run();

          // Create savepoint
          const sp = savepoint(txDb, 'rollback_sp');

          // Inner operation
          txDb
            .prepare(
              "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e4', 'j9', 'Entry', datetime('now'), datetime('now'))"
            )
            .run();

          // Rollback savepoint (undo inner operation)
          sp.rollback();

          // Outer transaction continues
        },
        { database: db }
      );

      // Verify outer operation committed, inner operation rolled back
      const journalRow = db.prepare('SELECT id FROM journals WHERE id = ?').get('j9');
      expect(journalRow).toBeDefined();

      const entryResult = db
        .prepare('SELECT COUNT(*) as count FROM entries WHERE id = ?')
        .get('e4') as {
        count: number;
      };
      expect(entryResult.count).toBe(0);
    });

    it('should support nested savepoints', () => {
      const db = getTestDatabase();

      withTransaction(
        (txDb) => {
          // Level 0: Insert journal
          txDb
            .prepare(
              "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j10', 'Journal 10', datetime('now'), datetime('now'))"
            )
            .run();

          // Level 1: Savepoint for first entry
          const sp1 = savepoint(txDb, 'sp1');
          txDb
            .prepare(
              "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e5', 'j10', 'Entry 5', datetime('now'), datetime('now'))"
            )
            .run();
          sp1.release();

          // Level 1: Savepoint for second entry (will be rolled back)
          const sp2 = savepoint(txDb, 'sp2');
          txDb
            .prepare(
              "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e6', 'j10', 'Entry 6', datetime('now'), datetime('now'))"
            )
            .run();
          sp2.rollback();

          // Level 1: Savepoint for third entry
          const sp3 = savepoint(txDb, 'sp3');
          txDb
            .prepare(
              "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e7', 'j10', 'Entry 7', datetime('now'), datetime('now'))"
            )
            .run();
          sp3.release();
        },
        { database: db }
      );

      // Verify: journal committed, e5 and e7 committed, e6 rolled back
      const journalRow = db.prepare('SELECT id FROM journals WHERE id = ?').get('j10');
      expect(journalRow).toBeDefined();

      const e5Row = db.prepare('SELECT id FROM entries WHERE id = ?').get('e5');
      expect(e5Row).toBeDefined();

      const e6Result = db
        .prepare('SELECT COUNT(*) as count FROM entries WHERE id = ?')
        .get('e6') as {
        count: number;
      };
      expect(e6Result.count).toBe(0);

      const e7Row = db.prepare('SELECT id FROM entries WHERE id = ?').get('e7');
      expect(e7Row).toBeDefined();
    });
  });

  describe('withSavepoint', () => {
    it('should automatically release savepoint on success', () => {
      const db = getTestDatabase();

      withTransaction(
        (txDb) => {
          txDb
            .prepare(
              "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j11', 'Journal 11', datetime('now'), datetime('now'))"
            )
            .run();

          withSavepoint(txDb, (db) => {
            db.prepare(
              "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e8', 'j11', 'Entry', datetime('now'), datetime('now'))"
            ).run();
          });
        },
        { database: db }
      );

      // Verify both committed
      const journalRow = db.prepare('SELECT id FROM journals WHERE id = ?').get('j11');
      expect(journalRow).toBeDefined();

      const entryRow = db.prepare('SELECT id FROM entries WHERE id = ?').get('e8');
      expect(entryRow).toBeDefined();
    });

    it('should automatically rollback savepoint on error', () => {
      const db = getTestDatabase();

      withTransaction(
        (txDb) => {
          txDb
            .prepare(
              "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j12', 'Journal 12', datetime('now'), datetime('now'))"
            )
            .run();

          try {
            withSavepoint(txDb, (db) => {
              db.prepare(
                "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e9', 'j12', 'Entry', datetime('now'), datetime('now'))"
              ).run();
              throw new Error('Savepoint error');
            });
          } catch {
            // Catch and ignore the error to continue outer transaction
          }
        },
        { database: db }
      );

      // Verify journal committed, entry rolled back
      const journalRow = db.prepare('SELECT id FROM journals WHERE id = ?').get('j12');
      expect(journalRow).toBeDefined();

      const entryResult = db
        .prepare('SELECT COUNT(*) as count FROM entries WHERE id = ?')
        .get('e9') as {
        count: number;
      };
      expect(entryResult.count).toBe(0);
    });
  });

  describe('withSavepointAsync', () => {
    it('should handle async operations with savepoint', async () => {
      const db = getTestDatabase();

      await withTransactionAsync(
        async (txDb) => {
          txDb
            .prepare(
              "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j13', 'Journal 13', datetime('now'), datetime('now'))"
            )
            .run();

          await withSavepointAsync(txDb, async (db) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            db.prepare(
              "INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES ('e10', 'j13', 'Entry', datetime('now'), datetime('now'))"
            ).run();
          });
        },
        { database: db }
      );

      // Verify both committed
      const journalRow = db.prepare('SELECT id FROM journals WHERE id = ?').get('j13');
      expect(journalRow).toBeDefined();

      const entryRow = db.prepare('SELECT id FROM entries WHERE id = ?').get('e10');
      expect(entryRow).toBeDefined();
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
            txDb
              .prepare(
                "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j14', 'Journal 14', datetime('now'), datetime('now'))"
              )
              .run();
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
            txDb
              .prepare(
                "INSERT INTO journals (id, name, created_at, updated_at) VALUES ('j15', 'Journal 15', datetime('now'), datetime('now'))"
              )
              .run();
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
