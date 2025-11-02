import { randomUUID } from 'crypto';

import { Journal } from '../../shared/ipc-types';

import { getDatabase, saveDatabase } from './index';

/**
 * Create a new journal
 */
export function createJournal(journal: Omit<Journal, 'id' | 'createdAt' | 'updatedAt'>): Journal {
  const db = getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO journals (id, name, description, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, journal.name, journal.description || null, journal.color || null, now, now]
  );

  saveDatabase();

  return {
    id,
    name: journal.name,
    description: journal.description,
    color: journal.color,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get all journals
 */
export function getAllJournals(): Journal[] {
  const db = getDatabase();
  const result = db.exec(`
    SELECT id, name, description, color, created_at as createdAt, updated_at as updatedAt
    FROM journals
    ORDER BY updated_at DESC
  `);

  if (result.length === 0) return [];

  const journals: Journal[] = [];
  const columns = result[0].columns;
  const values = result[0].values;

  for (const row of values) {
    const journal: Record<string, unknown> = {};
    columns.forEach((col, idx) => {
      journal[col] = row[idx];
    });
    journals.push(journal as Journal);
  }

  return journals;
}

/**
 * Get a journal by ID
 */
export function getJournalById(id: string): Journal | null {
  const db = getDatabase();
  const result = db.exec(
    `SELECT id, name, description, color, created_at as createdAt, updated_at as updatedAt
     FROM journals WHERE id = ?`,
    [id]
  );

  if (result.length === 0 || result[0].values.length === 0) return null;

  const columns = result[0].columns;
  const row = result[0].values[0];
  const journal: Record<string, unknown> = {};
  columns.forEach((col, idx) => {
    journal[col] = row[idx];
  });

  return journal as Journal;
}

/**
 * Update a journal
 */
export function updateJournal(id: string, updates: Partial<Journal>): Journal {
  const db = getDatabase();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: (string | null | undefined)[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    values.push(updates.color);
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  db.run(`UPDATE journals SET ${fields.join(', ')} WHERE id = ?`, values);

  saveDatabase();

  return getJournalById(id)!;
}

/**
 * Delete a journal (and all its entries due to CASCADE)
 */
export function deleteJournal(id: string): boolean {
  const db = getDatabase();
  db.run('DELETE FROM journals WHERE id = ?', [id]);
  saveDatabase();
  return true;
}
