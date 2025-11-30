import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

import { IPC_CHANNELS } from '@shared/ipc';
import type { Entry } from '@shared/types';

// Mock the container to return a mocked service
const mockEntryService = {
  createEntry: vi.fn() as Mock,
  getAllEntries: vi.fn() as Mock,
  getEntryById: vi.fn() as Mock,
  updateEntry: vi.fn() as Mock,
  deleteEntry: vi.fn() as Mock,
  searchEntries: vi.fn() as Mock,
  entryExists: vi.fn() as Mock,
};

vi.mock('../../domain/container', () => ({
  getEntryService: () => mockEntryService,
  getJournalService: vi.fn(),
  getSettingsService: vi.fn(),
}));

// Mock the database module

// Mock the safe handler registration
const mockHandlers = new Map<string, (...args: unknown[]) => unknown>();
vi.mock('../../ipc/safe-handler', () => ({
  registerSafeHandler: vi.fn(
    (channel: string, _schema: unknown, handler: (...args: unknown[]) => unknown) => {
      mockHandlers.set(channel, handler);
    }
  ),
}));

// Import after mocks are set up
import { registerEntryHandlers } from './entry.ipc';

describe('entry.ipc.ts - Entry IPC Handlers', () => {
  const mockEvent = {} as never;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHandlers.clear();
    registerEntryHandlers();
  });

  describe('registerEntryHandlers', () => {
    it('should register all entry IPC handlers', () => {
      expect(mockHandlers.size).toBe(11);
      expect(mockHandlers.has(IPC_CHANNELS.ENTRY_CREATE)).toBe(true);
      expect(mockHandlers.has(IPC_CHANNELS.ENTRY_GET_ALL)).toBe(true);
      expect(mockHandlers.has(IPC_CHANNELS.ENTRY_GET_BY_ID)).toBe(true);
      expect(mockHandlers.has(IPC_CHANNELS.ENTRY_UPDATE)).toBe(true);
      expect(mockHandlers.has(IPC_CHANNELS.ENTRY_DELETE)).toBe(true);
      expect(mockHandlers.has(IPC_CHANNELS.ENTRY_SEARCH)).toBe(true);
      expect(mockHandlers.has(IPC_CHANNELS.ENTRY_ADVANCED_SEARCH)).toBe(true);
      expect(mockHandlers.has(IPC_CHANNELS.ENTRY_ARCHIVE)).toBe(true);
      expect(mockHandlers.has(IPC_CHANNELS.ENTRY_UNARCHIVE)).toBe(true);
      expect(mockHandlers.has(IPC_CHANNELS.ENTRY_UPDATE_STATUS)).toBe(true);
      expect(mockHandlers.has(IPC_CHANNELS.ENTRY_GET_BY_STATUS)).toBe(true);
    });
  });

  describe('ENTRY_CREATE handler', () => {
    it('should create an entry with all fields', async () => {
      const mockEntry: Entry = {
        id: 'entry-1',
        journalId: 'journal-1',
        title: 'Test Entry',
        content: '<p>Test content</p>',
        tags: ['test', 'unit'],
        status: 'active',
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockEntryService.createEntry.mockReturnValue(mockEntry);

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_CREATE)!;
      const result = await handler(mockEvent, [
        {
          journalId: 'journal-1',
          title: 'Test Entry',
          content: '<p>Test content</p>',
          tags: ['test', 'unit'],
        },
      ]);

      expect(mockEntryService.createEntry).toHaveBeenCalledWith({
        journalId: 'journal-1',
        title: 'Test Entry',
        content: '<p>Test content</p>',
        tags: ['test', 'unit'],
      });
      expect(result).toEqual(mockEntry);
    });

    it('should create an entry with minimal fields', async () => {
      const mockEntry: Entry = {
        id: 'entry-1',
        journalId: 'journal-1',
        content: '<p>Content only</p>',
        status: 'active',
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockEntryService.createEntry.mockReturnValue(mockEntry);

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_CREATE)!;
      const result = await handler(mockEvent, [
        {
          journalId: 'journal-1',
          content: '<p>Content only</p>',
        },
      ]);

      expect(mockEntryService.createEntry).toHaveBeenCalledWith({
        journalId: 'journal-1',
        content: '<p>Content only</p>',
      });
      expect(result).toEqual(mockEntry);
    });

    it('should handle entries without title and tags', async () => {
      const mockEntry: Entry = {
        id: 'entry-1',
        journalId: 'journal-1',
        content: '<p>Simple entry</p>',
        status: 'active',
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockEntryService.createEntry.mockReturnValue(mockEntry);

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_CREATE)!;
      await handler(mockEvent, [{ journalId: 'journal-1', content: '<p>Simple entry</p>' }]);

      expect(mockEntryService.createEntry).toHaveBeenCalledTimes(1);
    });
  });

  describe('ENTRY_GET_ALL handler', () => {
    it('should return all entries when no journalId provided', async () => {
      const mockEntries: Entry[] = [
        {
          id: 'entry-1',
          journalId: 'journal-1',
          content: '<p>Entry 1</p>',
          status: 'active',
          isFavorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'entry-2',
          journalId: 'journal-2',
          content: '<p>Entry 2</p>',
          status: 'active',
          isFavorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockEntryService.getAllEntries.mockReturnValue(mockEntries);

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_GET_ALL)!;
      const result = await handler(mockEvent, [undefined]);

      expect(mockEntryService.getAllEntries).toHaveBeenCalledWith({ journalId: undefined });
      expect(result).toEqual(mockEntries);
    });

    it('should filter entries by journalId', async () => {
      const mockEntries: Entry[] = [
        {
          id: 'entry-1',
          journalId: 'journal-1',
          content: '<p>Entry 1</p>',
          status: 'active',
          isFavorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockEntryService.getAllEntries.mockReturnValue(mockEntries);

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_GET_ALL)!;
      const result = await handler(mockEvent, ['journal-1']);

      expect(mockEntryService.getAllEntries).toHaveBeenCalledWith({ journalId: 'journal-1' });
      expect(result).toEqual(mockEntries);
    });

    it('should return empty array when no entries exist', async () => {
      mockEntryService.getAllEntries.mockReturnValue([]);

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_GET_ALL)!;
      const result = await handler(mockEvent, [undefined]);

      expect(result).toEqual([]);
    });
  });

  describe('ENTRY_GET_BY_ID handler', () => {
    it('should return entry by ID', async () => {
      const mockEntry: Entry = {
        id: 'entry-1',
        journalId: 'journal-1',
        content: '<p>Test content</p>',
        status: 'active',
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockEntryService.getEntryById.mockReturnValue(mockEntry);

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_GET_BY_ID)!;
      const result = await handler(mockEvent, ['entry-1']);

      expect(mockEntryService.getEntryById).toHaveBeenCalledWith('entry-1');
      expect(result).toEqual(mockEntry);
    });

    it('should return null when entry not found', async () => {
      mockEntryService.getEntryById.mockReturnValue(null);

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_GET_BY_ID)!;
      const result = await handler(mockEvent, ['non-existent']);

      expect(result).toBeNull();
    });
  });

  describe('ENTRY_UPDATE handler', () => {
    it('should update entry title', async () => {
      const mockEntry: Entry = {
        id: 'entry-1',
        journalId: 'journal-1',
        title: 'Updated Title',
        content: '<p>Content</p>',
        status: 'active',
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockEntryService.updateEntry.mockReturnValue(mockEntry);

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_UPDATE)!;
      const result = await handler(mockEvent, ['entry-1', { title: 'Updated Title' }]);

      expect(mockEntryService.updateEntry).toHaveBeenCalledWith('entry-1', {
        title: 'Updated Title',
      });
      expect(result).toEqual(mockEntry);
    });

    it('should update entry content', async () => {
      const mockEntry: Entry = {
        id: 'entry-1',
        journalId: 'journal-1',
        content: '<p>Updated content</p>',
        status: 'active',
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockEntryService.updateEntry.mockReturnValue(mockEntry);

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_UPDATE)!;
      const result = await handler(mockEvent, ['entry-1', { content: '<p>Updated content</p>' }]);

      expect(mockEntryService.updateEntry).toHaveBeenCalledWith('entry-1', {
        content: '<p>Updated content</p>',
      });
      expect(result).toEqual(mockEntry);
    });

    it('should update entry tags', async () => {
      const mockEntry: Entry = {
        id: 'entry-1',
        journalId: 'journal-1',
        content: '<p>Content</p>',
        tags: ['updated', 'tags'],
        status: 'active',
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockEntryService.updateEntry.mockReturnValue(mockEntry);

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_UPDATE)!;
      const result = await handler(mockEvent, ['entry-1', { tags: ['updated', 'tags'] }]);

      expect(mockEntryService.updateEntry).toHaveBeenCalledWith('entry-1', {
        tags: ['updated', 'tags'],
      });
      expect(result).toEqual(mockEntry);
    });

    it('should update multiple fields at once', async () => {
      const mockEntry: Entry = {
        id: 'entry-1',
        journalId: 'journal-1',
        title: 'New Title',
        content: '<p>New content</p>',
        tags: ['new'],
        status: 'active',
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockEntryService.updateEntry.mockReturnValue(mockEntry);

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_UPDATE)!;
      const result = await handler(mockEvent, [
        'entry-1',
        {
          title: 'New Title',
          content: '<p>New content</p>',
          tags: ['new'],
        },
      ]);

      expect(mockEntryService.updateEntry).toHaveBeenCalledWith('entry-1', {
        title: 'New Title',
        content: '<p>New content</p>',
        tags: ['new'],
      });
      expect(result).toEqual(mockEntry);
    });

    it('should handle nullable fields', async () => {
      const mockEntry: Entry = {
        id: 'entry-1',
        journalId: 'journal-1',
        content: '<p>Content</p>',
        status: 'active',
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockEntryService.updateEntry.mockReturnValue(mockEntry);

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_UPDATE)!;
      await handler(mockEvent, ['entry-1', { title: null, tags: null }]);

      expect(mockEntryService.updateEntry).toHaveBeenCalledWith('entry-1', {
        title: null,
        tags: null,
      });
    });
  });

  describe('ENTRY_DELETE handler', () => {
    it('should delete entry by ID', async () => {
      mockEntryService.deleteEntry.mockReturnValue(true);

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_DELETE)!;
      const result = await handler(mockEvent, ['entry-1']);

      expect(mockEntryService.deleteEntry).toHaveBeenCalledWith('entry-1');
      expect(result).toBe(true);
    });

    it('should return true after successful deletion', async () => {
      mockEntryService.deleteEntry.mockReturnValue(true);

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_DELETE)!;
      const result = await handler(mockEvent, ['test-id']);

      expect(result).toBe(true);
    });
  });

  describe('ENTRY_SEARCH handler', () => {
    it('should search entries by query', async () => {
      const mockEntries: Entry[] = [
        {
          id: 'entry-1',
          journalId: 'journal-1',
          title: 'Meeting notes',
          content: '<p>Important meeting</p>',
          status: 'active',
          isFavorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockEntryService.searchEntries.mockReturnValue(mockEntries);

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_SEARCH)!;
      const result = await handler(mockEvent, ['meeting']);

      expect(mockEntryService.searchEntries).toHaveBeenCalledWith('meeting');
      expect(result).toEqual(mockEntries);
    });

    it('should return empty array when no matches found', async () => {
      mockEntryService.searchEntries.mockReturnValue([]);

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_SEARCH)!;
      const result = await handler(mockEvent, ['nonexistent']);

      expect(result).toEqual([]);
    });

    it('should handle complex search queries', async () => {
      mockEntryService.searchEntries.mockReturnValue([]);

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_SEARCH)!;
      await handler(mockEvent, ['project timeline deliverables']);

      expect(mockEntryService.searchEntries).toHaveBeenCalledWith('project timeline deliverables');
    });
  });

  describe('Error Handling', () => {
    it('should propagate database errors from createEntry', async () => {
      const error = new Error('Database error');
      mockEntryService.createEntry.mockImplementation(() => {
        throw error;
      });

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_CREATE)!;

      await expect(
        handler(mockEvent, [{ journalId: 'journal-1', content: '<p>Test</p>' }])
      ).rejects.toThrow('Database error');
    });

    it('should propagate errors from searchEntries', async () => {
      const error = new Error('Search failed');
      mockEntryService.searchEntries.mockImplementation(() => {
        throw error;
      });

      const handler = mockHandlers.get(IPC_CHANNELS.ENTRY_SEARCH)!;

      await expect(handler(mockEvent, ['query'])).rejects.toThrow('Search failed');
    });
  });
});
