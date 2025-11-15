import fs from 'fs';
import path from 'path';

import type { Database, QueryExecResult } from 'sql.js';

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

const mapRows = (result: QueryExecResult[]): SelectRow[] => {
  if (result.length === 0) return [];
  const [rows] = result;
  const { columns, values } = rows;

  return values.map((row) => {
    const mapped: SelectRow = {};
    columns.forEach((column, index) => {
      mapped[column] = row[index];
    });
    return mapped;
  });
};

export const selectRows = (db: Database, query: string, params: SqlValue[] = []): SelectRow[] =>
  mapRows(db.exec(query, params));

export const selectOneRow = (
  db: Database,
  query: string,
  params: SqlValue[] = []
): SelectRow | null => {
  const rows = selectRows(db, query, params);
  return rows[0] ?? null;
};

export const runSqlScript = (db: Database, sql: string): void => {
  const statements = sql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    db.run(statement);
  }
};

export const runSqlFile = (db: Database, filePath: string): void => {
  const script = fs.readFileSync(path.resolve(filePath), 'utf-8');
  runSqlScript(db, script);
};
