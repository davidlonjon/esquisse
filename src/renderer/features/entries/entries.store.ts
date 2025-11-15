import { create } from 'zustand';

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

export const useEntryStore = create<EntryState>((set) => ({
  ...createInitialState(),

  loadEntries: async (journalId) => {
    set((state) => ({
      progress: { ...state.progress, load: toAsyncSlice('loading') },
    }));

    try {
      const entries = await entryService.list(journalId);
      const lookup = createLookup(entries);

      set((state) => ({
        entries,
        entryLookup: lookup,
        currentEntryId:
          state.currentEntryId && lookup[state.currentEntryId] ? state.currentEntryId : null,
        progress: { ...state.progress, load: toAsyncSlice('success') },
      }));

      return entries;
    } catch (error) {
      const message = getErrorMessage(error);
      set((state) => ({
        progress: { ...state.progress, load: toAsyncSlice('error', message) },
      }));
      throw error;
    }
  },

  createEntry: async (entry) => {
    set((state) => ({
      progress: { ...state.progress, save: toAsyncSlice('loading') },
    }));

    try {
      const newEntry = await entryService.create(entry);
      set((state) => {
        const entries = [newEntry, ...state.entries];
        return {
          entries,
          entryLookup: { ...state.entryLookup, [newEntry.id]: newEntry },
          progress: { ...state.progress, save: toAsyncSlice('success') },
        };
      });
      return newEntry;
    } catch (error) {
      const message = getErrorMessage(error);
      set((state) => ({
        progress: { ...state.progress, save: toAsyncSlice('error', message) },
      }));
      throw error;
    }
  },

  updateEntry: async (id, updates) => {
    set((state) => ({
      progress: { ...state.progress, save: toAsyncSlice('loading') },
    }));

    try {
      const updated = await entryService.update(id, updates);
      set((state) => {
        if (!state.entryLookup[id]) {
          return {
            progress: { ...state.progress, save: toAsyncSlice('success') },
          };
        }

        const entries = state.entries.map((entry) => (entry.id === id ? updated : entry));
        const entryLookup = { ...state.entryLookup, [id]: updated };
        const searchResults = state.search.results.map((entry) =>
          entry.id === id ? updated : entry
        );

        return {
          entries,
          entryLookup,
          search: {
            ...state.search,
            results: searchResults,
          },
          progress: { ...state.progress, save: toAsyncSlice('success') },
        };
      });

      return updated;
    } catch (error) {
      const message = getErrorMessage(error);
      set((state) => ({
        progress: { ...state.progress, save: toAsyncSlice('error', message) },
      }));
      throw error;
    }
  },

  deleteEntry: async (id) => {
    set((state) => ({
      progress: { ...state.progress, remove: toAsyncSlice('loading') },
    }));

    try {
      await entryService.remove(id);
      set((state) => {
        if (!state.entryLookup[id]) {
          return {
            progress: { ...state.progress, remove: toAsyncSlice('success') },
          };
        }

        const entries = state.entries.filter((entry) => entry.id !== id);
        const restLookup = { ...state.entryLookup };
        delete restLookup[id];
        return {
          entries,
          entryLookup: restLookup,
          currentEntryId: state.currentEntryId === id ? null : state.currentEntryId,
          search: {
            ...state.search,
            results: state.search.results.filter((entry) => entry.id !== id),
          },
          progress: { ...state.progress, remove: toAsyncSlice('success') },
        };
      });
    } catch (error) {
      const message = getErrorMessage(error);
      set((state) => ({
        progress: { ...state.progress, remove: toAsyncSlice('error', message) },
      }));
      throw error;
    }
  },

  searchEntries: async (query) => {
    set((state) => ({
      progress: { ...state.progress, search: toAsyncSlice('loading') },
      search: {
        ...state.search,
        status: toAsyncSlice('loading'),
      },
    }));

    try {
      const results = await entryService.search(query);
      set((state) => ({
        search: {
          query,
          results,
          status: toAsyncSlice('success'),
        },
        progress: { ...state.progress, search: toAsyncSlice('success') },
      }));
      return results;
    } catch (error) {
      const message = getErrorMessage(error);
      set((state) => ({
        search: {
          ...state.search,
          status: toAsyncSlice('error', message),
        },
        progress: { ...state.progress, search: toAsyncSlice('error', message) },
      }));
      throw error;
    }
  },

  clearSearch: () =>
    set((state) => ({
      search: {
        query: '',
        results: [],
        status: createAsyncSlice(),
      },
      progress: { ...state.progress, search: createAsyncSlice() },
    })),

  setCurrentEntry: (entry) =>
    set((state) => ({
      currentEntryId: entry?.id && state.entryLookup[entry.id] ? entry.id : null,
    })),

  setCurrentEntryId: (entryId) =>
    set((state) => ({
      currentEntryId: entryId && state.entryLookup[entryId] ? entryId : null,
    })),
}));

export const selectEntries = (state: EntryState) => state.entries;
export const selectEntryLookup = (state: EntryState) => state.entryLookup;
export const selectCurrentEntryId = (state: EntryState) => state.currentEntryId;
export const selectCurrentEntry = (state: EntryState) =>
  state.currentEntryId ? (state.entryLookup[state.currentEntryId] ?? null) : null;
export const selectEntrySearch = (state: EntryState) => state.search;
export const selectEntryProgress = (state: EntryState) => state.progress;
