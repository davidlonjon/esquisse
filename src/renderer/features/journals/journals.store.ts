import { create } from 'zustand';

import { journalService } from '@services/journal.service';
import type { CreateJournalInput, Journal, UpdateJournalInput } from '@shared/types';

import type { RequestState } from '../../store/utils';
import { withRequestStatus } from '../../store/utils';

interface JournalState extends RequestState {
  journals: Journal[];
  currentJournal: Journal | null;
  loadJournals: () => Promise<Journal[]>;
  createJournal: (input: CreateJournalInput) => Promise<Journal>;
  updateJournal: (id: string, updates: UpdateJournalInput) => Promise<Journal>;
  deleteJournal: (id: string) => Promise<void>;
  setCurrentJournal: (journal: Journal | null) => void;
}

const initialState: Pick<JournalState, 'journals' | 'currentJournal' | 'status' | 'error'> = {
  journals: [],
  currentJournal: null,
  status: 'idle',
  error: null,
};

export const useJournalStore = create<JournalState>((set) => ({
  ...initialState,

  loadJournals: async () =>
    withRequestStatus(set, async () => {
      const journals = await journalService.list();
      set({ journals });
      return journals;
    }),

  createJournal: async (input) =>
    withRequestStatus(set, async () => {
      const newJournal = await journalService.create(input);
      set((state) => ({ journals: [newJournal, ...state.journals] }));
      return newJournal;
    }),

  updateJournal: async (id, updates) =>
    withRequestStatus(set, async () => {
      const updated = await journalService.update(id, updates);
      set((state) => ({
        journals: state.journals.map((journal) => (journal.id === id ? updated : journal)),
        currentJournal: state.currentJournal?.id === id ? updated : state.currentJournal,
      }));
      return updated;
    }),

  deleteJournal: async (id) =>
    withRequestStatus(set, async () => {
      await journalService.remove(id);
      set((state) => ({
        journals: state.journals.filter((journal) => journal.id !== id),
        currentJournal: state.currentJournal?.id === id ? null : state.currentJournal,
      }));
    }),

  setCurrentJournal: (journal) => set({ currentJournal: journal }),
}));
