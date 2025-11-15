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

export interface CreateEntryInput {
  journalId: string;
  title?: string;
  content: string;
  tags?: string[];
}

export interface UpdateEntryInput {
  title?: string | null;
  content?: string;
  tags?: string[] | null;
}
