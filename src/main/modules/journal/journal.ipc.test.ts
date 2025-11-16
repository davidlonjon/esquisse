import { describe, it, expect, vi, beforeEach } from 'vitest';

import { IPC_CHANNELS } from '@shared/ipc';
import type { Journal } from '@shared/types';

import * as journalDb from '../../database/journals';

// Mock the database module
vi.mock('../../database/journals');

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
import { registerJournalHandlers } from './journal.ipc';

describe('journal.ipc.ts - Journal IPC Handlers', () => {
  const mockEvent = {} as never;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHandlers.clear();
    registerJournalHandlers();
  });

  describe('registerJournalHandlers', () => {
    it('should register all journal IPC handlers', () => {
      expect(mockHandlers.size).toBe(5);
      expect(mockHandlers.has(IPC_CHANNELS.JOURNAL_CREATE)).toBe(true);
      expect(mockHandlers.has(IPC_CHANNELS.JOURNAL_GET_ALL)).toBe(true);
      expect(mockHandlers.has(IPC_CHANNELS.JOURNAL_GET_BY_ID)).toBe(true);
      expect(mockHandlers.has(IPC_CHANNELS.JOURNAL_UPDATE)).toBe(true);
      expect(mockHandlers.has(IPC_CHANNELS.JOURNAL_DELETE)).toBe(true);
    });
  });

  describe('JOURNAL_CREATE handler', () => {
    it('should create a journal with all fields', async () => {
      const mockJournal: Journal = {
        id: 'journal-1',
        name: 'Test Journal',
        description: 'Test description',
        color: '#3B82F6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(journalDb.createJournal).mockReturnValue(mockJournal);

      const handler = mockHandlers.get(IPC_CHANNELS.JOURNAL_CREATE)!;
      const result = await handler(mockEvent, [
        {
          name: 'Test Journal',
          description: 'Test description',
          color: '#3B82F6',
        },
      ]);

      expect(journalDb.createJournal).toHaveBeenCalledWith({
        name: 'Test Journal',
        description: 'Test description',
        color: '#3B82F6',
      });
      expect(result).toEqual(mockJournal);
    });

    it('should create a journal with minimal fields', async () => {
      const mockJournal: Journal = {
        id: 'journal-1',
        name: 'Test Journal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(journalDb.createJournal).mockReturnValue(mockJournal);

      const handler = mockHandlers.get(IPC_CHANNELS.JOURNAL_CREATE)!;
      const result = await handler(mockEvent, [{ name: 'Test Journal' }]);

      expect(journalDb.createJournal).toHaveBeenCalledWith({ name: 'Test Journal' });
      expect(result).toEqual(mockJournal);
    });

    it('should call createJournal with correct parameters', async () => {
      const mockJournal: Journal = {
        id: 'journal-1',
        name: 'My Journal',
        description: 'Personal notes',
        color: '#10B981',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(journalDb.createJournal).mockReturnValue(mockJournal);

      const handler = mockHandlers.get(IPC_CHANNELS.JOURNAL_CREATE)!;
      await handler(mockEvent, [
        {
          name: 'My Journal',
          description: 'Personal notes',
          color: '#10B981',
        },
      ]);

      expect(journalDb.createJournal).toHaveBeenCalledTimes(1);
      expect(journalDb.createJournal).toHaveBeenCalledWith({
        name: 'My Journal',
        description: 'Personal notes',
        color: '#10B981',
      });
    });
  });

  describe('JOURNAL_GET_ALL handler', () => {
    it('should return all journals', async () => {
      const mockJournals: Journal[] = [
        {
          id: 'journal-1',
          name: 'Journal 1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'journal-2',
          name: 'Journal 2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      vi.mocked(journalDb.getAllJournals).mockReturnValue(mockJournals);

      const handler = mockHandlers.get(IPC_CHANNELS.JOURNAL_GET_ALL)!;
      const result = await handler(mockEvent, []);

      expect(journalDb.getAllJournals).toHaveBeenCalledWith();
      expect(result).toEqual(mockJournals);
    });

    it('should return empty array when no journals exist', async () => {
      vi.mocked(journalDb.getAllJournals).mockReturnValue([]);

      const handler = mockHandlers.get(IPC_CHANNELS.JOURNAL_GET_ALL)!;
      const result = await handler(mockEvent, []);

      expect(result).toEqual([]);
    });

    it('should call getAllJournals without parameters', async () => {
      vi.mocked(journalDb.getAllJournals).mockReturnValue([]);

      const handler = mockHandlers.get(IPC_CHANNELS.JOURNAL_GET_ALL)!;
      await handler(mockEvent, []);

      expect(journalDb.getAllJournals).toHaveBeenCalledTimes(1);
      expect(journalDb.getAllJournals).toHaveBeenCalledWith();
    });
  });

  describe('JOURNAL_GET_BY_ID handler', () => {
    it('should return journal by ID', async () => {
      const mockJournal: Journal = {
        id: 'journal-1',
        name: 'Test Journal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(journalDb.getJournalById).mockReturnValue(mockJournal);

      const handler = mockHandlers.get(IPC_CHANNELS.JOURNAL_GET_BY_ID)!;
      const result = await handler(mockEvent, ['journal-1']);

      expect(journalDb.getJournalById).toHaveBeenCalledWith('journal-1');
      expect(result).toEqual(mockJournal);
    });

    it('should return null when journal not found', async () => {
      vi.mocked(journalDb.getJournalById).mockReturnValue(null);

      const handler = mockHandlers.get(IPC_CHANNELS.JOURNAL_GET_BY_ID)!;
      const result = await handler(mockEvent, ['non-existent']);

      expect(journalDb.getJournalById).toHaveBeenCalledWith('non-existent');
      expect(result).toBeNull();
    });

    it('should pass correct ID to getJournalById', async () => {
      vi.mocked(journalDb.getJournalById).mockReturnValue(null);

      const handler = mockHandlers.get(IPC_CHANNELS.JOURNAL_GET_BY_ID)!;
      await handler(mockEvent, ['test-id-123']);

      expect(journalDb.getJournalById).toHaveBeenCalledTimes(1);
      expect(journalDb.getJournalById).toHaveBeenCalledWith('test-id-123');
    });
  });

  describe('JOURNAL_UPDATE handler', () => {
    it('should update journal name', async () => {
      const mockJournal: Journal = {
        id: 'journal-1',
        name: 'Updated Name',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(journalDb.updateJournal).mockReturnValue(mockJournal);

      const handler = mockHandlers.get(IPC_CHANNELS.JOURNAL_UPDATE)!;
      const result = await handler(mockEvent, ['journal-1', { name: 'Updated Name' }]);

      expect(journalDb.updateJournal).toHaveBeenCalledWith('journal-1', { name: 'Updated Name' });
      expect(result).toEqual(mockJournal);
    });

    it('should update multiple fields', async () => {
      const mockJournal: Journal = {
        id: 'journal-1',
        name: 'Updated Name',
        description: 'Updated Description',
        color: '#FF0000',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(journalDb.updateJournal).mockReturnValue(mockJournal);

      const handler = mockHandlers.get(IPC_CHANNELS.JOURNAL_UPDATE)!;
      const result = await handler(mockEvent, [
        'journal-1',
        {
          name: 'Updated Name',
          description: 'Updated Description',
          color: '#FF0000',
        },
      ]);

      expect(journalDb.updateJournal).toHaveBeenCalledWith('journal-1', {
        name: 'Updated Name',
        description: 'Updated Description',
        color: '#FF0000',
      });
      expect(result).toEqual(mockJournal);
    });

    it('should handle partial updates', async () => {
      const mockJournal: Journal = {
        id: 'journal-1',
        name: 'Test Journal',
        description: 'New Description',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(journalDb.updateJournal).mockReturnValue(mockJournal);

      const handler = mockHandlers.get(IPC_CHANNELS.JOURNAL_UPDATE)!;
      const result = await handler(mockEvent, ['journal-1', { description: 'New Description' }]);

      expect(journalDb.updateJournal).toHaveBeenCalledWith('journal-1', {
        description: 'New Description',
      });
      expect(result).toEqual(mockJournal);
    });

    it('should handle nullable fields', async () => {
      const mockJournal: Journal = {
        id: 'journal-1',
        name: 'Test Journal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(journalDb.updateJournal).mockReturnValue(mockJournal);

      const handler = mockHandlers.get(IPC_CHANNELS.JOURNAL_UPDATE)!;
      const result = await handler(mockEvent, ['journal-1', { description: null, color: null }]);

      expect(journalDb.updateJournal).toHaveBeenCalledWith('journal-1', {
        description: null,
        color: null,
      });
      expect(result).toEqual(mockJournal);
    });
  });

  describe('JOURNAL_DELETE handler', () => {
    it('should delete journal by ID', async () => {
      vi.mocked(journalDb.deleteJournal).mockReturnValue(true);

      const handler = mockHandlers.get(IPC_CHANNELS.JOURNAL_DELETE)!;
      const result = await handler(mockEvent, ['journal-1']);

      expect(journalDb.deleteJournal).toHaveBeenCalledWith('journal-1');
      expect(result).toBe(true);
    });

    it('should return true after successful deletion', async () => {
      vi.mocked(journalDb.deleteJournal).mockReturnValue(true);

      const handler = mockHandlers.get(IPC_CHANNELS.JOURNAL_DELETE)!;
      const result = await handler(mockEvent, ['test-id']);

      expect(result).toBe(true);
    });

    it('should pass correct ID to deleteJournal', async () => {
      vi.mocked(journalDb.deleteJournal).mockReturnValue(true);

      const handler = mockHandlers.get(IPC_CHANNELS.JOURNAL_DELETE)!;
      await handler(mockEvent, ['delete-this-id']);

      expect(journalDb.deleteJournal).toHaveBeenCalledTimes(1);
      expect(journalDb.deleteJournal).toHaveBeenCalledWith('delete-this-id');
    });
  });

  describe('Error Handling', () => {
    it('should propagate database errors', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(journalDb.createJournal).mockImplementation(() => {
        throw dbError;
      });

      const handler = mockHandlers.get(IPC_CHANNELS.JOURNAL_CREATE)!;

      await expect(handler(mockEvent, [{ name: 'Test Journal' }])).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should propagate errors from getAllJournals', async () => {
      const error = new Error('Failed to fetch journals');
      vi.mocked(journalDb.getAllJournals).mockImplementation(() => {
        throw error;
      });

      const handler = mockHandlers.get(IPC_CHANNELS.JOURNAL_GET_ALL)!;

      await expect(handler(mockEvent, [])).rejects.toThrow('Failed to fetch journals');
    });

    it('should propagate errors from updateJournal', async () => {
      const error = new Error('Update failed');
      vi.mocked(journalDb.updateJournal).mockImplementation(() => {
        throw error;
      });

      const handler = mockHandlers.get(IPC_CHANNELS.JOURNAL_UPDATE)!;

      await expect(handler(mockEvent, ['journal-1', { name: 'New Name' }])).rejects.toThrow(
        'Update failed'
      );
    });
  });
});
