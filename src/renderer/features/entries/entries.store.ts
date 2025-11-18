import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { createAsyncSlice, toAsyncSlice, withAsyncHandler, type AsyncSlice } from '@lib/store';
import { entryService } from '@services/entry.service';
import type { CreateEntryInput, Entry, UpdateEntryInput } from '@shared/types';

type EntryLookup = Record<string, Entry>;

interface EntrySearchState {
  query: string;
  results: Entry[];
  status: AsyncSlice;
}

interface EntryProgressState {
  load: AsyncSlice;
  save: AsyncSlice;
  remove: AsyncSlice;
  search: AsyncSlice;
}

interface EntryState {
  entries: Entry[];
  entryLookup: EntryLookup;
  currentEntryId: string | null;
  search: EntrySearchState;
  progress: EntryProgressState;
  loadEntries: (journalId?: string) => Promise<Entry[]>;
  createEntry: (entry: CreateEntryInput) => Promise<Entry>;
  updateEntry: (id: string, updates: UpdateEntryInput) => Promise<Entry>;
  deleteEntry: (id: string) => Promise<void>;
  searchEntries: (query: string) => Promise<Entry[]>;
  clearSearch: () => void;
  setCurrentEntry: (entry: Entry | null) => void;
  setCurrentEntryId: (entryId: string | null) => void;
}

const createLookup = (entries: Entry[]): EntryLookup =>
  entries.reduce<EntryLookup>((acc, entry) => {
    acc[entry.id] = entry;
    return acc;
  }, {});

const initialEntries: Entry[] = [];

const createInitialState = (): EntryState => ({
  entries: initialEntries,
  entryLookup: createLookup(initialEntries),
  currentEntryId: null,
  search: {
    query: '',
    results: [],
    status: createAsyncSlice(),
  },
  progress: {
    load: createAsyncSlice(),
    save: createAsyncSlice(),
    remove: createAsyncSlice(),
    search: createAsyncSlice(),
  },
  loadEntries: async () => [],
  createEntry: async () => {
    throw new Error('Store not initialized');
  },
  updateEntry: async () => {
    throw new Error('Store not initialized');
  },
  deleteEntry: async () => {
    throw new Error('Store not initialized');
  },
  searchEntries: async () => [],
  clearSearch: () => undefined,
  setCurrentEntry: () => undefined,
  setCurrentEntryId: () => undefined,
});

export const useEntryStore = create(
  immer<EntryState>((set) => ({
    ...createInitialState(),

    loadEntries: async (journalId) => {
      return withAsyncHandler(set, 'load', async () => {
        const entries = await entryService.list(journalId);
        const lookup = createLookup(entries);

        set((state) => {
          state.entries = entries;
          state.entryLookup = lookup;
          state.currentEntryId =
            state.currentEntryId && lookup[state.currentEntryId] ? state.currentEntryId : null;
        });

        return entries;
      });
    },

    createEntry: async (entry) => {
      return withAsyncHandler(set, 'save', async () => {
        const newEntry = await entryService.create(entry);
        set((state) => {
          state.entries.unshift(newEntry);
          state.entryLookup[newEntry.id] = newEntry;
        });
        return newEntry;
      });
    },

    updateEntry: async (id, updates) => {
      return withAsyncHandler(set, 'save', async () => {
        const updated = await entryService.update(id, updates);
        set((state) => {
          if (!state.entryLookup[id]) {
            return;
          }

          const entryIndex = state.entries.findIndex((e) => e.id === id);
          if (entryIndex !== -1) {
            state.entries[entryIndex] = updated;
          }
          state.entryLookup[id] = updated;

          const searchResultIndex = state.search.results.findIndex((e) => e.id === id);
          if (searchResultIndex !== -1) {
            state.search.results[searchResultIndex] = updated;
          }
        });

        return updated;
      });
    },

    deleteEntry: async (id) => {
      return withAsyncHandler(set, 'remove', async () => {
        await entryService.remove(id);
        set((state) => {
          if (!state.entryLookup[id]) {
            return;
          }

          const entryIndex = state.entries.findIndex((e) => e.id === id);
          if (entryIndex !== -1) {
            state.entries.splice(entryIndex, 1);
          }
          delete state.entryLookup[id];

          if (state.currentEntryId === id) {
            state.currentEntryId = null;
          }

          const searchResultIndex = state.search.results.findIndex((e) => e.id === id);
          if (searchResultIndex !== -1) {
            state.search.results.splice(searchResultIndex, 1);
          }
        });
      });
    },

    searchEntries: async (query) => {
      set((state) => {
        state.search.status = toAsyncSlice('loading');
      });

      try {
        return await withAsyncHandler(set, 'search', async () => {
          const results = await entryService.search(query);
          set((state) => {
            state.search.query = query;
            state.search.results = results;
            state.search.status = toAsyncSlice('success');
          });
          return results;
        });
      } catch (error) {
        // Also update search.status on error (progress.search is handled by withAsyncHandler)
        const message = error instanceof Error ? error.message : String(error);
        set((state) => {
          state.search.status = toAsyncSlice('error', message);
        });
        throw error;
      }
    },

    clearSearch: () =>
      set((state) => {
        state.search.query = '';
        state.search.results = [];
        state.search.status = createAsyncSlice();
        state.progress.search = createAsyncSlice();
      }),

    setCurrentEntry: (entry) =>
      set((state) => {
        state.currentEntryId = entry?.id && state.entryLookup[entry.id] ? entry.id : null;
      }),

    setCurrentEntryId: (entryId) =>
      set((state) => {
        state.currentEntryId = entryId && state.entryLookup[entryId] ? entryId : null;
      }),
  }))
);

export const createEntryStoreInitialState = (): EntryState => createInitialState();

export const selectEntries = (state: EntryState) => state.entries;
export const selectEntryLookup = (state: EntryState) => state.entryLookup;
export const selectCurrentEntryId = (state: EntryState) => state.currentEntryId;
export const selectCurrentEntry = (state: EntryState) =>
  state.currentEntryId ? (state.entryLookup[state.currentEntryId] ?? null) : null;
export const selectEntrySearch = (state: EntryState) => state.search;
export const selectEntryProgress = (state: EntryState) => state.progress;
