import fs from 'fs';
import path from 'path';

import type Database from 'better-sqlite3';

import { runSqlScript } from './utils';

interface Migration {
  id: string;
  up: (db: Database.Database) => void;
}

const MIGRATIONS: Migration[] = [
  {
    id: '001_initial_schema',
    up: (db) => {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      runSqlScript(db, schema);
    },
  },
  {
    id: '002_indexes',
    up: (db) => {
      db.prepare('CREATE INDEX IF NOT EXISTS idx_entries_updated_at ON entries(updated_at)').run();
      db.prepare(
        'CREATE INDEX IF NOT EXISTS idx_entries_journal_updated ON entries(journal_id, updated_at)'
      ).run();
      db.prepare(
        'CREATE INDEX IF NOT EXISTS idx_journals_updated_at ON journals(updated_at)'
      ).run();
    },
  },
  {
    id: '003_add_entry_status_field',
    up: (db) => {
      // Check if column exists before adding
      const columns = db.pragma('table_info(entries)') as Array<{ name: string }>;
      const hasStatus = columns.some((col) => col.name === 'status');

      if (!hasStatus) {
        db.prepare("ALTER TABLE entries ADD COLUMN status TEXT DEFAULT 'active'").run();
      }
      db.prepare('CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status)').run();
      db.prepare(
        'CREATE INDEX IF NOT EXISTS idx_entries_journal_status ON entries(journal_id, status)'
      ).run();
    },
  },
  {
    id: '004_add_is_favorite_field',
    up: (db) => {
      // Check if column exists before adding
      const columns = db.pragma('table_info(entries)') as Array<{ name: string }>;
      const hasFavorite = columns.some((col) => col.name === 'is_favorite');

      if (!hasFavorite) {
        db.prepare('ALTER TABLE entries ADD COLUMN is_favorite INTEGER DEFAULT 0').run();
      }
      db.prepare(
        'CREATE INDEX IF NOT EXISTS idx_entries_is_favorite ON entries(is_favorite)'
      ).run();
    },
  },
];

const MIGRATIONS_TABLE = 'schema_migrations';

export function runMigrations(db: Database.Database): void {
  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )`
  ).run();

  const appliedRows = db.prepare(`SELECT id FROM ${MIGRATIONS_TABLE}`).all() as Array<{
    id: string;
  }>;
  const appliedIds = new Set<string>(appliedRows.map((row) => row.id));

  for (const migration of MIGRATIONS) {
    if (appliedIds.has(migration.id)) {
      continue;
    }

    db.prepare('BEGIN TRANSACTION').run();
    try {
      migration.up(db);
      db.prepare(
        `INSERT INTO ${MIGRATIONS_TABLE} (id, applied_at) VALUES (?, datetime('now'))`
      ).run(migration.id);
      db.prepare('COMMIT').run();
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  }
}
