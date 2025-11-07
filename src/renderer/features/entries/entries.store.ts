import { create } from 'zustand';

import { Entry } from '@shared/ipc-types';

interface EntryState {
  entries: Entry[];
  currentEntry: Entry | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadEntries: (journalId?: string) => Promise<void>;
  createEntry: (entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<Entry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  searchEntries: (query: string) => Promise<void>;
  setCurrentEntry: (entry: Entry | null) => void;
}

export const useEntryStore = create<EntryState>((set) => ({
  entries: [],
  currentEntry: null,
  isLoading: false,
  error: null,

  loadEntries: async (journalId) => {
    set({ isLoading: true, error: null });
    try {
      const entries = await window.api.getAllEntries(journalId);
      set({ entries, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createEntry: async (entry) => {
    set({ isLoading: true, error: null });
    try {
      const newEntry = await window.api.createEntry(entry);
      set((state) => ({
        entries: [newEntry, ...state.entries],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateEntry: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedEntry = await window.api.updateEntry(id, updates);
      set((state) => ({
        entries: state.entries.map((e) => (e.id === id ? updatedEntry : e)),
        currentEntry: state.currentEntry?.id === id ? updatedEntry : state.currentEntry,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteEntry: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await window.api.deleteEntry(id);
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        currentEntry: state.currentEntry?.id === id ? null : state.currentEntry,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  searchEntries: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const entries = await window.api.searchEntries(query);
      set({ entries, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  setCurrentEntry: (entry) => set({ currentEntry: entry }),
}));
