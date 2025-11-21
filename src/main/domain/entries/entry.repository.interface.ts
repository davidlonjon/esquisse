/**
 * Entry Repository Interface
 * Defines the contract for entry data access operations
 */

import type { CreateEntryInput, Entry, EntryStatus, UpdateEntryInput } from '@shared/types';

import type { PaginationOptions } from '../../database/utils';

export interface FindAllOptions extends PaginationOptions {
  journalId?: string;
  status?: EntryStatus | EntryStatus[];
  includeAllStatuses?: boolean;
}

export interface IEntryRepository {
  /**
   * Create a new entry
   */
  create(input: CreateEntryInput): Entry;

  /**
   * Find all entries with optional filtering
   */
  findAll(options?: FindAllOptions): Entry[];

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

  /**
   * Update the status of an entry
   */
  updateStatus(id: string, status: EntryStatus): Entry;

  /**
   * Archive an entry
   */
  archive(id: string): Entry;

  /**
   * Unarchive an entry
   */
  unarchive(id: string): Entry;
}
