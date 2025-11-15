/**
 * Journal API for preload
 * Exposes journal operations to the renderer process
 */

import { ipcRenderer } from 'electron';

import { IPC_CHANNELS } from '@shared/ipc';
import type { Journal, CreateJournalInput, UpdateJournalInput, Result } from '@shared/types';

export const journalAPI = {
  createJournal: (journal: CreateJournalInput): Promise<Result<Journal>> =>
    ipcRenderer.invoke(IPC_CHANNELS.JOURNAL_CREATE, journal),

  getAllJournals: (): Promise<Result<Journal[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.JOURNAL_GET_ALL),

  getJournalById: (id: string): Promise<Result<Journal | null>> =>
    ipcRenderer.invoke(IPC_CHANNELS.JOURNAL_GET_BY_ID, id),

  updateJournal: (id: string, updates: UpdateJournalInput): Promise<Result<Journal>> =>
    ipcRenderer.invoke(IPC_CHANNELS.JOURNAL_UPDATE, id, updates),

  deleteJournal: (id: string): Promise<Result<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.JOURNAL_DELETE, id),
};
