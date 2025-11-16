import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { entryService } from '@services/entry.service';
import type { CreateEntryInput, UpdateEntryInput } from '@shared/types';

import { createMockEntry } from '../../test/utils';

import {
  selectCurrentEntry,
  selectCurrentEntryId,
  selectEntries,
  selectEntryLookup,
  selectEntryProgress,
  selectEntrySearch,
  useEntryStore,
} from './entries.store';

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

  describe('loadEntries', () => {
    it('loads entries and updates progress state', async () => {
      const entry = createMockEntry({ id: 'entry-1', journalId: 'journal-1' });
      mockedEntryService.list.mockResolvedValue([entry]);

      await useEntryStore.getState().loadEntries('journal-1');

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

    it('creates entry lookup from loaded entries', async () => {
      const entries = [
        createMockEntry({ id: 'entry-1', journalId: 'journal-1' }),
        createMockEntry({ id: 'entry-2', journalId: 'journal-1' }),
      ];
      mockedEntryService.list.mockResolvedValue(entries);

      await useEntryStore.getState().loadEntries('journal-1');

      const state = useEntryStore.getState();
      expect(state.entryLookup['entry-1']).toEqual(entries[0]);
      expect(state.entryLookup['entry-2']).toEqual(entries[1]);
    });

    it('clears currentEntryId if entry no longer exists', async () => {
      useEntryStore.setState({ currentEntryId: 'entry-1' });
      mockedEntryService.list.mockResolvedValue([]);

      await useEntryStore.getState().loadEntries('journal-1');

      const state = useEntryStore.getState();
      expect(state.currentEntryId).toBeNull();
    });

    it('preserves currentEntryId if entry still exists', async () => {
      const entry = createMockEntry({ id: 'entry-1', journalId: 'journal-1' });
      useEntryStore.setState({ currentEntryId: 'entry-1' });
      mockedEntryService.list.mockResolvedValue([entry]);

      await useEntryStore.getState().loadEntries('journal-1');

      const state = useEntryStore.getState();
      expect(state.currentEntryId).toBe('entry-1');
    });
  });

  describe('createEntry', () => {
    it('creates entry and adds to beginning of entries array', async () => {
      const existingEntry = createMockEntry({ id: 'entry-1', journalId: 'journal-1' });
      const newEntry = createMockEntry({ id: 'entry-2', journalId: 'journal-1' });

      useEntryStore.setState({ entries: [existingEntry] });
      mockedEntryService.create.mockResolvedValue(newEntry);

      const input: CreateEntryInput = {
        journalId: 'journal-1',
        content: '<p>New entry</p>',
      };

      await useEntryStore.getState().createEntry(input);

      const state = useEntryStore.getState();
      expect(state.entries[0]).toEqual(newEntry);
      expect(state.entries[1]).toEqual(existingEntry);
      expect(state.progress.save.status).toBe('success');
    });

    it('adds created entry to lookup', async () => {
      const newEntry = createMockEntry({ id: 'entry-1', journalId: 'journal-1' });
      mockedEntryService.create.mockResolvedValue(newEntry);

      const input: CreateEntryInput = {
        journalId: 'journal-1',
        content: '<p>New entry</p>',
      };

      await useEntryStore.getState().createEntry(input);

      const state = useEntryStore.getState();
      expect(state.entryLookup['entry-1']).toEqual(newEntry);
    });

    it('records error state when create fails', async () => {
      mockedEntryService.create.mockRejectedValue(new Error('creation failed'));

      const input: CreateEntryInput = {
        journalId: 'journal-1',
        content: '<p>New entry</p>',
      };

      await expect(useEntryStore.getState().createEntry(input)).rejects.toThrow('creation failed');

      const state = useEntryStore.getState();
      expect(state.progress.save.status).toBe('error');
      expect(state.progress.save.error).toBe('creation failed');
    });
  });

  describe('updateEntry', () => {
    it('updates entry in entries array and lookup', async () => {
      const entry = createMockEntry({ id: 'entry-1', title: 'Original' });
      const updated = createMockEntry({ id: 'entry-1', title: 'Updated' });

      useEntryStore.setState({
        entries: [entry],
        entryLookup: { 'entry-1': entry },
      });

      mockedEntryService.update.mockResolvedValue(updated);

      const updates: UpdateEntryInput = { title: 'Updated' };
      await useEntryStore.getState().updateEntry('entry-1', updates);

      const state = useEntryStore.getState();
      expect(state.entries[0]).toEqual(updated);
      expect(state.entryLookup['entry-1']).toEqual(updated);
      expect(state.progress.save.status).toBe('success');
    });

    it('updates entry in search results if present', async () => {
      const entry = createMockEntry({ id: 'entry-1', title: 'Original' });
      const updated = createMockEntry({ id: 'entry-1', title: 'Updated' });

      useEntryStore.setState({
        entries: [entry],
        entryLookup: { 'entry-1': entry },
        search: {
          query: 'test',
          results: [entry],
          status: { status: 'success', error: null },
        },
      });

      mockedEntryService.update.mockResolvedValue(updated);

      const updates: UpdateEntryInput = { title: 'Updated' };
      await useEntryStore.getState().updateEntry('entry-1', updates);

      const state = useEntryStore.getState();
      expect(state.search.results[0]).toEqual(updated);
    });

    it('handles updating non-existent entry gracefully', async () => {
      const updated = createMockEntry({ id: 'entry-99', title: 'Updated' });
      mockedEntryService.update.mockResolvedValue(updated);

      const updates: UpdateEntryInput = { title: 'Updated' };
      await useEntryStore.getState().updateEntry('entry-99', updates);

      const state = useEntryStore.getState();
      expect(state.progress.save.status).toBe('success');
    });

    it('records error state when update fails', async () => {
      const entry = createMockEntry({ id: 'entry-1' });
      useEntryStore.setState({
        entries: [entry],
        entryLookup: { 'entry-1': entry },
      });

      mockedEntryService.update.mockRejectedValue(new Error('update failed'));

      const updates: UpdateEntryInput = { title: 'Updated' };
      await expect(useEntryStore.getState().updateEntry('entry-1', updates)).rejects.toThrow(
        'update failed'
      );

      const state = useEntryStore.getState();
      expect(state.progress.save.status).toBe('error');
      expect(state.progress.save.error).toBe('update failed');
    });
  });

  describe('deleteEntry', () => {
    it('removes entry from entries array and lookup', async () => {
      const entry = createMockEntry({ id: 'entry-1' });

      useEntryStore.setState({
        entries: [entry],
        entryLookup: { 'entry-1': entry },
      });

      mockedEntryService.remove.mockResolvedValue();

      await useEntryStore.getState().deleteEntry('entry-1');

      const state = useEntryStore.getState();
      expect(state.entries).toEqual([]);
      expect(state.entryLookup['entry-1']).toBeUndefined();
      expect(state.progress.remove.status).toBe('success');
    });

    it('clears currentEntryId when deleting current entry', async () => {
      const entry = createMockEntry({ id: 'entry-1' });

      useEntryStore.setState({
        entries: [entry],
        entryLookup: { 'entry-1': entry },
        currentEntryId: 'entry-1',
      });

      mockedEntryService.remove.mockResolvedValue();

      await useEntryStore.getState().deleteEntry('entry-1');

      const state = useEntryStore.getState();
      expect(state.currentEntryId).toBeNull();
    });

    it('removes entry from search results if present', async () => {
      const entry1 = createMockEntry({ id: 'entry-1' });
      const entry2 = createMockEntry({ id: 'entry-2' });

      useEntryStore.setState({
        entries: [entry1, entry2],
        entryLookup: { 'entry-1': entry1, 'entry-2': entry2 },
        search: {
          query: 'test',
          results: [entry1, entry2],
          status: { status: 'success', error: null },
        },
      });

      mockedEntryService.remove.mockResolvedValue();

      await useEntryStore.getState().deleteEntry('entry-1');

      const state = useEntryStore.getState();
      expect(state.search.results).toEqual([entry2]);
    });

    it('handles deleting non-existent entry gracefully', async () => {
      mockedEntryService.remove.mockResolvedValue();

      await useEntryStore.getState().deleteEntry('non-existent');

      const state = useEntryStore.getState();
      expect(state.progress.remove.status).toBe('success');
    });

    it('records error state when delete fails', async () => {
      const entry = createMockEntry({ id: 'entry-1' });
      useEntryStore.setState({
        entries: [entry],
        entryLookup: { 'entry-1': entry },
      });

      mockedEntryService.remove.mockRejectedValue(new Error('delete failed'));

      await expect(useEntryStore.getState().deleteEntry('entry-1')).rejects.toThrow(
        'delete failed'
      );

      const state = useEntryStore.getState();
      expect(state.progress.remove.status).toBe('error');
      expect(state.progress.remove.error).toBe('delete failed');
    });
  });

  describe('searchEntries', () => {
    it('searches entries and updates search state', async () => {
      const entry = createMockEntry({ id: 'entry-1', title: 'Test Entry' });
      mockedEntryService.search.mockResolvedValue([entry]);

      await useEntryStore.getState().searchEntries('test');

      const state = useEntryStore.getState();
      expect(state.search.query).toBe('test');
      expect(state.search.results).toEqual([entry]);
      expect(state.search.status.status).toBe('success');
      expect(state.progress.search.status).toBe('success');
    });

    it('records error state when search fails', async () => {
      mockedEntryService.search.mockRejectedValue(new Error('search failed'));

      await expect(useEntryStore.getState().searchEntries('test')).rejects.toThrow('search failed');

      const state = useEntryStore.getState();
      expect(state.search.status.status).toBe('error');
      expect(state.search.status.error).toBe('search failed');
      expect(state.progress.search.status).toBe('error');
    });
  });

  describe('clearSearch', () => {
    it('clears search state', () => {
      const entry = createMockEntry({ id: 'entry-1' });
      useEntryStore.setState({
        search: {
          query: 'test',
          results: [entry],
          status: { status: 'success', error: null },
        },
        progress: {
          ...initialState.progress,
          search: { status: 'success', error: null },
        },
      });

      useEntryStore.getState().clearSearch();

      const state = useEntryStore.getState();
      expect(state.search.query).toBe('');
      expect(state.search.results).toEqual([]);
      expect(state.search.status.status).toBe('idle');
      expect(state.progress.search.status).toBe('idle');
    });
  });

  describe('setCurrentEntry', () => {
    it('sets currentEntryId when entry exists in lookup', () => {
      const entry = createMockEntry({ id: 'entry-1' });
      useEntryStore.setState({
        entryLookup: { 'entry-1': entry },
      });

      useEntryStore.getState().setCurrentEntry(entry);

      const state = useEntryStore.getState();
      expect(state.currentEntryId).toBe('entry-1');
    });

    it('does not set currentEntryId when entry not in lookup', () => {
      const entry = createMockEntry({ id: 'entry-1' });

      useEntryStore.getState().setCurrentEntry(entry);

      const state = useEntryStore.getState();
      expect(state.currentEntryId).toBeNull();
    });

    it('clears currentEntryId when passed null', () => {
      useEntryStore.setState({ currentEntryId: 'entry-1' });

      useEntryStore.getState().setCurrentEntry(null);

      const state = useEntryStore.getState();
      expect(state.currentEntryId).toBeNull();
    });
  });

  describe('setCurrentEntryId', () => {
    it('sets currentEntryId when entry exists in lookup', () => {
      const entry = createMockEntry({ id: 'entry-1' });
      useEntryStore.setState({
        entryLookup: { 'entry-1': entry },
      });

      useEntryStore.getState().setCurrentEntryId('entry-1');

      const state = useEntryStore.getState();
      expect(state.currentEntryId).toBe('entry-1');
    });

    it('does not set currentEntryId when entry not in lookup', () => {
      useEntryStore.getState().setCurrentEntryId('entry-1');

      const state = useEntryStore.getState();
      expect(state.currentEntryId).toBeNull();
    });

    it('clears currentEntryId when passed null', () => {
      useEntryStore.setState({ currentEntryId: 'entry-1' });

      useEntryStore.getState().setCurrentEntryId(null);

      const state = useEntryStore.getState();
      expect(state.currentEntryId).toBeNull();
    });
  });

  describe('Selectors', () => {
    it('selectEntries returns entries array', () => {
      const entries = [createMockEntry({ id: 'entry-1' })];
      useEntryStore.setState({ entries });

      const result = selectEntries(useEntryStore.getState());
      expect(result).toEqual(entries);
    });

    it('selectEntryLookup returns entry lookup', () => {
      const entry = createMockEntry({ id: 'entry-1' });
      useEntryStore.setState({ entryLookup: { 'entry-1': entry } });

      const result = selectEntryLookup(useEntryStore.getState());
      expect(result).toEqual({ 'entry-1': entry });
    });

    it('selectCurrentEntryId returns currentEntryId', () => {
      useEntryStore.setState({ currentEntryId: 'entry-1' });

      const result = selectCurrentEntryId(useEntryStore.getState());
      expect(result).toBe('entry-1');
    });

    it('selectCurrentEntry returns current entry from lookup', () => {
      const entry = createMockEntry({ id: 'entry-1' });
      useEntryStore.setState({
        currentEntryId: 'entry-1',
        entryLookup: { 'entry-1': entry },
      });

      const result = selectCurrentEntry(useEntryStore.getState());
      expect(result).toEqual(entry);
    });

    it('selectCurrentEntry returns null when no current entry', () => {
      const result = selectCurrentEntry(useEntryStore.getState());
      expect(result).toBeNull();
    });

    it('selectEntrySearch returns search state', () => {
      const searchState = {
        query: 'test',
        results: [createMockEntry({ id: 'entry-1' })],
        status: { status: 'success' as const, error: null },
      };
      useEntryStore.setState({ search: searchState });

      const result = selectEntrySearch(useEntryStore.getState());
      expect(result).toEqual(searchState);
    });

    it('selectEntryProgress returns progress state', () => {
      const result = selectEntryProgress(useEntryStore.getState());
      expect(result).toHaveProperty('load');
      expect(result).toHaveProperty('save');
      expect(result).toHaveProperty('remove');
      expect(result).toHaveProperty('search');
    });
  });
});
