/**
 * Journal Repository Interface
 * Defines the contract for journal data access operations
 */

import type { CreateJournalInput, Journal, UpdateJournalInput } from '@shared/types';

import type { PaginationOptions } from '../../database/utils';

export interface IJournalRepository {
  /**
   * Create a new journal
   */
  create(input: CreateJournalInput): Journal;

  /**
   * Find all journals with optional pagination
   */
  findAll(options?: PaginationOptions): Journal[];

  /**
   * Find a journal by its ID
   */
  findById(id: string): Journal | null;

  /**
   * Update a journal by its ID
   */
  update(id: string, updates: UpdateJournalInput): Journal;

  /**
   * Delete a journal by its ID
   * Returns true if successful
   */
  delete(id: string): boolean;

  /**
   * Check if a journal exists by ID
   */
  exists(id: string): boolean;
}
