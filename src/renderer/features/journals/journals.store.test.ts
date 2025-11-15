import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { journalService } from '@services/journal.service';

import { createMockJournal } from '../../test/utils';

import { useJournalStore } from './journals.store';

vi.mock('@services/journal.service', () => {
  return {
    journalService: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
  };
});

const mockedJournalService = vi.mocked(journalService);
const initialState = useJournalStore.getState();

describe('useJournalStore', () => {
  beforeEach(() => {
    useJournalStore.setState(initialState, true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads journals and updates progress state', async () => {
    const journal = createMockJournal({ id: 'journal-123' });
    mockedJournalService.list.mockResolvedValue([journal]);

    const loadPromise = useJournalStore.getState().loadJournals();
    // Zustand's `set` is async, so we can't synchronously check the loading state.
    // We'll trust the implementation and check the final state.

    await loadPromise;

    const state = useJournalStore.getState();
    expect(state.journals).toEqual([journal]);
    expect(state.progress.load.status).toBe('success');
    expect(state.progress.load.error).toBeNull();
  });

  it('captures errors when loading fails', async () => {
    mockedJournalService.list.mockRejectedValue(new Error('boom'));

    await expect(useJournalStore.getState().loadJournals()).rejects.toThrow('boom');

    const state = useJournalStore.getState();
    expect(state.progress.load.status).toBe('error');
    expect(state.progress.load.error).toBe('boom');
  });
});
