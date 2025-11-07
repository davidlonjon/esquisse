/**
 * Entry IPC Handlers
 * Handles entry-related IPC communication between renderer and main process
 */

import { ipcMain } from 'electron';

import { IPC_CHANNELS } from '@shared/ipc-types';

import * as entryDb from '../../database/entries';

/**
 * Register all entry-related IPC handlers
 */
export function registerEntryHandlers(): void {
  // Create a new entry
  ipcMain.handle(IPC_CHANNELS.ENTRY_CREATE, async (_event, entry) => {
    return entryDb.createEntry(entry);
  });

  // Get all entries for a journal
  ipcMain.handle(IPC_CHANNELS.ENTRY_GET_ALL, async (_event, journalId) => {
    return entryDb.getAllEntries(journalId);
  });

  // Get entry by ID
  ipcMain.handle(IPC_CHANNELS.ENTRY_GET_BY_ID, async (_event, id) => {
    return entryDb.getEntryById(id);
  });

  // Update entry
  ipcMain.handle(IPC_CHANNELS.ENTRY_UPDATE, async (_event, id, updates) => {
    return entryDb.updateEntry(id, updates);
  });

  // Delete entry
  ipcMain.handle(IPC_CHANNELS.ENTRY_DELETE, async (_event, id) => {
    return entryDb.deleteEntry(id);
  });

  // Search entries
  ipcMain.handle(IPC_CHANNELS.ENTRY_SEARCH, async (_event, query) => {
    return entryDb.searchEntries(query);
  });
}
