import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { entryService } from '@services/entry.service';

import { createMockEntry } from '../../test/utils';

import { createEntryStoreInitialState, useEntryStore } from './entries.store';

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

describe('useEntryStore', () => {
  beforeEach(() => {
    useEntryStore.setState(createEntryStoreInitialState(), true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads entries and updates progress state', async () => {
    const entry = createMockEntry({ id: 'entry-1', journalId: 'journal-1' });
    mockedEntryService.list.mockResolvedValue([entry]);

    const loadPromise = useEntryStore.getState().loadEntries('journal-1');
    expect(useEntryStore.getState().progress.load.status).toBe('loading');

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
