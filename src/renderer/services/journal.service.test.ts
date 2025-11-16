import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ElectronAPI } from '@shared/ipc';
import type { CreateJournalInput, Journal, Result, UpdateJournalInput } from '@shared/types';

import { journalService } from './journal.service';

describe('journal.service.ts - Journal Service', () => {
  let mockApi: Partial<ElectronAPI>;
  let originalWindowApi: ElectronAPI | undefined;

  beforeEach(() => {
    originalWindowApi = window.api;

    mockApi = {
      getAllJournals: vi.fn(),
      createJournal: vi.fn(),
      updateJournal: vi.fn(),
      deleteJournal: vi.fn(),
    };

    window.api = mockApi as ElectronAPI;
  });

  afterEach(() => {
    if (originalWindowApi) {
      window.api = originalWindowApi;
    } else {
      delete (window as any).api;
    }
  });

  describe('list', () => {
    it('should return all journals on success', async () => {
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

      const result: Result<Journal[]> = {
        ok: true,
        data: mockJournals,
      };

      vi.mocked(mockApi.getAllJournals!).mockResolvedValue(result);

      const journals = await journalService.list();

      expect(mockApi.getAllJournals).toHaveBeenCalledWith();
      expect(journals).toEqual(mockJournals);
    });

    it('should return empty array when no journals exist', async () => {
      const result: Result<Journal[]> = {
        ok: true,
        data: [],
      };

      vi.mocked(mockApi.getAllJournals!).mockResolvedValue(result);

      const journals = await journalService.list();

      expect(journals).toEqual([]);
    });

    it('should throw error on failure', async () => {
      const result: Result<Journal[]> = {
        ok: false,
        error: {
          message: 'Failed to fetch journals',
        },
      };

      vi.mocked(mockApi.getAllJournals!).mockResolvedValue(result);

      await expect(journalService.list()).rejects.toThrow('Failed to fetch journals');
    });

    it('should throw error when window.api is unavailable', async () => {
      delete (window as any).api;

      await expect(journalService.list()).rejects.toThrow(
        'Electron renderer API is unavailable.'
      );
    });
  });

  describe('create', () => {
    it('should create journal with all fields', async () => {
      const input: CreateJournalInput = {
        name: 'New Journal',
        description: 'Test description',
        color: '#3B82F6',
      };

      const mockJournal: Journal = {
        id: 'journal-1',
        name: 'New Journal',
        description: 'Test description',
        color: '#3B82F6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result: Result<Journal> = {
        ok: true,
        data: mockJournal,
      };

      vi.mocked(mockApi.createJournal!).mockResolvedValue(result);

      const journal = await journalService.create(input);

      expect(mockApi.createJournal).toHaveBeenCalledWith(input);
      expect(journal).toEqual(mockJournal);
    });

    it('should create journal with minimal fields', async () => {
      const input: CreateJournalInput = {
        name: 'Minimal Journal',
      };

      const mockJournal: Journal = {
        id: 'journal-2',
        name: 'Minimal Journal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result: Result<Journal> = {
        ok: true,
        data: mockJournal,
      };

      vi.mocked(mockApi.createJournal!).mockResolvedValue(result);

      const journal = await journalService.create(input);

      expect(journal).toEqual(mockJournal);
    });

    it('should throw error on creation failure', async () => {
      const input: CreateJournalInput = {
        name: 'Test Journal',
      };

      const result: Result<Journal> = {
        ok: false,
        error: {
          message: 'Creation failed',
          code: 'CREATE_ERROR',
        },
      };

      vi.mocked(mockApi.createJournal!).mockResolvedValue(result);

      await expect(journalService.create(input)).rejects.toThrow('Creation failed (CREATE_ERROR)');
    });
  });

  describe('update', () => {
    it('should update journal name', async () => {
      const updates: UpdateJournalInput = {
        name: 'Updated Name',
      };

      const mockJournal: Journal = {
        id: 'journal-1',
        name: 'Updated Name',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result: Result<Journal> = {
        ok: true,
        data: mockJournal,
      };

      vi.mocked(mockApi.updateJournal!).mockResolvedValue(result);

      const journal = await journalService.update('journal-1', updates);

      expect(mockApi.updateJournal).toHaveBeenCalledWith('journal-1', updates);
      expect(journal.name).toBe('Updated Name');
    });

    it('should update multiple fields', async () => {
      const updates: UpdateJournalInput = {
        name: 'New Name',
        description: 'New Description',
        color: '#FF0000',
      };

      const mockJournal: Journal = {
        id: 'journal-1',
        name: 'New Name',
        description: 'New Description',
        color: '#FF0000',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result: Result<Journal> = {
        ok: true,
        data: mockJournal,
      };

      vi.mocked(mockApi.updateJournal!).mockResolvedValue(result);

      const journal = await journalService.update('journal-1', updates);

      expect(journal).toEqual(mockJournal);
    });

    it('should handle nullable fields', async () => {
      const updates: UpdateJournalInput = {
        description: null,
        color: null,
      };

      const mockJournal: Journal = {
        id: 'journal-1',
        name: 'Test Journal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result: Result<Journal> = {
        ok: true,
        data: mockJournal,
      };

      vi.mocked(mockApi.updateJournal!).mockResolvedValue(result);

      const journal = await journalService.update('journal-1', updates);

      expect(journal.description).toBeUndefined();
      expect(journal.color).toBeUndefined();
    });

    it('should throw error on update failure', async () => {
      const updates: UpdateJournalInput = {
        name: 'Updated',
      };

      const result: Result<Journal> = {
        ok: false,
        error: {
          message: 'Update failed',
        },
      };

      vi.mocked(mockApi.updateJournal!).mockResolvedValue(result);

      await expect(journalService.update('journal-1', updates)).rejects.toThrow('Update failed');
    });
  });

  describe('remove', () => {
    it('should delete journal by id', async () => {
      const result: Result<boolean> = {
        ok: true,
        data: true,
      };

      vi.mocked(mockApi.deleteJournal!).mockResolvedValue(result);

      await journalService.remove('journal-1');

      expect(mockApi.deleteJournal).toHaveBeenCalledWith('journal-1');
    });

    it('should not throw on successful deletion', async () => {
      const result: Result<boolean> = {
        ok: true,
        data: true,
      };

      vi.mocked(mockApi.deleteJournal!).mockResolvedValue(result);

      await expect(journalService.remove('journal-1')).resolves.not.toThrow();
    });

    it('should throw error on deletion failure', async () => {
      const result: Result<boolean> = {
        ok: false,
        error: {
          message: 'Deletion failed',
        },
      };

      vi.mocked(mockApi.deleteJournal!).mockResolvedValue(result);

      await expect(journalService.remove('journal-1')).rejects.toThrow('Deletion failed');
    });

    it('should handle non-existent journal', async () => {
      const result: Result<boolean> = {
        ok: false,
        error: {
          message: 'Journal not found',
          code: 'NOT_FOUND',
        },
      };

      vi.mocked(mockApi.deleteJournal!).mockResolvedValue(result);

      await expect(journalService.remove('non-existent')).rejects.toThrow(
        'Journal not found (NOT_FOUND)'
      );
    });
  });

  describe('Integration Tests', () => {
    it('should support full CRUD workflow', async () => {
      // Create
      const createInput: CreateJournalInput = {
        name: 'Integration Test Journal',
      };

      const createdJournal: Journal = {
        id: 'journal-1',
        name: 'Integration Test Journal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(mockApi.createJournal!).mockResolvedValue({
        ok: true,
        data: createdJournal,
      });

      const created = await journalService.create(createInput);
      expect(created.id).toBe('journal-1');

      // List
      vi.mocked(mockApi.getAllJournals!).mockResolvedValue({
        ok: true,
        data: [createdJournal],
      });

      const journals = await journalService.list();
      expect(journals).toHaveLength(1);

      // Update
      const updateInput: UpdateJournalInput = {
        name: 'Updated Journal',
      };

      const updatedJournal: Journal = {
        ...createdJournal,
        name: 'Updated Journal',
      };

      vi.mocked(mockApi.updateJournal!).mockResolvedValue({
        ok: true,
        data: updatedJournal,
      });

      const updated = await journalService.update('journal-1', updateInput);
      expect(updated.name).toBe('Updated Journal');

      // Delete
      vi.mocked(mockApi.deleteJournal!).mockResolvedValue({
        ok: true,
        data: true,
      });

      await journalService.remove('journal-1');
      expect(mockApi.deleteJournal).toHaveBeenCalledWith('journal-1');
    });
  });
});
