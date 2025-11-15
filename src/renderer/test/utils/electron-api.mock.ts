import { vi } from 'vitest';

import type { ElectronAPI } from '@shared/ipc';
import type { Entry, Journal, Result, Settings } from '@shared/types';

const iso = () => new Date(0).toISOString();

export const createMockJournal = (overrides: Partial<Journal> = {}): Journal => ({
  id: 'journal-id',
  name: 'Mock Journal',
  description: undefined,
  color: undefined,
  createdAt: iso(),
  updatedAt: iso(),
  ...overrides,
});

export const createMockEntry = (overrides: Partial<Entry> = {}): Entry => ({
  id: 'entry-id',
  journalId: overrides.journalId ?? 'journal-id',
  title: 'Mock Entry',
  content: '<p>Mock</p>',
  tags: undefined,
  createdAt: iso(),
  updatedAt: iso(),
  ...overrides,
});

export const createMockSettings = (overrides: Partial<Settings> = {}): Settings => ({
  theme: 'system',
  fontSize: 16,
  fontFamily: 'system-ui',
  autoSave: true,
  autoSaveInterval: 30000,
  language: 'en',
  ...overrides,
});

const success = <T>(data: T): Promise<Result<T>> => Promise.resolve({ ok: true as const, data });

type ElectronApiOverrides = Partial<{ [K in keyof ElectronAPI]: ElectronAPI[K] }>;

export const createElectronApiMock = (overrides: ElectronApiOverrides = {}): ElectronAPI => {
  const journal = createMockJournal();
  const entry = createMockEntry({ journalId: journal.id });
  const settings = createMockSettings();

  const base: ElectronAPI = {
    createJournal: vi.fn(() => success(journal)),
    getAllJournals: vi.fn(() => success([journal])),
    getJournalById: vi.fn(() => success(journal)),
    updateJournal: vi.fn(() => success(journal)),
    deleteJournal: vi.fn(() => success(true)),
    createEntry: vi.fn(() => success(entry)),
    getAllEntries: vi.fn(() => success([entry])),
    getEntryById: vi.fn(() => success(entry)),
    updateEntry: vi.fn(() => success(entry)),
    deleteEntry: vi.fn(() => success(true)),
    searchEntries: vi.fn(() => success([entry])),
    getSettings: vi.fn(() => success(settings)),
    setSettings: vi.fn((updates) => success({ ...settings, ...updates })),
    minimizeWindow: vi.fn(),
    maximizeWindow: vi.fn(),
    closeWindow: vi.fn(),
  };

  return { ...base, ...overrides };
};
