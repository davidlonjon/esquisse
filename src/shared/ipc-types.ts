/**
 * IPC Channel definitions for type-safe communication between main and renderer processes
 */

// Database operations
export const IPC_CHANNELS = {
  // Journal operations
  JOURNAL_CREATE: 'journal:create',
  JOURNAL_GET_ALL: 'journal:getAll',
  JOURNAL_GET_BY_ID: 'journal:getById',
  JOURNAL_UPDATE: 'journal:update',
  JOURNAL_DELETE: 'journal:delete',

  // Entry operations
  ENTRY_CREATE: 'entry:create',
  ENTRY_GET_ALL: 'entry:getAll',
  ENTRY_GET_BY_ID: 'entry:getById',
  ENTRY_UPDATE: 'entry:update',
  ENTRY_DELETE: 'entry:delete',
  ENTRY_SEARCH: 'entry:search',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // Window operations
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
} as const;

// Type definitions for data models
export interface Journal {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Entry {
  id: string;
  journalId: string;
  title?: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  fontFamily: string;
  autoSave: boolean;
  autoSaveInterval: number;
}

// IPC request/response types
export interface IPCRequest<T = unknown> {
  data?: T;
}

export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Exposed API shape (available in renderer via window.api)
export interface ElectronAPI {
  // Journal operations
  createJournal: (journal: Omit<Journal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Journal>;
  getAllJournals: () => Promise<Journal[]>;
  getJournalById: (id: string) => Promise<Journal | null>;
  updateJournal: (id: string, updates: Partial<Journal>) => Promise<Journal>;
  deleteJournal: (id: string) => Promise<boolean>;

  // Entry operations
  createEntry: (entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Entry>;
  getAllEntries: (journalId?: string) => Promise<Entry[]>;
  getEntryById: (id: string) => Promise<Entry | null>;
  updateEntry: (id: string, updates: Partial<Entry>) => Promise<Entry>;
  deleteEntry: (id: string) => Promise<boolean>;
  searchEntries: (query: string) => Promise<Entry[]>;

  // Settings
  getSettings: () => Promise<Settings>;
  setSettings: (settings: Partial<Settings>) => Promise<Settings>;

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
