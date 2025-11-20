import fs from 'fs';
import path from 'path';

import Database from 'better-sqlite3';
import { afterEach, beforeEach } from 'vitest';

import { runSqlScript } from '@main/database/utils';

let testDb: Database.Database | null = null;

/**
 * Initialize a fresh in-memory database for testing
 * This mimics the production database initialization but without file persistence
 */
export function initTestDatabase(): Database.Database {
  // Create in-memory database
  const db = new Database(':memory:');

  // Enable foreign keys (same as production)
  db.pragma('foreign_keys = ON');

  // Enable WAL mode (same as production)
  db.pragma('journal_mode = WAL');

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
export function getTestDatabase(): Database.Database {
  if (!testDb) {
    throw new Error('Test database not initialized. Call initTestDatabase() first.');
  }
  return testDb;
}

/**
 * Setup hook for database tests - creates a fresh database before each test
 */
export function useDatabaseTest() {
  beforeEach(() => {
    initTestDatabase();
  });

  afterEach(() => {
    closeTestDatabase();
  });
}

/**
 * Helper to execute a query and return all rows
 */
export function queryAll(
  db: Database.Database,
  sql: string,
  params: (string | number | null)[] = []
): unknown[][] {
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map((row) => Object.values(row));
}

/**
 * Helper to execute a query and return the first row
 */
export function queryOne(
  db: Database.Database,
  sql: string,
  params: (string | number | null)[] = []
): Record<string, unknown> | null {
  const row = db.prepare(sql).get(...params) as Record<string, unknown> | undefined;
  return row || null;
}

/**
 * Helper to count rows in a table
 */
export function countRows(db: Database.Database, table: string, whereClause = ''): number {
  const sql = whereClause
    ? `SELECT COUNT(*) as count FROM ${table} WHERE ${whereClause}`
    : `SELECT COUNT(*) as count FROM ${table}`;
  const result = db.prepare(sql).get() as { count: number };
  return result.count;
}

/**
 * Helper to verify a table exists
 */
export function tableExists(db: Database.Database, tableName: string): boolean {
  const result = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
    .get(tableName);
  return result !== undefined;
}

/**
 * Helper to verify an index exists
 */
export function indexExists(db: Database.Database, indexName: string): boolean {
  const result = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='index' AND name=?`)
    .get(indexName);
  return result !== undefined;
}
