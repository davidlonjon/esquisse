/**
 * Journal API for preload
 * Exposes journal operations to the renderer process
 */

import { ipcRenderer } from 'electron';

import { IPC_CHANNELS } from '@shared/ipc';
import type { Journal, CreateJournalInput, UpdateJournalInput } from '@shared/types';

export const journalAPI = {
  createJournal: (journal: CreateJournalInput): Promise<Journal> =>
    ipcRenderer.invoke(IPC_CHANNELS.JOURNAL_CREATE, journal),

  getAllJournals: (): Promise<Journal[]> => ipcRenderer.invoke(IPC_CHANNELS.JOURNAL_GET_ALL),

  getJournalById: (id: string): Promise<Journal | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.JOURNAL_GET_BY_ID, id),

  updateJournal: (id: string, updates: UpdateJournalInput): Promise<Journal> =>
    ipcRenderer.invoke(IPC_CHANNELS.JOURNAL_UPDATE, id, updates),

  deleteJournal: (id: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.JOURNAL_DELETE, id),
};
