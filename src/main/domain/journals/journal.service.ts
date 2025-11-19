/**
 * Journal Service
 * Business logic layer for journal operations
 */

import type { CreateJournalInput, Journal, UpdateJournalInput } from '@shared/types';

import type { PaginationOptions } from '../../database/utils';

import type { IJournalRepository } from './journal.repository.interface';

export class JournalService {
  constructor(private readonly repository: IJournalRepository) {}

  /**
   * Create a new journal
   * Business rules:
   * - Name is required and must not be empty
   * - Description and color are optional
   */
  createJournal(input: CreateJournalInput): Journal {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Journal name cannot be empty');
    }

    return this.repository.create(input);
  }

  /**
   * Get all journals with optional pagination
   */
  getAllJournals(options?: PaginationOptions): Journal[] {
    return this.repository.findAll(options);
  }

  /**
   * Get a journal by ID
   */
  getJournalById(id: string): Journal | null {
    return this.repository.findById(id);
  }

  /**
   * Update a journal
   * Business rules:
   * - Journal must exist
   * - If name is provided, it must not be empty
   */
  updateJournal(id: string, updates: UpdateJournalInput): Journal {
    if (!this.repository.exists(id)) {
      throw new Error(`Journal with id ${id} not found`);
    }

    if (updates.name !== undefined && updates.name.trim().length === 0) {
      throw new Error('Journal name cannot be empty');
    }

    return this.repository.update(id, updates);
  }

  /**
   * Delete a journal
   * Note: Entries are cascade-deleted by the database
   */
  deleteJournal(id: string): boolean {
    if (!this.repository.exists(id)) {
      throw new Error(`Journal with id ${id} not found`);
    }

    return this.repository.delete(id);
  }

  /**
   * Check if a journal exists
   */
  journalExists(id: string): boolean {
    return this.repository.exists(id);
  }
}
