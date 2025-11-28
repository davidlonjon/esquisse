/**
 * Entry type definitions
 */

export type EntryStatus = 'active' | 'archived' | 'draft';

export interface Entry {
  id: string;
  journalId: string;
  title?: string;
  content: string;
  tags?: string[];
  status: EntryStatus;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntryInput {
  journalId: string;
  title?: string;
  content: string;
  tags?: string[];
  status?: EntryStatus;
  isFavorite?: boolean;
}

export interface UpdateEntryInput {
  title?: string | null;
  content?: string;
  tags?: string[] | null;
  status?: EntryStatus;
  isFavorite?: boolean;
  createdAt?: string;
}

export const isActiveEntry = (entry: Entry): boolean => entry.status === 'active';
export const isArchivedEntry = (entry: Entry): boolean => entry.status === 'archived';
export const isDraftEntry = (entry: Entry): boolean => entry.status === 'draft';
