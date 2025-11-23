/**
 * SQLite Entry Repository Implementation
 * Handles entry data access using SQLite via better-sqlite3
 */

import { randomUUID } from 'crypto';

import type { CreateEntryInput, Entry, EntryStatus, UpdateEntryInput } from '@shared/types';

import { getDatabase, withTransaction } from '../../database/index';
import {
  createPaginationClause,
  selectOneRow,
  selectRows,
  type PaginationOptions,
} from '../../database/utils';

import type { FindAllOptions, IEntryRepository } from './entry.repository.interface';

const ENTRY_COLUMNS =
  'id, journal_id as journalId, title, content, tags, status, is_favorite as isFavorite, created_at as createdAt, updated_at as updatedAt';

const mapEntryRow = (row: Record<string, unknown>): Entry => ({
  id: String(row.id),
  journalId: String(row.journalId),
  title: row.title == null ? undefined : String(row.title),
  content: String(row.content ?? ''),
  tags: row.tags ? JSON.parse(String(row.tags)) : undefined,
  status: String(row.status ?? 'active') as EntryStatus,
  isFavorite: Boolean(row.isFavorite),
  createdAt: String(row.createdAt),
  updatedAt: String(row.updatedAt),
});

export class EntryRepository implements IEntryRepository {
  create(entry: CreateEntryInput): Entry {
    return withTransaction((db) => {
      const id = randomUUID();
      const now = new Date().toISOString();
      const tagsJson = entry.tags ? JSON.stringify(entry.tags) : null;
      const status = entry.status ?? 'active';
      const isFavorite = entry.isFavorite ? 1 : 0;

      db.prepare(
        `INSERT INTO entries (id, journal_id, title, content, tags, status, is_favorite, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        entry.journalId,
        entry.title ?? null,
        entry.content,
        tagsJson,
        status,
        isFavorite,
        now,
        now
      );

      return {
        id,
        journalId: entry.journalId,
        title: entry.title,
        content: entry.content,
        tags: entry.tags,
        status,
        isFavorite: Boolean(isFavorite),
        createdAt: now,
        updatedAt: now,
      };
    });
  }

  findAll(options: FindAllOptions = {}): Entry[] {
    const db = getDatabase();
    const { journalId, status, includeAllStatuses = false, limit, offset } = options;
    const { clause, params } = createPaginationClause({ limit, offset });
    let query = `SELECT ${ENTRY_COLUMNS} FROM entries WHERE 1=1`;
    const queryParams: (string | number | null)[] = [];

    if (journalId) {
      query += ' AND journal_id = ?';
      queryParams.push(journalId);
    }

    if (!includeAllStatuses) {
      if (status) {
        if (Array.isArray(status)) {
          query += ` AND status IN (${status.map(() => '?').join(',')})`;
          queryParams.push(...status);
        } else {
          query += ' AND status = ?';
          queryParams.push(status);
        }
      } else {
        query += ' AND status = ?';
        queryParams.push('active');
      }
    }

    query += ` ORDER BY updated_at DESC${clause}`;
    const rows = selectRows(db, query, [...queryParams, ...params]);
    return rows.map(mapEntryRow);
  }

  findById(id: string): Entry | null {
    const db = getDatabase();
    const row = selectOneRow(db, `SELECT ${ENTRY_COLUMNS} FROM entries WHERE id = ?`, [id]);
    return row ? mapEntryRow(row) : null;
  }

  update(id: string, updates: UpdateEntryInput): Entry {
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
      if (updates.status !== undefined) {
        fields.push('status = ?');
        values.push(updates.status);
      }
      if (updates.isFavorite !== undefined) {
        fields.push('is_favorite = ?');
        values.push(updates.isFavorite ? '1' : '0');
      }

      if (fields.length === 0) {
        const entry = this.findById(id);
        if (!entry) {
          throw new Error(`Entry with id ${id} not found`);
        }
        return entry;
      }

      fields.push('updated_at = ?');
      values.push(now, id);

      db.prepare(`UPDATE entries SET ${fields.join(', ')} WHERE id = ?`).run(...values);

      const updated = this.findById(id);
      if (!updated) {
        throw new Error(`Entry with id ${id} not found after update`);
      }
      return updated;
    });
  }

  updateStatus(id: string, status: EntryStatus): Entry {
    return withTransaction((db) => {
      const now = new Date().toISOString();
      db.prepare('UPDATE entries SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);

      const updated = this.findById(id);
      if (!updated) {
        throw new Error(`Entry ${id} not found after status update`);
      }
      return updated;
    });
  }

  archive(id: string): Entry {
    return this.updateStatus(id, 'archived');
  }

  unarchive(id: string): Entry {
    return this.updateStatus(id, 'active');
  }

  delete(id: string): boolean {
    return withTransaction((db) => {
      db.prepare('DELETE FROM entries WHERE id = ?').run(id);
      return true;
    });
  }

  search(query: string, options?: PaginationOptions): Entry[] {
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

  exists(id: string): boolean {
    const db = getDatabase();
    const row = selectOneRow(db, 'SELECT 1 FROM entries WHERE id = ? LIMIT 1', [id]);
    return row !== null;
  }
}
