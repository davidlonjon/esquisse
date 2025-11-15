import type { CreateEntryInput, Entry, UpdateEntryInput } from '@shared/types';

import { getWindowAPI, resolveResult } from './utils';

export const entryService = {
  async list(journalId?: string): Promise<Entry[]> {
    const api = getWindowAPI();
    return resolveResult(await api.getAllEntries(journalId));
  },

  async create(input: CreateEntryInput): Promise<Entry> {
    const api = getWindowAPI();
    return resolveResult(await api.createEntry(input));
  },

  async update(id: string, updates: UpdateEntryInput): Promise<Entry> {
    const api = getWindowAPI();
    return resolveResult(await api.updateEntry(id, updates));
  },

  async remove(id: string): Promise<void> {
    const api = getWindowAPI();
    resolveResult(await api.deleteEntry(id));
  },

  async search(query: string): Promise<Entry[]> {
    const api = getWindowAPI();
    return resolveResult(await api.searchEntries(query));
  },
};
