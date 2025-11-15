import type { CreateJournalInput, Journal, UpdateJournalInput } from '@shared/types';

import { getWindowAPI } from './utils';

export const journalService = {
  async list(): Promise<Journal[]> {
    const api = getWindowAPI();
    return api.getAllJournals();
  },

  async create(input: CreateJournalInput): Promise<Journal> {
    const api = getWindowAPI();
    return api.createJournal(input);
  },

  async update(id: string, updates: UpdateJournalInput): Promise<Journal> {
    const api = getWindowAPI();
    return api.updateJournal(id, updates);
  },

  async remove(id: string): Promise<void> {
    const api = getWindowAPI();
    await api.deleteJournal(id);
  },
};
