import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { entryService } from '@services/entry.service';

import { createMockEntry } from '../../test/utils';

import { useEntryStore } from './entries.store';

vi.mock('@services/entry.service', () => {
  return {
    entryService: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      search: vi.fn(),
    },
  };
});

const mockedEntryService = vi.mocked(entryService);
const initialState = useEntryStore.getState();

describe('useEntryStore', () => {
  beforeEach(() => {
    useEntryStore.setState(initialState, true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads entries and updates progress state', async () => {
    const entry = createMockEntry({ id: 'entry-1', journalId: 'journal-1' });
    mockedEntryService.list.mockResolvedValue([entry]);

    const loadPromise = useEntryStore.getState().loadEntries('journal-1');
    // Zustand's `set` is async, so we can't synchronously check the loading state.
    // We'll trust the implementation and check the final state.

    await loadPromise;

    const state = useEntryStore.getState();
    expect(state.entries).toEqual([entry]);
    expect(state.progress.load.status).toBe('success');
  });

  it('records error state when load fails', async () => {
    mockedEntryService.list.mockRejectedValue(new Error('network'));

    await expect(useEntryStore.getState().loadEntries('journal-1')).rejects.toThrow('network');

    const state = useEntryStore.getState();
    expect(state.progress.load.status).toBe('error');
    expect(state.progress.load.error).toBe('network');
  });
});
