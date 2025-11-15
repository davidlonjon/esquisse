import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { entryService } from '@services/entry.service';
import type { CreateEntryInput, Entry, UpdateEntryInput } from '@shared/types';

import {
  createAsyncSlice,
  getErrorMessage,
  toAsyncSlice,
  type AsyncSlice,
} from '../../store/utils';

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
      set((state) => {
        state.progress.load = toAsyncSlice('loading');
      });

      try {
        const entries = await entryService.list(journalId);
        const lookup = createLookup(entries);

        set((state) => {
          state.entries = entries;
          state.entryLookup = lookup;
          state.currentEntryId =
            state.currentEntryId && lookup[state.currentEntryId] ? state.currentEntryId : null;
          state.progress.load = toAsyncSlice('success');
        });

        return entries;
      } catch (error) {
        const message = getErrorMessage(error);
        set((state) => {
          state.progress.load = toAsyncSlice('error', message);
        });
        throw error;
      }
    },

    createEntry: async (entry) => {
      set((state) => {
        state.progress.save = toAsyncSlice('loading');
      });

      try {
        const newEntry = await entryService.create(entry);
        set((state) => {
          state.entries.unshift(newEntry);
          state.entryLookup[newEntry.id] = newEntry;
          state.progress.save = toAsyncSlice('success');
        });
        return newEntry;
      } catch (error) {
        const message = getErrorMessage(error);
        set((state) => {
          state.progress.save = toAsyncSlice('error', message);
        });
        throw error;
      }
    },

    updateEntry: async (id, updates) => {
      set((state) => {
        state.progress.save = toAsyncSlice('loading');
      });

      try {
        const updated = await entryService.update(id, updates);
        set((state) => {
          if (!state.entryLookup[id]) {
            state.progress.save = toAsyncSlice('success');
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

          state.progress.save = toAsyncSlice('success');
        });

        return updated;
      } catch (error) {
        const message = getErrorMessage(error);
        set((state) => {
          state.progress.save = toAsyncSlice('error', message);
        });
        throw error;
      }
    },

    deleteEntry: async (id) => {
      set((state) => {
        state.progress.remove = toAsyncSlice('loading');
      });

      try {
        await entryService.remove(id);
        set((state) => {
          if (!state.entryLookup[id]) {
            state.progress.remove = toAsyncSlice('success');
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

          state.progress.remove = toAsyncSlice('success');
        });
      } catch (error) {
        const message = getErrorMessage(error);
        set((state) => {
          state.progress.remove = toAsyncSlice('error', message);
        });
        throw error;
      }
    },

    searchEntries: async (query) => {
      set((state) => {
        state.progress.search = toAsyncSlice('loading');
        state.search.status = toAsyncSlice('loading');
      });

      try {
        const results = await entryService.search(query);
        set((state) => {
          state.search.query = query;
          state.search.results = results;
          state.search.status = toAsyncSlice('success');
          state.progress.search = toAsyncSlice('success');
        });
        return results;
      } catch (error) {
        const message = getErrorMessage(error);
        set((state) => {
          state.search.status = toAsyncSlice('error', message);
          state.progress.search = toAsyncSlice('error', message);
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
