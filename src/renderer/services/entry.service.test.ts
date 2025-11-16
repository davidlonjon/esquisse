import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ElectronAPI } from '@shared/ipc';
import type { CreateEntryInput, Entry, Result, UpdateEntryInput } from '@shared/types';

import { entryService } from './entry.service';

describe('entry.service.ts - Entry Service', () => {
  let mockApi: Partial<ElectronAPI>;
  let originalWindowApi: ElectronAPI | undefined;

  beforeEach(() => {
    originalWindowApi = window.api;

    mockApi = {
      getAllEntries: vi.fn(),
      createEntry: vi.fn(),
      updateEntry: vi.fn(),
      deleteEntry: vi.fn(),
      searchEntries: vi.fn(),
    };

    window.api = mockApi as ElectronAPI;
  });

  afterEach(() => {
    if (originalWindowApi) {
      window.api = originalWindowApi;
    } else {
      delete (window as { api?: ElectronAPI }).api;
    }
  });

  describe('list', () => {
    it('should return all entries when no journalId provided', async () => {
      const mockEntries: Entry[] = [
        {
          id: 'entry-1',
          journalId: 'journal-1',
          content: '<p>Entry 1</p>',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'entry-2',
          journalId: 'journal-2',
          content: '<p>Entry 2</p>',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result: Result<Entry[]> = {
        ok: true,
        data: mockEntries,
      };

      vi.mocked(mockApi.getAllEntries!).mockResolvedValue(result);

      const entries = await entryService.list();

      expect(mockApi.getAllEntries).toHaveBeenCalledWith(undefined);
      expect(entries).toEqual(mockEntries);
    });

    it('should filter entries by journalId', async () => {
      const mockEntries: Entry[] = [
        {
          id: 'entry-1',
          journalId: 'journal-1',
          content: '<p>Entry 1</p>',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result: Result<Entry[]> = {
        ok: true,
        data: mockEntries,
      };

      vi.mocked(mockApi.getAllEntries!).mockResolvedValue(result);

      const entries = await entryService.list('journal-1');

      expect(mockApi.getAllEntries).toHaveBeenCalledWith('journal-1');
      expect(entries).toEqual(mockEntries);
    });

    it('should return empty array when no entries exist', async () => {
      const result: Result<Entry[]> = {
        ok: true,
        data: [],
      };

      vi.mocked(mockApi.getAllEntries!).mockResolvedValue(result);

      const entries = await entryService.list();

      expect(entries).toEqual([]);
    });

    it('should throw error on failure', async () => {
      const result: Result<Entry[]> = {
        ok: false,
        error: {
          message: 'Failed to fetch entries',
        },
      };

      vi.mocked(mockApi.getAllEntries!).mockResolvedValue(result);

      await expect(entryService.list()).rejects.toThrow('Failed to fetch entries');
    });
  });

  describe('create', () => {
    it('should create entry with all fields', async () => {
      const input: CreateEntryInput = {
        journalId: 'journal-1',
        title: 'Test Entry',
        content: '<p>Test content</p>',
        tags: ['test', 'unit'],
      };

      const mockEntry: Entry = {
        id: 'entry-1',
        journalId: 'journal-1',
        title: 'Test Entry',
        content: '<p>Test content</p>',
        tags: ['test', 'unit'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result: Result<Entry> = {
        ok: true,
        data: mockEntry,
      };

      vi.mocked(mockApi.createEntry!).mockResolvedValue(result);

      const entry = await entryService.create(input);

      expect(mockApi.createEntry).toHaveBeenCalledWith(input);
      expect(entry).toEqual(mockEntry);
    });

    it('should create entry with minimal fields', async () => {
      const input: CreateEntryInput = {
        journalId: 'journal-1',
        content: '<p>Minimal content</p>',
      };

      const mockEntry: Entry = {
        id: 'entry-1',
        journalId: 'journal-1',
        content: '<p>Minimal content</p>',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result: Result<Entry> = {
        ok: true,
        data: mockEntry,
      };

      vi.mocked(mockApi.createEntry!).mockResolvedValue(result);

      const entry = await entryService.create(input);

      expect(entry).toEqual(mockEntry);
    });

    it('should throw error on creation failure', async () => {
      const input: CreateEntryInput = {
        journalId: 'journal-1',
        content: '<p>Test</p>',
      };

      const result: Result<Entry> = {
        ok: false,
        error: {
          message: 'Creation failed',
          code: 'CREATE_ERROR',
        },
      };

      vi.mocked(mockApi.createEntry!).mockResolvedValue(result);

      await expect(entryService.create(input)).rejects.toThrow('Creation failed (CREATE_ERROR)');
    });
  });

  describe('update', () => {
    it('should update entry title', async () => {
      const updates: UpdateEntryInput = {
        title: 'Updated Title',
      };

      const mockEntry: Entry = {
        id: 'entry-1',
        journalId: 'journal-1',
        title: 'Updated Title',
        content: '<p>Content</p>',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result: Result<Entry> = {
        ok: true,
        data: mockEntry,
      };

      vi.mocked(mockApi.updateEntry!).mockResolvedValue(result);

      const entry = await entryService.update('entry-1', updates);

      expect(mockApi.updateEntry).toHaveBeenCalledWith('entry-1', updates);
      expect(entry.title).toBe('Updated Title');
    });

    it('should update entry content', async () => {
      const updates: UpdateEntryInput = {
        content: '<p>Updated content</p>',
      };

      const mockEntry: Entry = {
        id: 'entry-1',
        journalId: 'journal-1',
        content: '<p>Updated content</p>',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result: Result<Entry> = {
        ok: true,
        data: mockEntry,
      };

      vi.mocked(mockApi.updateEntry!).mockResolvedValue(result);

      const entry = await entryService.update('entry-1', updates);

      expect(entry.content).toBe('<p>Updated content</p>');
    });

    it('should update entry tags', async () => {
      const updates: UpdateEntryInput = {
        tags: ['updated', 'tags'],
      };

      const mockEntry: Entry = {
        id: 'entry-1',
        journalId: 'journal-1',
        content: '<p>Content</p>',
        tags: ['updated', 'tags'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result: Result<Entry> = {
        ok: true,
        data: mockEntry,
      };

      vi.mocked(mockApi.updateEntry!).mockResolvedValue(result);

      const entry = await entryService.update('entry-1', updates);

      expect(entry.tags).toEqual(['updated', 'tags']);
    });

    it('should update multiple fields', async () => {
      const updates: UpdateEntryInput = {
        title: 'New Title',
        content: '<p>New content</p>',
        tags: ['new'],
      };

      const mockEntry: Entry = {
        id: 'entry-1',
        journalId: 'journal-1',
        title: 'New Title',
        content: '<p>New content</p>',
        tags: ['new'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result: Result<Entry> = {
        ok: true,
        data: mockEntry,
      };

      vi.mocked(mockApi.updateEntry!).mockResolvedValue(result);

      const entry = await entryService.update('entry-1', updates);

      expect(entry).toEqual(mockEntry);
    });

    it('should handle nullable fields', async () => {
      const updates: UpdateEntryInput = {
        title: null,
        tags: null,
      };

      const mockEntry: Entry = {
        id: 'entry-1',
        journalId: 'journal-1',
        content: '<p>Content</p>',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result: Result<Entry> = {
        ok: true,
        data: mockEntry,
      };

      vi.mocked(mockApi.updateEntry!).mockResolvedValue(result);

      const entry = await entryService.update('entry-1', updates);

      expect(entry.title).toBeUndefined();
      expect(entry.tags).toBeUndefined();
    });

    it('should throw error on update failure', async () => {
      const updates: UpdateEntryInput = {
        title: 'Updated',
      };

      const result: Result<Entry> = {
        ok: false,
        error: {
          message: 'Update failed',
        },
      };

      vi.mocked(mockApi.updateEntry!).mockResolvedValue(result);

      await expect(entryService.update('entry-1', updates)).rejects.toThrow('Update failed');
    });
  });

  describe('remove', () => {
    it('should delete entry by id', async () => {
      const result: Result<boolean> = {
        ok: true,
        data: true,
      };

      vi.mocked(mockApi.deleteEntry!).mockResolvedValue(result);

      await entryService.remove('entry-1');

      expect(mockApi.deleteEntry).toHaveBeenCalledWith('entry-1');
    });

    it('should not throw on successful deletion', async () => {
      const result: Result<boolean> = {
        ok: true,
        data: true,
      };

      vi.mocked(mockApi.deleteEntry!).mockResolvedValue(result);

      await expect(entryService.remove('entry-1')).resolves.not.toThrow();
    });

    it('should throw error on deletion failure', async () => {
      const result: Result<boolean> = {
        ok: false,
        error: {
          message: 'Deletion failed',
        },
      };

      vi.mocked(mockApi.deleteEntry!).mockResolvedValue(result);

      await expect(entryService.remove('entry-1')).rejects.toThrow('Deletion failed');
    });
  });

  describe('search', () => {
    it('should search entries by query', async () => {
      const mockEntries: Entry[] = [
        {
          id: 'entry-1',
          journalId: 'journal-1',
          title: 'Meeting notes',
          content: '<p>Important meeting</p>',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result: Result<Entry[]> = {
        ok: true,
        data: mockEntries,
      };

      vi.mocked(mockApi.searchEntries!).mockResolvedValue(result);

      const entries = await entryService.search('meeting');

      expect(mockApi.searchEntries).toHaveBeenCalledWith('meeting');
      expect(entries).toEqual(mockEntries);
    });

    it('should return empty array when no matches found', async () => {
      const result: Result<Entry[]> = {
        ok: true,
        data: [],
      };

      vi.mocked(mockApi.searchEntries!).mockResolvedValue(result);

      const entries = await entryService.search('nonexistent');

      expect(entries).toEqual([]);
    });

    it('should handle complex search queries', async () => {
      const result: Result<Entry[]> = {
        ok: true,
        data: [],
      };

      vi.mocked(mockApi.searchEntries!).mockResolvedValue(result);

      await entryService.search('project timeline deliverables');

      expect(mockApi.searchEntries).toHaveBeenCalledWith('project timeline deliverables');
    });

    it('should throw error on search failure', async () => {
      const result: Result<Entry[]> = {
        ok: false,
        error: {
          message: 'Search failed',
        },
      };

      vi.mocked(mockApi.searchEntries!).mockResolvedValue(result);

      await expect(entryService.search('query')).rejects.toThrow('Search failed');
    });
  });

  describe('Integration Tests', () => {
    it('should support full CRUD workflow', async () => {
      // Create
      const createInput: CreateEntryInput = {
        journalId: 'journal-1',
        title: 'Integration Test Entry',
        content: '<p>Test content</p>',
      };

      const createdEntry: Entry = {
        id: 'entry-1',
        journalId: 'journal-1',
        title: 'Integration Test Entry',
        content: '<p>Test content</p>',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(mockApi.createEntry!).mockResolvedValue({
        ok: true,
        data: createdEntry,
      });

      const created = await entryService.create(createInput);
      expect(created.id).toBe('entry-1');

      // List
      vi.mocked(mockApi.getAllEntries!).mockResolvedValue({
        ok: true,
        data: [createdEntry],
      });

      const entries = await entryService.list('journal-1');
      expect(entries).toHaveLength(1);

      // Search
      vi.mocked(mockApi.searchEntries!).mockResolvedValue({
        ok: true,
        data: [createdEntry],
      });

      const searchResults = await entryService.search('Integration');
      expect(searchResults).toHaveLength(1);

      // Update
      const updateInput: UpdateEntryInput = {
        title: 'Updated Entry',
      };

      const updatedEntry: Entry = {
        ...createdEntry,
        title: 'Updated Entry',
      };

      vi.mocked(mockApi.updateEntry!).mockResolvedValue({
        ok: true,
        data: updatedEntry,
      });

      const updated = await entryService.update('entry-1', updateInput);
      expect(updated.title).toBe('Updated Entry');

      // Delete
      vi.mocked(mockApi.deleteEntry!).mockResolvedValue({
        ok: true,
        data: true,
      });

      await entryService.remove('entry-1');
      expect(mockApi.deleteEntry).toHaveBeenCalledWith('entry-1');
    });
  });
});
