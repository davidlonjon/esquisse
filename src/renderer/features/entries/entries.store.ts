import { create } from 'zustand';

import { entryService } from '@services/entry.service';
import type { CreateEntryInput, Entry, UpdateEntryInput } from '@shared/types';

import type { RequestState } from '../../store/utils';
import { withRequestStatus } from '../../store/utils';

interface EntryState extends RequestState {
  entries: Entry[];
  currentEntry: Entry | null;
  loadEntries: (journalId?: string) => Promise<Entry[]>;
  createEntry: (entry: CreateEntryInput) => Promise<Entry>;
  updateEntry: (id: string, updates: UpdateEntryInput) => Promise<Entry>;
  deleteEntry: (id: string) => Promise<void>;
  searchEntries: (query: string) => Promise<Entry[]>;
  setCurrentEntry: (entry: Entry | null) => void;
}

const initialState: Pick<EntryState, 'entries' | 'currentEntry' | 'status' | 'error'> = {
  entries: [],
  currentEntry: null,
  status: 'idle',
  error: null,
};

export const useEntryStore = create<EntryState>((set) => ({
  ...initialState,

  loadEntries: async (journalId) =>
    withRequestStatus(set, async () => {
      const entries = await entryService.list(journalId);
      set({ entries });
      return entries;
    }),

  createEntry: async (entry) =>
    withRequestStatus(set, async () => {
      const newEntry = await entryService.create(entry);
      set((state) => ({ entries: [newEntry, ...state.entries] }));
      return newEntry;
    }),

  updateEntry: async (id, updates) =>
    withRequestStatus(set, async () => {
      const updated = await entryService.update(id, updates);
      set((state) => ({
        entries: state.entries.map((entry) => (entry.id === id ? updated : entry)),
        currentEntry: state.currentEntry?.id === id ? updated : state.currentEntry,
      }));
      return updated;
    }),

  deleteEntry: async (id) =>
    withRequestStatus(set, async () => {
      await entryService.remove(id);
      set((state) => ({
        entries: state.entries.filter((entry) => entry.id !== id),
        currentEntry: state.currentEntry?.id === id ? null : state.currentEntry,
      }));
    }),

  searchEntries: async (query) =>
    withRequestStatus(set, async () => {
      const entries = await entryService.search(query);
      set({ entries });
      return entries;
    }),

  setCurrentEntry: (entry) => set({ currentEntry: entry }),
}));
