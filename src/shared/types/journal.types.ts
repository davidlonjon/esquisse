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

export interface CreateJournalInput {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateJournalInput {
  name?: string;
  description?: string | null;
  color?: string | null;
}
