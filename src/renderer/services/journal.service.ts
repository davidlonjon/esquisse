import type { CreateJournalInput, Journal, UpdateJournalInput } from '@shared/types';

import { getWindowAPI, resolveResult } from './utils';

export const journalService = {
  async list(): Promise<Journal[]> {
    const api = getWindowAPI();
    return resolveResult(await api.getAllJournals());
  },

  async create(input: CreateJournalInput): Promise<Journal> {
    const api = getWindowAPI();
    return resolveResult(await api.createJournal(input));
  },

  async update(id: string, updates: UpdateJournalInput): Promise<Journal> {
    const api = getWindowAPI();
    return resolveResult(await api.updateJournal(id, updates));
  },

  async remove(id: string): Promise<void> {
    const api = getWindowAPI();
    resolveResult(await api.deleteJournal(id));
  },
};
