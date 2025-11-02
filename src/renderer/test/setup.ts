import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { expect, afterEach, vi } from 'vitest';

// Extend Vitest matchers with Testing Library assertions
expect.extend({});

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock the Electron API for tests
global.window.api = {
  createJournal: vi.fn(),
  getAllJournals: vi.fn(() => Promise.resolve([])),
  getJournalById: vi.fn(),
  updateJournal: vi.fn(),
  deleteJournal: vi.fn(),
  createEntry: vi.fn(),
  getAllEntries: vi.fn(() => Promise.resolve([])),
  getEntryById: vi.fn(),
  updateEntry: vi.fn(),
  deleteEntry: vi.fn(),
  searchEntries: vi.fn(),
  getSettings: vi.fn(() =>
    Promise.resolve({
      theme: 'system' as const,
      fontSize: 16,
      fontFamily: 'system-ui',
      autoSave: true,
      autoSaveInterval: 30000,
    })
  ),
  setSettings: vi.fn(),
  minimizeWindow: vi.fn(),
  maximizeWindow: vi.fn(),
  closeWindow: vi.fn(),
};
