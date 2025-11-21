/**
 * Entry Service
 * Business logic layer for entry operations
 */

import type { CreateEntryInput, Entry, EntryStatus, UpdateEntryInput } from '@shared/types';

import type { PaginationOptions } from '../../database/utils';
import type { IJournalRepository } from '../journals/journal.repository.interface';

import type { FindAllOptions, IEntryRepository } from './entry.repository.interface';

export class EntryService {
  constructor(
    private readonly entryRepository: IEntryRepository,
    private readonly journalRepository: IJournalRepository
  ) {}

  /**
   * Create a new entry
   * Business rules:
   * - Journal must exist
   * - Content is required
   */
  createEntry(input: CreateEntryInput): Entry {
    // Validate journal exists
    if (!this.journalRepository.exists(input.journalId)) {
      throw new Error(`Journal with id ${input.journalId} not found`);
    }

    if (!input.content || input.content.trim().length === 0) {
      throw new Error('Entry content cannot be empty');
    }

    return this.entryRepository.create(input);
  }

  /**
   * Get all entries with optional filtering
   */
  getAllEntries(options?: FindAllOptions): Entry[] {
    // If filtering by journal, validate it exists
    if (options?.journalId && !this.journalRepository.exists(options.journalId)) {
      throw new Error(`Journal with id ${options.journalId} not found`);
    }

    return this.entryRepository.findAll(options);
  }

  /**
   * Get an entry by ID
   */
  getEntryById(id: string): Entry | null {
    return this.entryRepository.findById(id);
  }

  /**
   * Update an entry
   * Business rules:
   * - Entry must exist
   * - If content is provided, it must not be empty
   */
  updateEntry(id: string, updates: UpdateEntryInput): Entry {
    if (!this.entryRepository.exists(id)) {
      throw new Error(`Entry with id ${id} not found`);
    }

    if (updates.content !== undefined && updates.content.trim().length === 0) {
      throw new Error('Entry content cannot be empty');
    }

    return this.entryRepository.update(id, updates);
  }

  /**
   * Delete an entry
   */
  deleteEntry(id: string): boolean {
    if (!this.entryRepository.exists(id)) {
      throw new Error(`Entry with id ${id} not found`);
    }

    return this.entryRepository.delete(id);
  }

  /**
   * Search entries by query string
   */
  searchEntries(query: string, options?: PaginationOptions): Entry[] {
    return this.entryRepository.search(query, options);
  }

  /**
   * Check if an entry exists
   */
  entryExists(id: string): boolean {
    return this.entryRepository.exists(id);
  }

  /**
   * Archive an entry
   */
  archiveEntry(id: string): Entry {
    if (!this.entryRepository.exists(id)) {
      throw new Error(`Entry with id ${id} not found`);
    }
    return this.entryRepository.archive(id);
  }

  /**
   * Unarchive an entry
   */
  unarchiveEntry(id: string): Entry {
    if (!this.entryRepository.exists(id)) {
      throw new Error(`Entry with id ${id} not found`);
    }
    return this.entryRepository.unarchive(id);
  }

  /**
   * Update entry status
   */
  updateEntryStatus(id: string, status: EntryStatus): Entry {
    if (!this.entryRepository.exists(id)) {
      throw new Error(`Entry with id ${id} not found`);
    }

    const validStatuses: EntryStatus[] = ['active', 'archived', 'draft'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    return this.entryRepository.updateStatus(id, status);
  }

  /**
   * Get entries by status
   */
  getEntriesByStatus(journalId: string | undefined, status: EntryStatus): Entry[] {
    if (journalId && !this.journalRepository.exists(journalId)) {
      throw new Error(`Journal with id ${journalId} not found`);
    }
    return this.entryRepository.findAll({ journalId, status });
  }

  /**
   * Get archived entries
   */
  getArchivedEntries(journalId?: string): Entry[] {
    return this.getEntriesByStatus(journalId, 'archived');
  }
}
