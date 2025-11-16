import { randomUUID } from 'crypto';

import type { CreateJournalInput, Journal, UpdateJournalInput } from '@shared/types';

import { createPaginationClause, selectOneRow, selectRows, type PaginationOptions } from './utils';

import { getDatabase, withTransaction } from './index';

const JOURNAL_COLUMNS =
  'id, name, description, color, created_at as createdAt, updated_at as updatedAt';

const mapJournalRow = (row: Record<string, unknown>): Journal => ({
  id: String(row.id),
  name: String(row.name),
  description: row.description == null ? undefined : String(row.description),
  color: row.color == null ? undefined : String(row.color),
  createdAt: String(row.createdAt),
  updatedAt: String(row.updatedAt),
});

/**
 * Create a new journal
 */
export function createJournal(input: CreateJournalInput): Journal {
  return withTransaction((db) => {
    const id = randomUUID();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO journals (id, name, description, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, input.name, input.description ?? null, input.color ?? null, now, now]
    );

    return {
      id,
      name: input.name,
      description: input.description,
      color: input.color,
      createdAt: now,
      updatedAt: now,
    };
  });
}

/**
 * Get all journals
 */
export function getAllJournals(options?: PaginationOptions): Journal[] {
  const db = getDatabase();
  const { clause, params } = createPaginationClause(options);
  const rows = selectRows(
    db,
    `SELECT ${JOURNAL_COLUMNS} FROM journals ORDER BY updated_at DESC${clause}`,
    params
  );
  return rows.map(mapJournalRow);
}

/**
 * Get a journal by ID
 */
export function getJournalById(id: string): Journal | null {
  const db = getDatabase();
  const row = selectOneRow(db, `SELECT ${JOURNAL_COLUMNS} FROM journals WHERE id = ?`, [id]);
  return row ? mapJournalRow(row) : null;
}

/**
 * Update a journal
 */
export function updateJournal(id: string, updates: UpdateJournalInput): Journal {
  return withTransaction((db) => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: (string | null)[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name ?? null);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description ?? null);
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color ?? null);
    }

    if (fields.length === 0) {
      const journal = getJournalById(id);
      if (!journal) {
        throw new Error(`Journal with id ${id} not found`);
      }
      return journal;
    }

    fields.push('updated_at = ?');
    values.push(now, id);

    db.run(`UPDATE journals SET ${fields.join(', ')} WHERE id = ?`, values);

    const updated = getJournalById(id);
    if (!updated) {
      throw new Error(`Journal with id ${id} not found after update`);
    }
    return updated;
  });
}

/**
 * Delete a journal (and all its entries due to CASCADE)
 */
export function deleteJournal(id: string): boolean {
  return withTransaction((db) => {
    db.run('DELETE FROM journals WHERE id = ?', [id]);
    return true;
  });
}
