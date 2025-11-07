/**
 * Journal type definitions
 */

export interface Journal {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateJournalInput = Omit<Journal, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateJournalInput = Partial<Journal>;
