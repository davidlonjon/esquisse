/**
 * Entry Database Functions
 * Backward-compatible wrapper functions that delegate to the repository layer
 * @deprecated Use EntryRepository or EntryService instead
 */

import type { CreateEntryInput, Entry, UpdateEntryInput } from '@shared/types';

import { getContainer } from '../domain/container';

import type { PaginationOptions } from './utils';

/**
 * Create a new entry
 * @deprecated Use EntryService.createEntry() instead
 */
export function createEntry(entry: CreateEntryInput): Entry {
  return getContainer().entryRepository.create(entry);
}

/**
 * Get all entries, optionally filtered by journal ID
 * @deprecated Use EntryService.getAllEntries() instead
 */
export function getAllEntries(journalId?: string, options?: PaginationOptions): Entry[] {
  return getContainer().entryRepository.findAll(journalId, options);
}

/**
 * Get an entry by ID
 * @deprecated Use EntryService.getEntryById() instead
 */
export function getEntryById(id: string): Entry | null {
  return getContainer().entryRepository.findById(id);
}

/**
 * Update an entry
 * @deprecated Use EntryService.updateEntry() instead
 */
export function updateEntry(id: string, updates: UpdateEntryInput): Entry {
  return getContainer().entryRepository.update(id, updates);
}

/**
 * Delete an entry
 * @deprecated Use EntryService.deleteEntry() instead
 */
export function deleteEntry(id: string): boolean {
  return getContainer().entryRepository.delete(id);
}

/**
 * Search entries using LIKE queries (FTS5 not available in sql.js)
 * @deprecated Use EntryService.searchEntries() instead
 */
export function searchEntries(query: string, options?: PaginationOptions): Entry[] {
  return getContainer().entryRepository.search(query, options);
}
