import { create } from 'zustand';

import { Journal } from '@shared/ipc-types';

interface JournalState {
  journals: Journal[];
  currentJournal: Journal | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadJournals: () => Promise<void>;
  createJournal: (journal: Omit<Journal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateJournal: (id: string, updates: Partial<Journal>) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
  setCurrentJournal: (journal: Journal | null) => void;
}

export const useJournalStore = create<JournalState>((set) => ({
  journals: [],
  currentJournal: null,
  isLoading: false,
  error: null,

  loadJournals: async () => {
    set({ isLoading: true, error: null });
    try {
      const journals = await window.api.getAllJournals();
      set({ journals, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createJournal: async (journal) => {
    set({ isLoading: true, error: null });
    try {
      const newJournal = await window.api.createJournal(journal);
      set((state) => ({
        journals: [newJournal, ...state.journals],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateJournal: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedJournal = await window.api.updateJournal(id, updates);
      set((state) => ({
        journals: state.journals.map((j) => (j.id === id ? updatedJournal : j)),
        currentJournal: state.currentJournal?.id === id ? updatedJournal : state.currentJournal,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteJournal: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await window.api.deleteJournal(id);
      set((state) => ({
        journals: state.journals.filter((j) => j.id !== id),
        currentJournal: state.currentJournal?.id === id ? null : state.currentJournal,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  setCurrentJournal: (journal) => set({ currentJournal: journal }),
}));
