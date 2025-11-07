/**
 * Journal IPC Handlers
 * Handles journal-related IPC communication between renderer and main process
 */

import { ipcMain } from 'electron';

import { IPC_CHANNELS } from '@shared/ipc-types';

import * as journalDb from '../../database/journals';

/**
 * Register all journal-related IPC handlers
 */
export function registerJournalHandlers(): void {
  // Create a new journal
  ipcMain.handle(IPC_CHANNELS.JOURNAL_CREATE, async (_event, journal) => {
    return journalDb.createJournal(journal);
  });

  // Get all journals
  ipcMain.handle(IPC_CHANNELS.JOURNAL_GET_ALL, async () => {
    return journalDb.getAllJournals();
  });

  // Get journal by ID
  ipcMain.handle(IPC_CHANNELS.JOURNAL_GET_BY_ID, async (_event, id) => {
    return journalDb.getJournalById(id);
  });

  // Update journal
  ipcMain.handle(IPC_CHANNELS.JOURNAL_UPDATE, async (_event, id, updates) => {
    return journalDb.updateJournal(id, updates);
  });

  // Delete journal
  ipcMain.handle(IPC_CHANNELS.JOURNAL_DELETE, async (_event, id) => {
    return journalDb.deleteJournal(id);
  });
}
