import { create } from 'zustand';

import { journalService } from '@services/journal.service';
import type { CreateJournalInput, Journal, UpdateJournalInput } from '@shared/types';

import {
  createAsyncSlice,
  getErrorMessage,
  toAsyncSlice,
  type AsyncSlice,
} from '../../store/utils';

type JournalLookup = Record<string, Journal>;

interface JournalProgressState {
  load: AsyncSlice;
  save: AsyncSlice;
  remove: AsyncSlice;
}

interface JournalState {
  journals: Journal[];
  journalLookup: JournalLookup;
  currentJournalId: string | null;
  progress: JournalProgressState;
  loadJournals: () => Promise<Journal[]>;
  createJournal: (input: CreateJournalInput) => Promise<Journal>;
  updateJournal: (id: string, updates: UpdateJournalInput) => Promise<Journal>;
  deleteJournal: (id: string) => Promise<void>;
  setCurrentJournal: (journal: Journal | null) => void;
  setCurrentJournalId: (journalId: string | null) => void;
}

const createJournalLookup = (journals: Journal[]): JournalLookup =>
  journals.reduce<JournalLookup>((acc, journal) => {
    acc[journal.id] = journal;
    return acc;
  }, {});

const initialJournals: Journal[] = [];

const createInitialState = (): JournalState => ({
  journals: initialJournals,
  journalLookup: createJournalLookup(initialJournals),
  currentJournalId: null,
  progress: {
    load: createAsyncSlice(),
    save: createAsyncSlice(),
    remove: createAsyncSlice(),
  },
  loadJournals: async () => [],
  createJournal: async () => {
    throw new Error('Store not initialized');
  },
  updateJournal: async () => {
    throw new Error('Store not initialized');
  },
  deleteJournal: async () => {
    throw new Error('Store not initialized');
  },
  setCurrentJournal: () => undefined,
  setCurrentJournalId: () => undefined,
});

export const useJournalStore = create<JournalState>((set) => ({
  ...createInitialState(),

  loadJournals: async () => {
    set((state) => ({
      progress: { ...state.progress, load: toAsyncSlice('loading') },
    }));

    try {
      const journals = await journalService.list();
      const lookup = createJournalLookup(journals);
      set((state) => ({
        journals,
        journalLookup: lookup,
        currentJournalId:
          state.currentJournalId && lookup[state.currentJournalId]
            ? state.currentJournalId
            : (journals[0]?.id ?? null),
        progress: { ...state.progress, load: toAsyncSlice('success') },
      }));
      return journals;
    } catch (error) {
      const message = getErrorMessage(error);
      set((state) => ({
        progress: { ...state.progress, load: toAsyncSlice('error', message) },
      }));
      throw error;
    }
  },

  createJournal: async (input) => {
    set((state) => ({
      progress: { ...state.progress, save: toAsyncSlice('loading') },
    }));

    try {
      const newJournal = await journalService.create(input);
      set((state) => ({
        journals: [newJournal, ...state.journals],
        journalLookup: { ...state.journalLookup, [newJournal.id]: newJournal },
        progress: { ...state.progress, save: toAsyncSlice('success') },
      }));
      return newJournal;
    } catch (error) {
      const message = getErrorMessage(error);
      set((state) => ({
        progress: { ...state.progress, save: toAsyncSlice('error', message) },
      }));
      throw error;
    }
  },

  updateJournal: async (id, updates) => {
    set((state) => ({
      progress: { ...state.progress, save: toAsyncSlice('loading') },
    }));

    try {
      const updated = await journalService.update(id, updates);
      set((state) => {
        if (!state.journalLookup[id]) {
          return {
            progress: { ...state.progress, save: toAsyncSlice('success') },
          };
        }

        const journals = state.journals.map((journal) => (journal.id === id ? updated : journal));
        const journalLookup = { ...state.journalLookup, [id]: updated };
        return {
          journals,
          journalLookup,
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

  deleteJournal: async (id) => {
    set((state) => ({
      progress: { ...state.progress, remove: toAsyncSlice('loading') },
    }));

    try {
      await journalService.remove(id);
      set((state) => {
        if (!state.journalLookup[id]) {
          return {
            progress: { ...state.progress, remove: toAsyncSlice('success') },
          };
        }

        const journals = state.journals.filter((journal) => journal.id !== id);
        const restLookup = { ...state.journalLookup };
        delete restLookup[id];
        return {
          journals,
          journalLookup: restLookup,
          currentJournalId:
            state.currentJournalId === id ? (journals[0]?.id ?? null) : state.currentJournalId,
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

  setCurrentJournal: (journal) =>
    set((state) => ({
      currentJournalId: journal?.id && state.journalLookup[journal.id] ? journal.id : null,
    })),

  setCurrentJournalId: (journalId) =>
    set((state) => ({
      currentJournalId: journalId && state.journalLookup[journalId] ? journalId : null,
    })),
}));

export const selectJournals = (state: JournalState) => state.journals;
export const selectJournalLookup = (state: JournalState) => state.journalLookup;
export const selectCurrentJournalId = (state: JournalState) => state.currentJournalId;
export const selectCurrentJournal = (state: JournalState) =>
  state.currentJournalId ? (state.journalLookup[state.currentJournalId] ?? null) : null;
export const selectJournalProgress = (state: JournalState) => state.progress;
