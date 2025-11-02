import { randomUUID } from 'crypto';

import { Entry } from '../../shared/ipc-types';

import { getDatabase, saveDatabase } from './index';

/**
 * Create a new entry
 */
export function createEntry(entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>): Entry {
  const db = getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();

  const tagsJson = entry.tags ? JSON.stringify(entry.tags) : null;

  db.run(
    `INSERT INTO entries (id, journal_id, title, content, tags, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, entry.journalId, entry.title || null, entry.content, tagsJson, now, now]
  );

  saveDatabase();

  return {
    id,
    journalId: entry.journalId,
    title: entry.title,
    content: entry.content,
    tags: entry.tags,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get all entries, optionally filtered by journal ID
 */
export function getAllEntries(journalId?: string): Entry[] {
  const db = getDatabase();

  const query = journalId
    ? `SELECT id, journal_id as journalId, title, content, tags, created_at as createdAt, updated_at as updatedAt
       FROM entries WHERE journal_id = ? ORDER BY created_at DESC`
    : `SELECT id, journal_id as journalId, title, content, tags, created_at as createdAt, updated_at as updatedAt
       FROM entries ORDER BY created_at DESC`;

  const result = journalId ? db.exec(query, [journalId]) : db.exec(query);

  if (result.length === 0) return [];

  const entries: Entry[] = [];
  const columns = result[0].columns;
  const values = result[0].values;

  for (const row of values) {
    const entry: Record<string, unknown> = {};
    columns.forEach((col, idx) => {
      if (col === 'tags' && row[idx]) {
        entry[col] = JSON.parse(row[idx] as string);
      } else {
        entry[col] = row[idx];
      }
    });
    entries.push(entry as Entry);
  }

  return entries;
}

/**
 * Get an entry by ID
 */
export function getEntryById(id: string): Entry | null {
  const db = getDatabase();
  const result = db.exec(
    `SELECT id, journal_id as journalId, title, content, tags, created_at as createdAt, updated_at as updatedAt
     FROM entries WHERE id = ?`,
    [id]
  );

  if (result.length === 0 || result[0].values.length === 0) return null;

  const columns = result[0].columns;
  const row = result[0].values[0];
  const entry: Record<string, unknown> = {};
  columns.forEach((col, idx) => {
    if (col === 'tags' && row[idx]) {
      entry[col] = JSON.parse(row[idx] as string);
    } else {
      entry[col] = row[idx];
    }
  });

  return entry as Entry;
}

/**
 * Update an entry
 */
export function updateEntry(id: string, updates: Partial<Entry>): Entry {
  const db = getDatabase();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
  }
  if (updates.tags !== undefined) {
    fields.push('tags = ?');
    values.push(JSON.stringify(updates.tags));
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  db.run(`UPDATE entries SET ${fields.join(', ')} WHERE id = ?`, values);

  saveDatabase();

  return getEntryById(id)!;
}

/**
 * Delete an entry
 */
export function deleteEntry(id: string): boolean {
  const db = getDatabase();
  db.run('DELETE FROM entries WHERE id = ?', [id]);
  saveDatabase();
  return true;
}

/**
 * Search entries using LIKE queries (FTS5 not available in sql.js)
 */
export function searchEntries(query: string): Entry[] {
  const db = getDatabase();
  const searchPattern = `%${query}%`;

  const result = db.exec(
    `SELECT id, journal_id as journalId, title, content, tags,
            created_at as createdAt, updated_at as updatedAt
     FROM entries
     WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?
     ORDER BY updated_at DESC`,
    [searchPattern, searchPattern, searchPattern]
  );

  if (result.length === 0) return [];

  const entries: Entry[] = [];
  const columns = result[0].columns;
  const values = result[0].values;

  for (const row of values) {
    const entry: Record<string, unknown> = {};
    columns.forEach((col, idx) => {
      if (col === 'tags' && row[idx]) {
        entry[col] = JSON.parse(row[idx] as string);
      } else {
        entry[col] = row[idx];
      }
    });
    entries.push(entry as Entry);
  }

  return entries;
}
