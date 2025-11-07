/**
 * Entry API for preload
 * Exposes entry operations to the renderer process
 */

import { ipcRenderer } from 'electron';

import { IPC_CHANNELS } from '@shared/ipc';
import type { Entry, CreateEntryInput, UpdateEntryInput } from '@shared/types';

export const entryAPI = {
  createEntry: (entry: CreateEntryInput): Promise<Entry> =>
    ipcRenderer.invoke(IPC_CHANNELS.ENTRY_CREATE, entry),

  getAllEntries: (journalId?: string): Promise<Entry[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.ENTRY_GET_ALL, journalId),

  getEntryById: (id: string): Promise<Entry | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.ENTRY_GET_BY_ID, id),

  updateEntry: (id: string, updates: UpdateEntryInput): Promise<Entry> =>
    ipcRenderer.invoke(IPC_CHANNELS.ENTRY_UPDATE, id, updates),

  deleteEntry: (id: string): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.ENTRY_DELETE, id),

  searchEntries: (query: string): Promise<Entry[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.ENTRY_SEARCH, query),
};
