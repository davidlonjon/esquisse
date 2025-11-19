/**
 * Journal Database Functions
 * Backward-compatible wrapper functions that delegate to the repository layer
 * @deprecated Use JournalRepository or JournalService instead
 */

import type { CreateJournalInput, Journal, UpdateJournalInput } from '@shared/types';

import { getContainer } from '../domain/container';

import type { PaginationOptions } from './utils';

/**
 * Create a new journal
 * @deprecated Use JournalService.createJournal() instead
 */
export function createJournal(input: CreateJournalInput): Journal {
  return getContainer().journalRepository.create(input);
}

/**
 * Get all journals
 * @deprecated Use JournalService.getAllJournals() instead
 */
export function getAllJournals(options?: PaginationOptions): Journal[] {
  return getContainer().journalRepository.findAll(options);
}

/**
 * Get a journal by ID
 * @deprecated Use JournalService.getJournalById() instead
 */
export function getJournalById(id: string): Journal | null {
  return getContainer().journalRepository.findById(id);
}

/**
 * Update a journal
 * @deprecated Use JournalService.updateJournal() instead
 */
export function updateJournal(id: string, updates: UpdateJournalInput): Journal {
  return getContainer().journalRepository.update(id, updates);
}

/**
 * Delete a journal (and all its entries due to CASCADE)
 * @deprecated Use JournalService.deleteJournal() instead
 */
export function deleteJournal(id: string): boolean {
  return getContainer().journalRepository.delete(id);
}
