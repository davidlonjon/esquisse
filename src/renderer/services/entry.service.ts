import type { CreateEntryInput, Entry, UpdateEntryInput } from '@shared/types';
import {
  CreateEntryInputSchema,
  IdSchema,
  SearchQuerySchema,
  UpdateEntryInputSchema,
} from '@shared/types';

import { getWindowAPI, resolveResult } from './utils';

export const entryService = {
  async list(journalId?: string): Promise<Entry[]> {
    const validatedJournalId = journalId ? IdSchema.parse(journalId) : undefined;
    const api = getWindowAPI();
    return resolveResult(await api.getAllEntries(validatedJournalId));
  },

  async create(input: CreateEntryInput): Promise<Entry> {
    const validated = CreateEntryInputSchema.parse(input);
    const api = getWindowAPI();
    return resolveResult(await api.createEntry(validated));
  },

  async update(id: string, updates: UpdateEntryInput): Promise<Entry> {
    const validatedId = IdSchema.parse(id);
    const validatedUpdates = UpdateEntryInputSchema.parse(updates);
    const api = getWindowAPI();
    return resolveResult(await api.updateEntry(validatedId, validatedUpdates));
  },

  async remove(id: string): Promise<void> {
    const validatedId = IdSchema.parse(id);
    const api = getWindowAPI();
    resolveResult(await api.deleteEntry(validatedId));
  },

  async search(query: string): Promise<Entry[]> {
    const validatedQuery = SearchQuerySchema.parse(query);
    const api = getWindowAPI();
    return resolveResult(await api.searchEntries(validatedQuery));
  },
};
