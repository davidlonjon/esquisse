import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { expect, afterEach, vi } from 'vitest';

import type { ElectronAPI } from '@shared/ipc';
import type { Entry, Journal, Settings } from '@shared/types';

// Extend Vitest matchers with Testing Library assertions
expect.extend({});

// Clean up after each test
afterEach(() => {
  cleanup();
});

const defaultSettings: Settings = {
  theme: 'system',
  fontSize: 16,
  fontFamily: 'system-ui',
  autoSave: true,
  autoSaveInterval: 30000,
  language: 'en',
};

const sampleJournal: Journal = {
  id: 'journal-1',
  name: 'Test Journal',
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

const sampleEntry: Entry = {
  id: 'entry-1',
  journalId: sampleJournal.id,
  title: 'Sample Entry',
  content: '<p>Sample</p>',
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

const success = <T>(data: T) => Promise.resolve({ ok: true as const, data });

global.window.api = {
  createJournal: vi.fn(() => success(sampleJournal)),
  getAllJournals: vi.fn(() => success([sampleJournal])),
  getJournalById: vi.fn(() => success(sampleJournal)),
  updateJournal: vi.fn(() => success(sampleJournal)),
  deleteJournal: vi.fn(() => success(true)),
  createEntry: vi.fn(() => success(sampleEntry)),
  getAllEntries: vi.fn(() => success([sampleEntry])),
  getEntryById: vi.fn(() => success(sampleEntry)),
  updateEntry: vi.fn(() => success(sampleEntry)),
  deleteEntry: vi.fn(() => success(true)),
  searchEntries: vi.fn(() => success([sampleEntry])),
  getSettings: vi.fn(() => success(defaultSettings)),
  setSettings: vi.fn((updates: Partial<Settings>) =>
    success({
      ...defaultSettings,
      ...updates,
    })
  ),
  minimizeWindow: vi.fn(),
  maximizeWindow: vi.fn(),
  closeWindow: vi.fn(),
} as unknown as ElectronAPI;
