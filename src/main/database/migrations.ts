import fs from 'fs';
import path from 'path';

import type { Database } from 'sql.js';

import { runSqlScript } from './utils';

interface Migration {
  id: string;
  up: (db: Database) => void;
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
      db.run('CREATE INDEX IF NOT EXISTS idx_entries_updated_at ON entries(updated_at)');
      db.run(
        'CREATE INDEX IF NOT EXISTS idx_entries_journal_updated ON entries(journal_id, updated_at)'
      );
      db.run('CREATE INDEX IF NOT EXISTS idx_journals_updated_at ON journals(updated_at)');
    },
  },
];

const MIGRATIONS_TABLE = 'schema_migrations';

export function runMigrations(db: Database): void {
  db.run(
    `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )`
  );

  const appliedResult = db.exec(`SELECT id FROM ${MIGRATIONS_TABLE}`);
  const appliedIds = new Set<string>();
  if (appliedResult.length > 0) {
    const rows = appliedResult[0];
    rows.values.forEach((row) => {
      appliedIds.add(row[0] as string);
    });
  }

  for (const migration of MIGRATIONS) {
    if (appliedIds.has(migration.id)) {
      continue;
    }

    db.run('BEGIN TRANSACTION');
    try {
      migration.up(db);
      db.run(`INSERT INTO ${MIGRATIONS_TABLE} (id, applied_at) VALUES (?, datetime('now'))`, [
        migration.id,
      ]);
      db.run('COMMIT');
    } catch (error) {
      db.run('ROLLBACK');
      throw error;
    }
  }
}
