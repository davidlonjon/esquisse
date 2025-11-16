import type { CreateJournalInput, Journal, UpdateJournalInput } from '@shared/types';
import { CreateJournalInputSchema, IdSchema, UpdateJournalInputSchema } from '@shared/types';

import { getWindowAPI, resolveResult } from './utils';

export const journalService = {
  async list(): Promise<Journal[]> {
    const api = getWindowAPI();
    return resolveResult(await api.getAllJournals());
  },

  async create(input: CreateJournalInput): Promise<Journal> {
    const validated = CreateJournalInputSchema.parse(input);
    const api = getWindowAPI();
    return resolveResult(await api.createJournal(validated));
  },

  async update(id: string, updates: UpdateJournalInput): Promise<Journal> {
    const validatedId = IdSchema.parse(id);
    const validatedUpdates = UpdateJournalInputSchema.parse(updates);
    const api = getWindowAPI();
    return resolveResult(await api.updateJournal(validatedId, validatedUpdates));
  },

  async remove(id: string): Promise<void> {
    const validatedId = IdSchema.parse(id);
    const api = getWindowAPI();
    resolveResult(await api.deleteJournal(validatedId));
  },
};
