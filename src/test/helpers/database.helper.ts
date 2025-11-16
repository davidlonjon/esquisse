import fs from 'fs';
import path from 'path';

import initSqlJs, { Database } from 'sql.js';
import { afterEach, beforeEach } from 'vitest';

import { runSqlScript } from '@main/database/utils';

let testDb: Database | null = null;

/**
 * Initialize a fresh in-memory database for testing
 * This mimics the production database initialization but without file persistence
 */
export async function initTestDatabase(): Promise<Database> {
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(process.cwd(), 'node_modules/sql.js/dist', file),
  });

  const db = new SQL.Database();

  // Enable foreign keys (same as production)
  db.run('PRAGMA foreign_keys = ON');

  // Load the schema
  const schemaPath = path.join(__dirname, '../../main/database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  runSqlScript(db, schema);

  testDb = db;
  return db;
}

/**
 * Close and clean up the test database
 */
export function closeTestDatabase(): void {
  if (testDb) {
    testDb.close();
    testDb = null;
  }
}

/**
 * Get the current test database instance
 */
export function getTestDatabase(): Database {
  if (!testDb) {
    throw new Error('Test database not initialized. Call initTestDatabase() first.');
  }
  return testDb;
}

/**
 * Setup hook for database tests - creates a fresh database before each test
 */
export function useDatabaseTest() {
  beforeEach(async () => {
    await initTestDatabase();
  });

  afterEach(() => {
    closeTestDatabase();
  });
}

/**
 * Helper to execute a query and return all rows
 */
export function queryAll(
  db: Database,
  sql: string,
  params: (string | number | null)[] = []
): unknown[][] {
  const result = db.exec(sql, params);
  return result.length > 0 ? result[0].values : [];
}

/**
 * Helper to execute a query and return the first row
 */
export function queryOne(
  db: Database,
  sql: string,
  params: (string | number | null)[] = []
): Record<string, unknown> | null {
  const result = db.exec(sql, params);
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const row = result[0].values[0];
  const columns = result[0].columns;
  const mapped: Record<string, unknown> = {};
  columns.forEach((column, index) => {
    mapped[column] = row[index];
  });
  return mapped;
}

/**
 * Helper to count rows in a table
 */
export function countRows(db: Database, table: string, whereClause = ''): number {
  const sql = whereClause
    ? `SELECT COUNT(*) FROM ${table} WHERE ${whereClause}`
    : `SELECT COUNT(*) FROM ${table}`;
  const result = db.exec(sql);
  return result.length > 0 && result[0].values.length > 0 ? (result[0].values[0][0] as number) : 0;
}

/**
 * Helper to verify a table exists
 */
export function tableExists(db: Database, tableName: string): boolean {
  const result = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [
    tableName,
  ]);
  return result.length > 0 && result[0].values.length > 0;
}

/**
 * Helper to verify an index exists
 */
export function indexExists(db: Database, indexName: string): boolean {
  const result = db.exec(`SELECT name FROM sqlite_master WHERE type='index' AND name=?`, [
    indexName,
  ]);
  return result.length > 0 && result[0].values.length > 0;
}
