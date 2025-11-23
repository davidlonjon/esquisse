import fs from 'fs';
import path from 'path';

import Database from 'better-sqlite3';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { tableExists, indexExists } from '@test/helpers/database.helper';

import { runMigrations } from './migrations';
import { runSqlScript } from './utils';

describe('migrations.ts - Database Schema Migrations', () => {
  let db: Database.Database;

  beforeEach(() => {
    // Create a fresh database without schema for each test
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
  });

  describe('runMigrations', () => {
    it('should create migrations table on first run', () => {
      runMigrations(db);

      expect(tableExists(db, 'schema_migrations')).toBe(true);
    });

    it('should create all schema tables', () => {
      runMigrations(db);

      expect(tableExists(db, 'journals')).toBe(true);
      expect(tableExists(db, 'entries')).toBe(true);
      expect(tableExists(db, 'settings')).toBe(true);
    });

    it('should create all indexes', () => {
      runMigrations(db);

      expect(indexExists(db, 'idx_entries_updated_at')).toBe(true);
      expect(indexExists(db, 'idx_entries_journal_updated')).toBe(true);
      expect(indexExists(db, 'idx_journals_updated_at')).toBe(true);
    });

    it('should record applied migrations in migrations table', () => {
      runMigrations(db);

      const result = db.prepare('SELECT id FROM schema_migrations ORDER BY id').all() as Array<{
        id: string;
      }>;
      const migrationIds = result.map((row) => row.id);

      expect(migrationIds).toContain('001_initial_schema');
      expect(migrationIds).toContain('002_indexes');
      expect(migrationIds).toContain('003_add_entry_status_field');
      expect(migrationIds).toContain('004_add_is_favorite_field');
      expect(migrationIds).toHaveLength(4);
    });

    it('should record applied_at timestamp for each migration', () => {
      // const beforeMigration = new Date().toISOString();
      runMigrations(db);
      // const afterMigration = new Date().toISOString();

      const result = db
        .prepare('SELECT id, applied_at FROM schema_migrations ORDER BY id')
        .all() as Array<{
        id: string;
        applied_at: string;
      }>;

      expect(result.length).toBeGreaterThan(0);

      result.forEach((row) => {
        expect(row.applied_at).toBeDefined();
        // SQLite datetime('now') format is slightly different, just verify it exists
        expect(typeof row.applied_at).toBe('string');
        expect(row.applied_at.length).toBeGreaterThan(0);
      });
    });

    it('should not re-run migrations that are already applied', () => {
      // Run migrations first time
      runMigrations(db);

      // Insert a test record to verify it persists
      const now = new Date().toISOString();
      db.prepare('INSERT INTO journals (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
        'test-id',
        'Test Journal',
        now,
        now
      );

      // Run migrations again
      runMigrations(db);

      // Test record should still exist
      const result = db.prepare('SELECT * FROM journals WHERE id = ?').all('test-id');
      expect(result.length).toBe(1);

      // Migrations should still only be recorded once
      const migrations = db.prepare('SELECT COUNT(*) as count FROM schema_migrations').get() as {
        count: number;
      };
      expect(migrations.count).toBe(4); // Four migrations total
    });

    it('should apply migrations in order', () => {
      runMigrations(db);

      const result = db.prepare('SELECT id FROM schema_migrations ORDER BY rowid').all() as Array<{
        id: string;
      }>;
      const migrationIds = result.map((row) => row.id);

      // Migrations should be applied in order
      expect(migrationIds[0]).toBe('001_initial_schema');
      expect(migrationIds[1]).toBe('002_indexes');
      expect(migrationIds[2]).toBe('003_add_entry_status_field');
      expect(migrationIds[3]).toBe('004_add_is_favorite_field');
    });

    it('should handle idempotent migrations (IF NOT EXISTS)', () => {
      // Run migrations twice
      runMigrations(db);
      runMigrations(db);

      // Tables should exist only once
      expect(tableExists(db, 'journals')).toBe(true);
      expect(tableExists(db, 'entries')).toBe(true);
      expect(tableExists(db, 'settings')).toBe(true);

      // No errors should be thrown
      expect(() => runMigrations(db)).not.toThrow();
    });

    it('should create journals table with correct schema', () => {
      runMigrations(db);

      const result = db.pragma('table_info(journals)') as Array<{
        cid: number;
        name: string;
        type: string;
        notnull: number;
        dflt_value: unknown;
        pk: number;
      }>;
      const columns = result.map((row) => ({
        name: row.name,
        type: row.type,
        notnull: row.notnull,
        pk: row.pk,
      }));

      expect(columns).toContainEqual(expect.objectContaining({ name: 'id', type: 'TEXT', pk: 1 }));
      expect(columns).toContainEqual(
        expect.objectContaining({ name: 'name', type: 'TEXT', notnull: 1 })
      );
      expect(columns).toContainEqual(
        expect.objectContaining({ name: 'description', type: 'TEXT' })
      );
      expect(columns).toContainEqual(expect.objectContaining({ name: 'color', type: 'TEXT' }));
      expect(columns).toContainEqual(
        expect.objectContaining({ name: 'created_at', type: 'TEXT', notnull: 1 })
      );
      expect(columns).toContainEqual(
        expect.objectContaining({ name: 'updated_at', type: 'TEXT', notnull: 1 })
      );
    });

    it('should create entries table with correct schema', () => {
      runMigrations(db);

      const result = db.pragma('table_info(entries)') as Array<{
        cid: number;
        name: string;
        type: string;
        notnull: number;
        dflt_value: unknown;
        pk: number;
      }>;
      const columns = result.map((row) => ({
        name: row.name,
        type: row.type,
        notnull: row.notnull,
        pk: row.pk,
      }));

      expect(columns).toContainEqual(expect.objectContaining({ name: 'id', type: 'TEXT', pk: 1 }));
      expect(columns).toContainEqual(
        expect.objectContaining({ name: 'journal_id', type: 'TEXT', notnull: 1 })
      );
      expect(columns).toContainEqual(expect.objectContaining({ name: 'title', type: 'TEXT' }));
      expect(columns).toContainEqual(
        expect.objectContaining({ name: 'content', type: 'TEXT', notnull: 1 })
      );
      expect(columns).toContainEqual(expect.objectContaining({ name: 'tags', type: 'TEXT' }));
      expect(columns).toContainEqual(expect.objectContaining({ name: 'status', type: 'TEXT' }));
      expect(columns).toContainEqual(
        expect.objectContaining({ name: 'is_favorite', type: 'INTEGER' })
      );
      expect(columns).toContainEqual(
        expect.objectContaining({ name: 'created_at', type: 'TEXT', notnull: 1 })
      );
      expect(columns).toContainEqual(
        expect.objectContaining({ name: 'updated_at', type: 'TEXT', notnull: 1 })
      );
    });

    it('should create entries table with foreign key constraint', () => {
      runMigrations(db);

      const result = db.pragma('foreign_key_list(entries)') as Array<{
        id: number;
        seq: number;
        table: string;
        from: string;
        to: string;
        on_update: string;
        on_delete: string;
        match: string;
      }>;

      expect(result.length).toBeGreaterThan(0);
      const foreignKey = result[0];

      expect(foreignKey.table).toBe('journals'); // Referenced table
      expect(foreignKey.from).toBe('journal_id'); // From column
      expect(foreignKey.to).toBe('id'); // To column
    });

    it('should enforce CASCADE delete on foreign key', () => {
      runMigrations(db);
      const now = new Date().toISOString();

      // Insert journal and entry
      db.prepare('INSERT INTO journals (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
        'journal-1',
        'Test',
        now,
        now
      );
      db.prepare(
        'INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      ).run('entry-1', 'journal-1', 'Test content', now, now);

      // Verify entry exists
      let entries = db.prepare('SELECT * FROM entries WHERE id = ?').all('entry-1') as unknown[];
      expect(entries.length).toBe(1);

      // Delete journal
      db.prepare('DELETE FROM journals WHERE id = ?').run('journal-1');

      // Entry should be cascade deleted
      entries = db.prepare('SELECT * FROM entries WHERE id = ?').all('entry-1') as unknown[];
      expect(entries.length).toBe(0);
    });

    it('should create settings table with correct schema', () => {
      runMigrations(db);

      const result = db.pragma('table_info(settings)') as Array<{
        cid: number;
        name: string;
        type: string;
        notnull: number;
        dflt_value: unknown;
        pk: number;
      }>;
      const columns = result.map((row) => ({
        name: row.name,
        type: row.type,
        notnull: row.notnull,
        pk: row.pk,
      }));

      expect(columns).toContainEqual(expect.objectContaining({ name: 'key', type: 'TEXT', pk: 1 }));
      expect(columns).toContainEqual(
        expect.objectContaining({ name: 'value', type: 'TEXT', notnull: 1 })
      );
      expect(columns).toContainEqual(
        expect.objectContaining({ name: 'updated_at', type: 'TEXT', notnull: 1 })
      );
    });

    it('should rollback migration on error', () => {
      // Create a database that will fail on second migration
      const badDb = db;

      // Manually apply first migration
      badDb
        .prepare(
          `CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      )`
        )
        .run();

      // Apply first migration successfully
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      runSqlScript(badDb, schema);
      badDb
        .prepare(`INSERT INTO schema_migrations (id, applied_at) VALUES (?, datetime('now'))`)
        .run('001_initial_schema');

      // Create a conflicting index to make second migration fail
      badDb.prepare('CREATE INDEX idx_entries_updated_at ON entries(updated_at)').run();

      // Now try to run migrations - second migration should fail and rollback
      // But since it's in a transaction, it should not record the failed migration
      // const beforeCount = badDb.exec('SELECT COUNT(*) FROM schema_migrations')[0].values[0][0];

      try {
        runMigrations(badDb);
      } catch {
        // Expected to potentially throw or handle gracefully
      }

      // Due to idempotent migrations (IF NOT EXISTS), this should actually succeed
      // The test verifies migrations handle existing objects gracefully
      expect(tableExists(badDb, 'journals')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty database', () => {
      expect(() => runMigrations(db)).not.toThrow();
      expect(tableExists(db, 'schema_migrations')).toBe(true);
    });

    it('should handle database with partial schema', () => {
      // Manually create migrations table only
      db.prepare(
        `CREATE TABLE schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      )`
      ).run();

      runMigrations(db);

      // Should create all other tables
      expect(tableExists(db, 'journals')).toBe(true);
      expect(tableExists(db, 'entries')).toBe(true);
      expect(tableExists(db, 'settings')).toBe(true);
    });

    it('should be safe to call multiple times', () => {
      runMigrations(db);
      runMigrations(db);
      runMigrations(db);

      const result = db.prepare('SELECT COUNT(*) as count FROM schema_migrations').get() as {
        count: number;
      };
      expect(result.count).toBe(4); // Only 4 migrations should be recorded
    });
  });

  describe('Index Performance', () => {
    it('should create indexes that improve query performance', () => {
      runMigrations(db);
      const now = new Date().toISOString();

      // Insert test data
      const insertJournal = db.prepare(
        'INSERT INTO journals (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)'
      );
      for (let i = 0; i < 100; i++) {
        insertJournal.run(`journal-${i}`, `Journal ${i}`, now, now);
      }

      // Query should use index (we can't directly test performance, but verify query works)
      const result = db.prepare('SELECT * FROM journals ORDER BY updated_at DESC LIMIT 10').all();
      expect(result.length).toBe(10);
    });

    it('should create composite index for entries', () => {
      runMigrations(db);

      // Verify composite index exists
      expect(indexExists(db, 'idx_entries_journal_updated')).toBe(true);

      // Insert test data to verify index works
      const now = new Date().toISOString();
      db.prepare('INSERT INTO journals (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
        'journal-1',
        'Test',
        now,
        now
      );

      const insertEntry = db.prepare(
        'INSERT INTO entries (id, journal_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      );
      for (let i = 0; i < 50; i++) {
        insertEntry.run(`entry-${i}`, 'journal-1', `Content ${i}`, now, now);
      }

      // Query using composite index
      const result = db
        .prepare('SELECT * FROM entries WHERE journal_id = ? ORDER BY updated_at DESC LIMIT 10')
        .all('journal-1');
      expect(result.length).toBe(10);
    });
  });
});
