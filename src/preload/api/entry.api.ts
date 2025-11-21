/**
 * Entry API for preload
 * Exposes entry operations to the renderer process
 */

import { ipcRenderer } from 'electron';

import { IPC_CHANNELS } from '@shared/ipc';
import type { Entry, CreateEntryInput, UpdateEntryInput, EntryStatus, Result } from '@shared/types';

export const entryAPI = {
  createEntry: (entry: CreateEntryInput): Promise<Result<Entry>> =>
    ipcRenderer.invoke(IPC_CHANNELS.ENTRY_CREATE, entry),

  getAllEntries: (journalId?: string): Promise<Result<Entry[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.ENTRY_GET_ALL, journalId),

  getEntryById: (id: string): Promise<Result<Entry | null>> =>
    ipcRenderer.invoke(IPC_CHANNELS.ENTRY_GET_BY_ID, id),

  updateEntry: (id: string, updates: UpdateEntryInput): Promise<Result<Entry>> =>
    ipcRenderer.invoke(IPC_CHANNELS.ENTRY_UPDATE, id, updates),

  deleteEntry: (id: string): Promise<Result<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.ENTRY_DELETE, id),

  searchEntries: (query: string): Promise<Result<Entry[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.ENTRY_SEARCH, query),

  archiveEntry: (id: string): Promise<Result<Entry>> =>
    ipcRenderer.invoke(IPC_CHANNELS.ENTRY_ARCHIVE, id),

  unarchiveEntry: (id: string): Promise<Result<Entry>> =>
    ipcRenderer.invoke(IPC_CHANNELS.ENTRY_UNARCHIVE, id),

  updateEntryStatus: (id: string, status: EntryStatus): Promise<Result<Entry>> =>
    ipcRenderer.invoke(IPC_CHANNELS.ENTRY_UPDATE_STATUS, id, status),

  getEntriesByStatus: (
    journalId: string | undefined,
    status: EntryStatus
  ): Promise<Result<Entry[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.ENTRY_GET_BY_STATUS, journalId, status),
};
