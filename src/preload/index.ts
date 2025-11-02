import { contextBridge, ipcRenderer } from 'electron';

import { ElectronAPI, IPC_CHANNELS } from '../shared/ipc-types';

/**
 * Preload script that exposes a safe API to the renderer process
 * This creates a bridge between the main process and renderer process
 */

const electronAPI: ElectronAPI = {
  // Journal operations
  createJournal: (journal) => ipcRenderer.invoke(IPC_CHANNELS.JOURNAL_CREATE, journal),
  getAllJournals: () => ipcRenderer.invoke(IPC_CHANNELS.JOURNAL_GET_ALL),
  getJournalById: (id) => ipcRenderer.invoke(IPC_CHANNELS.JOURNAL_GET_BY_ID, id),
  updateJournal: (id, updates) => ipcRenderer.invoke(IPC_CHANNELS.JOURNAL_UPDATE, id, updates),
  deleteJournal: (id) => ipcRenderer.invoke(IPC_CHANNELS.JOURNAL_DELETE, id),

  // Entry operations
  createEntry: (entry) => ipcRenderer.invoke(IPC_CHANNELS.ENTRY_CREATE, entry),
  getAllEntries: (journalId) => ipcRenderer.invoke(IPC_CHANNELS.ENTRY_GET_ALL, journalId),
  getEntryById: (id) => ipcRenderer.invoke(IPC_CHANNELS.ENTRY_GET_BY_ID, id),
  updateEntry: (id, updates) => ipcRenderer.invoke(IPC_CHANNELS.ENTRY_UPDATE, id, updates),
  deleteEntry: (id) => ipcRenderer.invoke(IPC_CHANNELS.ENTRY_DELETE, id),
  searchEntries: (query) => ipcRenderer.invoke(IPC_CHANNELS.ENTRY_SEARCH, query),

  // Settings
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
  setSettings: (settings) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, settings),

  // Window operations
  minimizeWindow: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximizeWindow: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
  closeWindow: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('api', electronAPI);
