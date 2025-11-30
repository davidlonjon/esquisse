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
  EntryStatus,
  Settings,
  UpdateSettingsInput,
  Result,
  BackupInfo,
  AdvancedSearchInput,
  SearchResult,
} from '../types';

export interface ElectronAPI {
  // Journal operations
  createJournal: (journal: CreateJournalInput) => Promise<Result<Journal>>;
  getAllJournals: () => Promise<Result<Journal[]>>;
  getJournalById: (id: string) => Promise<Result<Journal | null>>;
  updateJournal: (id: string, updates: UpdateJournalInput) => Promise<Result<Journal>>;
  deleteJournal: (id: string) => Promise<Result<boolean>>;

  // Entry operations
  createEntry: (entry: CreateEntryInput) => Promise<Result<Entry>>;
  getAllEntries: (journalId?: string) => Promise<Result<Entry[]>>;
  getEntryById: (id: string) => Promise<Result<Entry | null>>;
  updateEntry: (id: string, updates: UpdateEntryInput) => Promise<Result<Entry>>;
  deleteEntry: (id: string) => Promise<Result<boolean>>;
  searchEntries: (query: string) => Promise<Result<Entry[]>>;
  advancedSearch: (input: AdvancedSearchInput) => Promise<Result<SearchResult[]>>;
  archiveEntry: (id: string) => Promise<Result<Entry>>;
  unarchiveEntry: (id: string) => Promise<Result<Entry>>;
  updateEntryStatus: (id: string, status: EntryStatus) => Promise<Result<Entry>>;
  getEntriesByStatus: (
    journalId: string | undefined,
    status: EntryStatus
  ) => Promise<Result<Entry[]>>;

  // Settings
  getSettings: () => Promise<Result<Settings>>;
  setSettings: (settings: UpdateSettingsInput) => Promise<Result<Settings>>;

  // Backups
  createBackup: () => Promise<Result<string | null>>;
  listBackups: () => Promise<Result<BackupInfo[]>>;
  restoreBackup: (path: string) => Promise<Result<boolean>>;

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
