/**
 * Entry type definitions
 */

export interface Entry {
  id: string;
  journalId: string;
  title?: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type CreateEntryInput = Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEntryInput = Partial<Entry>;
