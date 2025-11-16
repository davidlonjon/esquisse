import { randomUUID } from 'crypto';

import type { CreateEntryInput, Entry, UpdateEntryInput } from '@shared/types';

import { createPaginationClause, selectOneRow, selectRows, type PaginationOptions } from './utils';

import { getDatabase, withTransaction } from './index';

const ENTRY_COLUMNS =
  'id, journal_id as journalId, title, content, tags, created_at as createdAt, updated_at as updatedAt';

const mapEntryRow = (row: Record<string, unknown>): Entry => ({
  id: String(row.id),
  journalId: String(row.journalId),
  title: row.title == null ? undefined : String(row.title),
  content: String(row.content ?? ''),
  tags: row.tags ? JSON.parse(String(row.tags)) : undefined,
  createdAt: String(row.createdAt),
  updatedAt: String(row.updatedAt),
});

/**
 * Create a new entry
 */
export function createEntry(entry: CreateEntryInput): Entry {
  return withTransaction((db) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    const tagsJson = entry.tags ? JSON.stringify(entry.tags) : null;

    db.run(
      `INSERT INTO entries (id, journal_id, title, content, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, entry.journalId, entry.title ?? null, entry.content, tagsJson, now, now]
    );

    return {
      id,
      journalId: entry.journalId,
      title: entry.title,
      content: entry.content,
      tags: entry.tags,
      createdAt: now,
      updatedAt: now,
    };
  });
}

/**
 * Get all entries, optionally filtered by journal ID
 */
export function getAllEntries(journalId?: string, options?: PaginationOptions): Entry[] {
  const db = getDatabase();
  const { clause, params } = createPaginationClause(options);
  let query = `SELECT ${ENTRY_COLUMNS} FROM entries`;
  const queryParams: (string | number | null)[] = [];

  if (journalId) {
    query += ' WHERE journal_id = ?';
    queryParams.push(journalId);
  }

  query += ` ORDER BY updated_at DESC${clause}`;
  const rows = selectRows(db, query, [...queryParams, ...params]);
  return rows.map(mapEntryRow);
}

/**
 * Get an entry by ID
 */
export function getEntryById(id: string): Entry | null {
  const db = getDatabase();
  const row = selectOneRow(db, `SELECT ${ENTRY_COLUMNS} FROM entries WHERE id = ?`, [id]);
  return row ? mapEntryRow(row) : null;
}

/**
 * Update an entry
 */
export function updateEntry(id: string, updates: UpdateEntryInput): Entry {
  return withTransaction((db) => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: (string | null)[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title ?? null);
    }
    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content ?? null);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(updates.tags ? JSON.stringify(updates.tags) : null);
    }

    if (fields.length === 0) {
      const entry = getEntryById(id);
      if (!entry) {
        throw new Error(`Entry with id ${id} not found`);
      }
      return entry;
    }

    fields.push('updated_at = ?');
    values.push(now, id);

    db.run(`UPDATE entries SET ${fields.join(', ')} WHERE id = ?`, values);

    const updated = getEntryById(id);
    if (!updated) {
      throw new Error(`Entry with id ${id} not found after update`);
    }
    return updated;
  });
}

/**
 * Delete an entry
 */
export function deleteEntry(id: string): boolean {
  return withTransaction((db) => {
    db.run('DELETE FROM entries WHERE id = ?', [id]);
    return true;
  });
}

/**
 * Search entries using LIKE queries (FTS5 not available in sql.js)
 */
export function searchEntries(query: string, options?: PaginationOptions): Entry[] {
  const normalized = query.trim();
  if (!normalized) {
    return [];
  }

  const db = getDatabase();
  const searchPattern = `%${normalized}%`;
  const { clause, params } = createPaginationClause(options);
  const rows = selectRows(
    db,
    `SELECT ${ENTRY_COLUMNS}
       FROM entries
       WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?
       ORDER BY updated_at DESC${clause}`,
    [searchPattern, searchPattern, searchPattern, ...params]
  );

  return rows.map(mapEntryRow);
}
