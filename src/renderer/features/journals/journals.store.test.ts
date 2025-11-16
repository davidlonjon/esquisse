import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { journalService } from '@services/journal.service';
import type { CreateJournalInput, UpdateJournalInput } from '@shared/types';

import { createMockJournal } from '../../test/utils';

import {
  selectCurrentJournal,
  selectCurrentJournalId,
  selectJournalLookup,
  selectJournalProgress,
  selectJournals,
  useJournalStore,
} from './journals.store';

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

  describe('loadJournals', () => {
    it('loads journals and updates progress state', async () => {
      const journal = createMockJournal({ id: 'journal-123' });
      mockedJournalService.list.mockResolvedValue([journal]);

      await useJournalStore.getState().loadJournals();

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

    it('creates journal lookup from loaded journals', async () => {
      const journals = [
        createMockJournal({ id: 'journal-1' }),
        createMockJournal({ id: 'journal-2' }),
      ];
      mockedJournalService.list.mockResolvedValue(journals);

      await useJournalStore.getState().loadJournals();

      const state = useJournalStore.getState();
      expect(state.journalLookup['journal-1']).toEqual(journals[0]);
      expect(state.journalLookup['journal-2']).toEqual(journals[1]);
    });

    it('sets currentJournalId to first journal when none is set', async () => {
      const journals = [createMockJournal({ id: 'journal-1' })];
      mockedJournalService.list.mockResolvedValue(journals);

      await useJournalStore.getState().loadJournals();

      const state = useJournalStore.getState();
      expect(state.currentJournalId).toBe('journal-1');
    });

    it('preserves currentJournalId if journal still exists', async () => {
      const journal = createMockJournal({ id: 'journal-1' });
      useJournalStore.setState({ currentJournalId: 'journal-1' });
      mockedJournalService.list.mockResolvedValue([journal]);

      await useJournalStore.getState().loadJournals();

      const state = useJournalStore.getState();
      expect(state.currentJournalId).toBe('journal-1');
    });

    it('sets currentJournalId to first journal when current no longer exists', async () => {
      const journals = [createMockJournal({ id: 'journal-2' })];
      useJournalStore.setState({ currentJournalId: 'journal-1' });
      mockedJournalService.list.mockResolvedValue(journals);

      await useJournalStore.getState().loadJournals();

      const state = useJournalStore.getState();
      expect(state.currentJournalId).toBe('journal-2');
    });
  });

  describe('createJournal', () => {
    it('creates journal and adds to beginning of array', async () => {
      const existing = createMockJournal({ id: 'journal-1' });
      const newJournal = createMockJournal({ id: 'journal-2' });

      useJournalStore.setState({ journals: [existing] });
      mockedJournalService.create.mockResolvedValue(newJournal);

      const input: CreateJournalInput = { name: 'New Journal' };
      await useJournalStore.getState().createJournal(input);

      const state = useJournalStore.getState();
      expect(state.journals[0]).toEqual(newJournal);
      expect(state.journals[1]).toEqual(existing);
      expect(state.progress.save.status).toBe('success');
    });

    it('adds created journal to lookup', async () => {
      const newJournal = createMockJournal({ id: 'journal-1' });
      mockedJournalService.create.mockResolvedValue(newJournal);

      const input: CreateJournalInput = { name: 'New Journal' };
      await useJournalStore.getState().createJournal(input);

      const state = useJournalStore.getState();
      expect(state.journalLookup['journal-1']).toEqual(newJournal);
    });

    it('records error state when create fails', async () => {
      mockedJournalService.create.mockRejectedValue(new Error('creation failed'));

      const input: CreateJournalInput = { name: 'New Journal' };
      await expect(useJournalStore.getState().createJournal(input)).rejects.toThrow(
        'creation failed'
      );

      const state = useJournalStore.getState();
      expect(state.progress.save.status).toBe('error');
      expect(state.progress.save.error).toBe('creation failed');
    });
  });

  describe('updateJournal', () => {
    it('updates journal in journals array and lookup', async () => {
      const journal = createMockJournal({ id: 'journal-1', name: 'Original' });
      const updated = createMockJournal({ id: 'journal-1', name: 'Updated' });

      useJournalStore.setState({
        journals: [journal],
        journalLookup: { 'journal-1': journal },
      });

      mockedJournalService.update.mockResolvedValue(updated);

      const updates: UpdateJournalInput = { name: 'Updated' };
      await useJournalStore.getState().updateJournal('journal-1', updates);

      const state = useJournalStore.getState();
      expect(state.journals[0]).toEqual(updated);
      expect(state.journalLookup['journal-1']).toEqual(updated);
      expect(state.progress.save.status).toBe('success');
    });

    it('records error state when update fails', async () => {
      const journal = createMockJournal({ id: 'journal-1' });
      useJournalStore.setState({
        journals: [journal],
        journalLookup: { 'journal-1': journal },
      });

      mockedJournalService.update.mockRejectedValue(new Error('update failed'));

      const updates: UpdateJournalInput = { name: 'Updated' };
      await expect(useJournalStore.getState().updateJournal('journal-1', updates)).rejects.toThrow(
        'update failed'
      );

      const state = useJournalStore.getState();
      expect(state.progress.save.status).toBe('error');
      expect(state.progress.save.error).toBe('update failed');
    });
  });

  describe('deleteJournal', () => {
    it('removes journal from journals array and lookup', async () => {
      const journal = createMockJournal({ id: 'journal-1' });

      useJournalStore.setState({
        journals: [journal],
        journalLookup: { 'journal-1': journal },
      });

      mockedJournalService.remove.mockResolvedValue();

      await useJournalStore.getState().deleteJournal('journal-1');

      const state = useJournalStore.getState();
      expect(state.journals).toEqual([]);
      expect(state.journalLookup['journal-1']).toBeUndefined();
      expect(state.progress.remove.status).toBe('success');
    });

    it('sets currentJournalId to first journal when deleting current', async () => {
      const journal1 = createMockJournal({ id: 'journal-1' });
      const journal2 = createMockJournal({ id: 'journal-2' });

      useJournalStore.setState({
        journals: [journal1, journal2],
        journalLookup: { 'journal-1': journal1, 'journal-2': journal2 },
        currentJournalId: 'journal-1',
      });

      mockedJournalService.remove.mockResolvedValue();

      await useJournalStore.getState().deleteJournal('journal-1');

      const state = useJournalStore.getState();
      expect(state.currentJournalId).toBe('journal-2');
    });

    it('sets currentJournalId to null when deleting last journal', async () => {
      const journal = createMockJournal({ id: 'journal-1' });

      useJournalStore.setState({
        journals: [journal],
        journalLookup: { 'journal-1': journal },
        currentJournalId: 'journal-1',
      });

      mockedJournalService.remove.mockResolvedValue();

      await useJournalStore.getState().deleteJournal('journal-1');

      const state = useJournalStore.getState();
      expect(state.currentJournalId).toBeNull();
    });

    it('records error state when delete fails', async () => {
      const journal = createMockJournal({ id: 'journal-1' });
      useJournalStore.setState({
        journals: [journal],
        journalLookup: { 'journal-1': journal },
      });

      mockedJournalService.remove.mockRejectedValue(new Error('delete failed'));

      await expect(useJournalStore.getState().deleteJournal('journal-1')).rejects.toThrow(
        'delete failed'
      );

      const state = useJournalStore.getState();
      expect(state.progress.remove.status).toBe('error');
      expect(state.progress.remove.error).toBe('delete failed');
    });
  });

  describe('setCurrentJournal', () => {
    it('sets currentJournalId when journal exists in lookup', () => {
      const journal = createMockJournal({ id: 'journal-1' });
      useJournalStore.setState({
        journalLookup: { 'journal-1': journal },
      });

      useJournalStore.getState().setCurrentJournal(journal);

      const state = useJournalStore.getState();
      expect(state.currentJournalId).toBe('journal-1');
    });

    it('does not set currentJournalId when journal not in lookup', () => {
      const journal = createMockJournal({ id: 'journal-1' });

      useJournalStore.getState().setCurrentJournal(journal);

      const state = useJournalStore.getState();
      expect(state.currentJournalId).toBeNull();
    });

    it('clears currentJournalId when passed null', () => {
      useJournalStore.setState({ currentJournalId: 'journal-1' });

      useJournalStore.getState().setCurrentJournal(null);

      const state = useJournalStore.getState();
      expect(state.currentJournalId).toBeNull();
    });
  });

  describe('setCurrentJournalId', () => {
    it('sets currentJournalId when journal exists in lookup', () => {
      const journal = createMockJournal({ id: 'journal-1' });
      useJournalStore.setState({
        journalLookup: { 'journal-1': journal },
      });

      useJournalStore.getState().setCurrentJournalId('journal-1');

      const state = useJournalStore.getState();
      expect(state.currentJournalId).toBe('journal-1');
    });

    it('does not set currentJournalId when journal not in lookup', () => {
      useJournalStore.getState().setCurrentJournalId('journal-1');

      const state = useJournalStore.getState();
      expect(state.currentJournalId).toBeNull();
    });

    it('clears currentJournalId when passed null', () => {
      useJournalStore.setState({ currentJournalId: 'journal-1' });

      useJournalStore.getState().setCurrentJournalId(null);

      const state = useJournalStore.getState();
      expect(state.currentJournalId).toBeNull();
    });
  });

  describe('Selectors', () => {
    it('selectJournals returns journals array', () => {
      const journals = [createMockJournal({ id: 'journal-1' })];
      useJournalStore.setState({ journals });

      const result = selectJournals(useJournalStore.getState());
      expect(result).toEqual(journals);
    });

    it('selectJournalLookup returns journal lookup', () => {
      const journal = createMockJournal({ id: 'journal-1' });
      useJournalStore.setState({ journalLookup: { 'journal-1': journal } });

      const result = selectJournalLookup(useJournalStore.getState());
      expect(result).toEqual({ 'journal-1': journal });
    });

    it('selectCurrentJournalId returns currentJournalId', () => {
      useJournalStore.setState({ currentJournalId: 'journal-1' });

      const result = selectCurrentJournalId(useJournalStore.getState());
      expect(result).toBe('journal-1');
    });

    it('selectCurrentJournal returns current journal from lookup', () => {
      const journal = createMockJournal({ id: 'journal-1' });
      useJournalStore.setState({
        currentJournalId: 'journal-1',
        journalLookup: { 'journal-1': journal },
      });

      const result = selectCurrentJournal(useJournalStore.getState());
      expect(result).toEqual(journal);
    });

    it('selectCurrentJournal returns null when no current journal', () => {
      const result = selectCurrentJournal(useJournalStore.getState());
      expect(result).toBeNull();
    });

    it('selectJournalProgress returns progress state', () => {
      const result = selectJournalProgress(useJournalStore.getState());
      expect(result).toHaveProperty('load');
      expect(result).toHaveProperty('save');
      expect(result).toHaveProperty('remove');
    });
  });
});
