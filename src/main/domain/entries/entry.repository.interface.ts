/**
 * Entry Repository Interface
 * Defines the contract for entry data access operations
 */

import type { CreateEntryInput, Entry, UpdateEntryInput } from '@shared/types';

import type { PaginationOptions } from '../../database/utils';

export interface IEntryRepository {
  /**
   * Create a new entry
   */
  create(input: CreateEntryInput): Entry;

  /**
   * Find all entries, optionally filtered by journal ID
   */
  findAll(journalId?: string, options?: PaginationOptions): Entry[];

  /**
   * Find an entry by its ID
   */
  findById(id: string): Entry | null;

  /**
   * Update an entry by its ID
   */
  update(id: string, updates: UpdateEntryInput): Entry;

  /**
   * Delete an entry by its ID
   * Returns true if successful
   */
  delete(id: string): boolean;

  /**
   * Search entries by query string
   * Searches in title, content, and tags
   */
  search(query: string, options?: PaginationOptions): Entry[];

  /**
   * Check if an entry exists by ID
   */
  exists(id: string): boolean;
}
