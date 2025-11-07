/**
 * Electron API interface exposed to the renderer process via window.api
 */

import type {
  Journal,
  CreateJournalInput,
  UpdateJournalInput,
  Entry,
  CreateEntryInput,
  UpdateEntryInput,
  Settings,
  UpdateSettingsInput,
} from '../types';

export interface ElectronAPI {
  // Journal operations
  createJournal: (journal: CreateJournalInput) => Promise<Journal>;
  getAllJournals: () => Promise<Journal[]>;
  getJournalById: (id: string) => Promise<Journal | null>;
  updateJournal: (id: string, updates: UpdateJournalInput) => Promise<Journal>;
  deleteJournal: (id: string) => Promise<boolean>;

  // Entry operations
  createEntry: (entry: CreateEntryInput) => Promise<Entry>;
  getAllEntries: (journalId?: string) => Promise<Entry[]>;
  getEntryById: (id: string) => Promise<Entry | null>;
  updateEntry: (id: string, updates: UpdateEntryInput) => Promise<Entry>;
  deleteEntry: (id: string) => Promise<boolean>;
  searchEntries: (query: string) => Promise<Entry[]>;

  // Settings
  getSettings: () => Promise<Settings>;
  setSettings: (settings: UpdateSettingsInput) => Promise<Settings>;

  // Window operations
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
}

// Augment the Window interface
declare global {
  interface Window {
    api: ElectronAPI;
  }
}
