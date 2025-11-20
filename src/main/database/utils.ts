import fs from 'fs';
import path from 'path';

import type Database from 'better-sqlite3';

export type SqlValue = string | number | Uint8Array | null;

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export type SelectRow = Record<string, unknown>;

export const createPaginationClause = (options?: PaginationOptions) => {
  const params: SqlValue[] = [];
  if (!options) {
    return { clause: '', params };
  }

  let clause = '';
  if (typeof options.limit === 'number') {
    clause += ' LIMIT ?';
    params.push(options.limit);
  }
  if (typeof options.offset === 'number') {
    clause += clause.includes('LIMIT') ? ' OFFSET ?' : ' LIMIT -1 OFFSET ?';
    params.push(options.offset);
  }

  return { clause, params };
};

export const selectRows = (
  db: Database.Database,
  query: string,
  params: SqlValue[] = []
): SelectRow[] => {
  return db.prepare(query).all(...params) as SelectRow[];
};

export const selectOneRow = (
  db: Database.Database,
  query: string,
  params: SqlValue[] = []
): SelectRow | null => {
  return (db.prepare(query).get(...params) as SelectRow) || null;
};

export const runSqlScript = (db: Database.Database, sql: string): void => {
  const statements = sql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    db.prepare(statement).run();
  }
};

export const runSqlFile = (db: Database.Database, filePath: string): void => {
  const script = fs.readFileSync(path.resolve(filePath), 'utf-8');
  runSqlScript(db, script);
};
