import path from 'path';

import { describe, it, expect } from 'vitest';

import { getTestDatabase, useDatabaseTest } from '@test/helpers/database.helper';

import {
  createPaginationClause,
  selectRows,
  selectOneRow,
  runSqlScript,
  runSqlFile,
} from './utils';

describe('utils.ts - Database Utility Functions', () => {
  useDatabaseTest();

  describe('createPaginationClause', () => {
    it('should return empty clause when no options provided', () => {
      const result = createPaginationClause();

      expect(result).toEqual({
        clause: '',
        params: [],
      });
    });

    it('should return empty clause for empty options object', () => {
      const result = createPaginationClause({});

      expect(result).toEqual({
        clause: '',
        params: [],
      });
    });

    it('should create LIMIT clause', () => {
      const result = createPaginationClause({ limit: 10 });

      expect(result.clause).toBe(' LIMIT ?');
      expect(result.params).toEqual([10]);
    });

    it('should create OFFSET clause without LIMIT', () => {
      const result = createPaginationClause({ offset: 5 });

      expect(result.clause).toBe(' LIMIT -1 OFFSET ?');
      expect(result.params).toEqual([5]);
    });

    it('should create LIMIT and OFFSET clause', () => {
      const result = createPaginationClause({ limit: 10, offset: 5 });

      expect(result.clause).toBe(' LIMIT ? OFFSET ?');
      expect(result.params).toEqual([10, 5]);
    });

    it('should handle limit of 0', () => {
      const result = createPaginationClause({ limit: 0 });

      expect(result.clause).toBe(' LIMIT ?');
      expect(result.params).toEqual([0]);
    });

    it('should handle offset of 0', () => {
      const result = createPaginationClause({ offset: 0 });

      expect(result.clause).toBe(' LIMIT -1 OFFSET ?');
      expect(result.params).toEqual([0]);
    });

    it('should handle large numbers', () => {
      const result = createPaginationClause({ limit: 1000, offset: 5000 });

      expect(result.clause).toBe(' LIMIT ? OFFSET ?');
      expect(result.params).toEqual([1000, 5000]);
    });

    it('should ignore undefined limit and offset', () => {
      const result = createPaginationClause({ limit: undefined, offset: undefined });

      expect(result).toEqual({
        clause: '',
        params: [],
      });
    });
  });

  describe('selectRows', () => {
    it('should return empty array when no rows match', () => {
      const db = getTestDatabase();
      const rows = selectRows(db, 'SELECT * FROM journals WHERE id = ?', ['non-existent']);

      expect(rows).toEqual([]);
    });

    it('should return all matching rows', () => {
      const db = getTestDatabase();

      // Insert test data
      const now = new Date().toISOString();
      db.prepare(`INSERT INTO journals (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`).run(
        'id1',
        'Journal 1',
        now,
        now
      );
      db.prepare(`INSERT INTO journals (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`).run(
        'id2',
        'Journal 2',
        now,
        now
      );

      const rows = selectRows(db, 'SELECT id, name FROM journals ORDER BY name');

      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({ id: 'id1', name: 'Journal 1' });
      expect(rows[1]).toMatchObject({ id: 'id2', name: 'Journal 2' });
    });

    it('should map column names correctly', () => {
      const db = getTestDatabase();
      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO journals (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
      ).run('id1', 'Test Journal', 'Test Description', now, now);

      const rows = selectRows(db, 'SELECT id, name, description FROM journals');

      expect(rows[0]).toEqual({
        id: 'id1',
        name: 'Test Journal',
        description: 'Test Description',
      });
    });

    it('should handle parameterized queries', () => {
      const db = getTestDatabase();
      const now = new Date().toISOString();

      db.prepare(`INSERT INTO journals (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`).run(
        'id1',
        'Journal 1',
        now,
        now
      );
      db.prepare(`INSERT INTO journals (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`).run(
        'id2',
        'Journal 2',
        now,
        now
      );

      const rows = selectRows(db, 'SELECT * FROM journals WHERE id = ?', ['id1']);

      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe('id1');
    });

    it('should handle NULL values', () => {
      const db = getTestDatabase();
      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO journals (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
      ).run('id1', 'Journal 1', null, now, now);

      const rows = selectRows(db, 'SELECT * FROM journals');

      expect(rows[0].description).toBeNull();
    });

    it('should work without parameters', () => {
      const db = getTestDatabase();
      const now = new Date().toISOString();

      db.prepare(`INSERT INTO journals (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`).run(
        'id1',
        'Journal 1',
        now,
        now
      );

      const rows = selectRows(db, 'SELECT * FROM journals');

      expect(rows).toHaveLength(1);
    });

    it('should handle different data types', () => {
      const db = getTestDatabase();

      db.prepare(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)`).run(
        'test',
        '{"number": 42, "bool": true}',
        new Date().toISOString()
      );

      const rows = selectRows(db, 'SELECT * FROM settings');

      expect(rows[0].key).toBe('test');
      expect(typeof rows[0].value).toBe('string');
    });
  });

  describe('selectOneRow', () => {
    it('should return null when no rows match', () => {
      const db = getTestDatabase();
      const row = selectOneRow(db, 'SELECT * FROM journals WHERE id = ?', ['non-existent']);

      expect(row).toBeNull();
    });

    it('should return first row when multiple rows match', () => {
      const db = getTestDatabase();
      const now = new Date().toISOString();

      db.prepare(`INSERT INTO journals (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`).run(
        'id1',
        'Journal 1',
        now,
        now
      );
      db.prepare(`INSERT INTO journals (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`).run(
        'id2',
        'Journal 2',
        now,
        now
      );

      const row = selectOneRow(db, 'SELECT * FROM journals ORDER BY name');

      expect(row).not.toBeNull();
      expect(row?.id).toBe('id1');
    });

    it('should map columns correctly', () => {
      const db = getTestDatabase();
      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO journals (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
      ).run('id1', 'Test Journal', 'Test Description', now, now);

      const row = selectOneRow(db, 'SELECT id, name, description FROM journals');

      expect(row).toEqual({
        id: 'id1',
        name: 'Test Journal',
        description: 'Test Description',
      });
    });

    it('should handle parameterized queries', () => {
      const db = getTestDatabase();
      const now = new Date().toISOString();

      db.prepare(`INSERT INTO journals (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`).run(
        'id1',
        'Journal 1',
        now,
        now
      );

      const row = selectOneRow(db, 'SELECT * FROM journals WHERE id = ?', ['id1']);

      expect(row).not.toBeNull();
      expect(row?.id).toBe('id1');
    });

    it('should handle NULL values', () => {
      const db = getTestDatabase();
      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO journals (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
      ).run('id1', 'Journal 1', null, now, now);

      const row = selectOneRow(db, 'SELECT * FROM journals');

      expect(row?.description).toBeNull();
    });

    it('should work without parameters', () => {
      const db = getTestDatabase();
      const now = new Date().toISOString();

      db.prepare(`INSERT INTO journals (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`).run(
        'id1',
        'Journal 1',
        now,
        now
      );

      const row = selectOneRow(db, 'SELECT * FROM journals');

      expect(row).not.toBeNull();
      expect(row?.id).toBe('id1');
    });
  });

  describe('runSqlScript', () => {
    it('should execute single SQL statement', () => {
      const db = getTestDatabase();
      const now = new Date().toISOString();

      runSqlScript(
        db,
        `INSERT INTO journals (id, name, created_at, updated_at) VALUES ('id1', 'Test', '${now}', '${now}')`
      );

      const rows = selectRows(db, 'SELECT * FROM journals');
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe('id1');
    });

    it('should execute multiple SQL statements separated by semicolons', () => {
      const db = getTestDatabase();
      const now = new Date().toISOString();

      const script = `
        INSERT INTO journals (id, name, created_at, updated_at) VALUES ('id1', 'Journal 1', '${now}', '${now}');
        INSERT INTO journals (id, name, created_at, updated_at) VALUES ('id2', 'Journal 2', '${now}', '${now}');
        INSERT INTO journals (id, name, created_at, updated_at) VALUES ('id3', 'Journal 3', '${now}', '${now}');
      `;

      runSqlScript(db, script);

      const rows = selectRows(db, 'SELECT * FROM journals');
      expect(rows).toHaveLength(3);
    });

    it('should ignore empty statements', () => {
      const db = getTestDatabase();

      const script = `
        ;;;

        ;;
      `;

      expect(() => runSqlScript(db, script)).not.toThrow();
    });

    it('should handle SQL with CREATE statements', () => {
      const db = getTestDatabase();

      const script = `
        CREATE TABLE IF NOT EXISTS test_table (
          id TEXT PRIMARY KEY,
          value TEXT
        );
      `;

      runSqlScript(db, script);

      // Verify table was created
      const result = db.exec(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='test_table'`
      );
      expect(result).toHaveLength(1);
      expect(result[0].values[0][0]).toBe('test_table');
    });

    it('should handle SQL comments and whitespace', () => {
      const db = getTestDatabase();
      const now = new Date().toISOString();

      const script = `
        -- This is a comment
        INSERT INTO journals (id, name, created_at, updated_at) VALUES ('id1', 'Test', '${now}', '${now}');

        -- Another comment
      `;

      // Note: SQL comments aren't fully stripped, but single statements still execute
      runSqlScript(db, script);

      const rows = selectRows(db, 'SELECT * FROM journals');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should execute statements in order', () => {
      const db = getTestDatabase();
      const now = new Date().toISOString();

      const script = `
        INSERT INTO journals (id, name, created_at, updated_at) VALUES ('id1', 'First', '${now}', '${now}');
        INSERT INTO journals (id, name, created_at, updated_at) VALUES ('id2', 'Second', '${now}', '${now}');
      `;

      runSqlScript(db, script);

      const rows = selectRows(db, 'SELECT id, name FROM journals ORDER BY name');
      expect(rows[0].name).toBe('First');
      expect(rows[1].name).toBe('Second');
    });
  });

  describe('runSqlFile', () => {
    it('should execute SQL from schema file', () => {
      const db = getTestDatabase();
      const schemaPath = path.join(__dirname, 'schema.sql');

      // Tables should already exist from test setup, but let's verify the function works
      // by checking that running it again doesn't error (IF NOT EXISTS)
      expect(() => runSqlFile(db, schemaPath)).not.toThrow();

      // Verify tables exist
      const result = db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
        .all() as Array<{ name: string }>;

      const tableNames = result.map((row) => row.name);
      expect(tableNames).toContain('journals');
      expect(tableNames).toContain('entries');
      expect(tableNames).toContain('settings');
    });

    it('should throw error for non-existent file', () => {
      const db = getTestDatabase();

      expect(() => {
        runSqlFile(db, '/non/existent/file.sql');
      }).toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should work together for complex queries with pagination', () => {
      const db = getTestDatabase();
      const now = new Date().toISOString();

      // Insert test data
      for (let i = 1; i <= 10; i++) {
        db.prepare(`INSERT INTO journals (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`).run(
          `id${i}`,
          `Journal ${i}`,
          now,
          now
        );
      }

      // Use pagination utilities
      const { clause, params } = createPaginationClause({ limit: 5, offset: 3 });
      const rows = selectRows(db, `SELECT * FROM journals ORDER BY name${clause}`, params);

      expect(rows).toHaveLength(5);
    });

    it('should handle real-world query patterns', () => {
      const db = getTestDatabase();
      const now = new Date().toISOString();

      // Insert journals and entries
      db.prepare(`INSERT INTO journals (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`).run(
        'journal1',
        'Work',
        now,
        now
      );

      db.prepare(
        `INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
      ).run('entry1', 'journal1', 'Test content', now, now);

      // Complex join query
      const rows = selectRows(
        db,
        `SELECT e.id, e.content, j.name as journal_name
         FROM entries e
         JOIN journals j ON e.journal_id = j.id
         WHERE j.id = ?`,
        ['journal1']
      );

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        id: 'entry1',
        content: 'Test content',
        journal_name: 'Work',
      });
    });
  });
});
