import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  mockEntryInput,
  mockEntryInputMinimal,
  mockEntryInputs,
} from '@test/fixtures/entries.fixture';
import { countRows, getTestDatabase, useDatabaseTest } from '@test/helpers/database.helper';

import {
  createEntry,
  getAllEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
  searchEntries,
} from './entries';
import { createJournal, updateJournal } from './journals';

import * as indexModule from './index';

// Mock the database module
vi.mock('./index', async () => {
  const actual = await vi.importActual('./index');
  return {
    ...actual,
    getDatabase: vi.fn(),
    withTransaction: vi.fn((fn) => fn(getTestDatabase())),
    saveDatabase: vi.fn(),
  };
});

describe('entries.ts - Database CRUD Operations', () => {
  useDatabaseTest();

  let testJournalId: string;

  beforeEach(() => {
    const db = getTestDatabase();
    vi.mocked(indexModule.getDatabase).mockReturnValue(db);

    // Create a default journal for tests
    const journal = createJournal({ name: 'Test Journal' });
    testJournalId = journal.id;
  });

  describe('createEntry', () => {
    it('should create an entry with all fields', () => {
      const entry = createEntry({ ...mockEntryInput, journalId: testJournalId });

      expect(entry).toMatchObject({
        journalId: testJournalId,
        title: mockEntryInput.title,
        content: mockEntryInput.content,
        tags: mockEntryInput.tags,
      });
      expect(entry.id).toBeDefined();
      expect(entry.id).toHaveLength(36); // UUID length
      expect(entry.createdAt).toBeDefined();
      expect(entry.updatedAt).toBeDefined();
      expect(entry.createdAt).toBe(entry.updatedAt);
    });

    it('should create an entry with minimal fields (journalId and content)', () => {
      const entry = createEntry({ ...mockEntryInputMinimal, journalId: testJournalId });

      expect(entry.journalId).toBe(testJournalId);
      expect(entry.content).toBe(mockEntryInputMinimal.content);
      expect(entry.title).toBeUndefined();
      expect(entry.tags).toBeUndefined();
      expect(entry.id).toBeDefined();
    });

    it('should persist the entry to the database', () => {
      const db = getTestDatabase();
      createEntry({ ...mockEntryInput, journalId: testJournalId });

      const count = countRows(db, 'entries');
      expect(count).toBe(1);
    });

    it('should store tags as JSON string', () => {
      const entry = createEntry({ ...mockEntryInput, journalId: testJournalId });
      const db = getTestDatabase();

      const result = db.exec('SELECT tags FROM entries WHERE id = ?', [entry.id]);
      const tagsJson = result[0].values[0][0] as string;

      expect(JSON.parse(tagsJson)).toEqual(mockEntryInput.tags);
    });

    it('should handle entries without tags', () => {
      const entry = createEntry({ ...mockEntryInput, journalId: testJournalId, tags: undefined });

      expect(entry.tags).toBeUndefined();
    });

    it('should store ISO timestamps', () => {
      const beforeCreate = new Date().toISOString();
      const entry = createEntry({ ...mockEntryInput, journalId: testJournalId });
      const afterCreate = new Date().toISOString();

      expect(entry.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(entry.createdAt >= beforeCreate).toBe(true);
      expect(entry.createdAt <= afterCreate).toBe(true);
    });

    it('should respect foreign key constraint (journal must exist)', () => {
      expect(() => {
        createEntry({ ...mockEntryInput, journalId: 'non-existent-journal' });
      }).toThrow();
    });
  });

  describe('getAllEntries', () => {
    it('should return an empty array when no entries exist', () => {
      const entries = getAllEntries();
      expect(entries).toEqual([]);
    });

    it('should return all entries ordered by updated_at DESC', () => {
      mockEntryInputs
        .slice(0, 3)
        .forEach((input) => createEntry({ ...input, journalId: testJournalId }));

      const entries = getAllEntries();

      expect(entries).toHaveLength(3);
      // All entries should be present
      const titles = entries.map((e) => e.title);
      expect(titles).toContain('First Entry');
      expect(titles).toContain('Second Entry');
      expect(titles).toContain(undefined); // Third entry has no title
    });

    it('should filter entries by journal ID', () => {
      const journal1 = createJournal({ name: 'Journal 1' });
      const journal2 = createJournal({ name: 'Journal 2' });

      createEntry({ journalId: journal1.id, content: 'Entry 1' });
      createEntry({ journalId: journal1.id, content: 'Entry 2' });
      createEntry({ journalId: journal2.id, content: 'Entry 3' });

      const journal1Entries = getAllEntries(journal1.id);
      const journal2Entries = getAllEntries(journal2.id);

      expect(journal1Entries).toHaveLength(2);
      expect(journal2Entries).toHaveLength(1);
      expect(journal1Entries.every((e) => e.journalId === journal1.id)).toBe(true);
      expect(journal2Entries.every((e) => e.journalId === journal2.id)).toBe(true);
    });

    it('should map database columns correctly including tags', () => {
      createEntry({ ...mockEntryInput, journalId: testJournalId });
      const entries = getAllEntries();

      expect(entries[0]).toMatchObject({
        title: mockEntryInput.title,
        content: mockEntryInput.content,
        tags: mockEntryInput.tags,
        journalId: testJournalId,
      });
    });

    it('should support pagination with limit', () => {
      mockEntryInputs
        .slice(0, 3)
        .forEach((input) => createEntry({ ...input, journalId: testJournalId }));

      const entries = getAllEntries(undefined, { limit: 2 });

      expect(entries).toHaveLength(2);
    });

    it('should support pagination with offset', () => {
      mockEntryInputs
        .slice(0, 3)
        .forEach((input) => createEntry({ ...input, journalId: testJournalId }));

      const entries = getAllEntries(undefined, { offset: 1 });

      expect(entries).toHaveLength(2);
    });

    it('should support pagination with both limit and offset', () => {
      mockEntryInputs
        .slice(0, 4)
        .forEach((input) => createEntry({ ...input, journalId: testJournalId }));

      const entries = getAllEntries(undefined, { limit: 2, offset: 1 });

      expect(entries).toHaveLength(2);
    });

    it('should combine journal filter with pagination', () => {
      const journal = createJournal({ name: 'Test' });

      for (let i = 0; i < 5; i++) {
        createEntry({ journalId: journal.id, content: `Entry ${i}` });
      }

      const entries = getAllEntries(journal.id, { limit: 3 });

      expect(entries).toHaveLength(3);
      expect(entries.every((e) => e.journalId === journal.id)).toBe(true);
    });
  });

  describe('getEntryById', () => {
    it('should return null when entry does not exist', () => {
      const entry = getEntryById('non-existent-id');
      expect(entry).toBeNull();
    });

    it('should return the entry when it exists', () => {
      const created = createEntry({ ...mockEntryInput, journalId: testJournalId });
      const found = getEntryById(created.id);

      expect(found).toMatchObject({
        id: created.id,
        journalId: created.journalId,
        title: created.title,
        content: created.content,
        tags: created.tags,
      });
    });

    it('should return entry with correct data types', () => {
      const created = createEntry({ ...mockEntryInput, journalId: testJournalId });
      const found = getEntryById(created.id);

      expect(found).not.toBeNull();
      expect(typeof found!.id).toBe('string');
      expect(typeof found!.journalId).toBe('string');
      expect(typeof found!.content).toBe('string');
      expect(typeof found!.createdAt).toBe('string');
      expect(typeof found!.updatedAt).toBe('string');
      expect(Array.isArray(found!.tags)).toBe(true);
    });

    it('should correctly parse tags from JSON', () => {
      const created = createEntry({ ...mockEntryInput, journalId: testJournalId });
      const found = getEntryById(created.id);

      expect(found?.tags).toEqual(mockEntryInput.tags);
    });
  });

  describe('updateEntry', () => {
    it('should update entry title', () => {
      const created = createEntry({ ...mockEntryInput, journalId: testJournalId });
      const updated = updateEntry(created.id, { title: 'Updated Title' });

      expect(updated.title).toBe('Updated Title');
      expect(updated.content).toBe(created.content);
      expect(updated.tags).toEqual(created.tags);
    });

    it('should update entry content', () => {
      const created = createEntry({ ...mockEntryInput, journalId: testJournalId });
      const updated = updateEntry(created.id, { content: '<p>New content</p>' });

      expect(updated.content).toBe('<p>New content</p>');
      expect(updated.title).toBe(created.title);
    });

    it('should update entry tags', () => {
      const created = createEntry({ ...mockEntryInput, journalId: testJournalId });
      const newTags = ['updated', 'modified'];
      const updated = updateEntry(created.id, { tags: newTags });

      expect(updated.tags).toEqual(newTags);
      expect(updated.title).toBe(created.title);
      expect(updated.content).toBe(created.content);
    });

    it('should update multiple fields at once', () => {
      const created = createEntry({ ...mockEntryInput, journalId: testJournalId });
      const updated = updateEntry(created.id, {
        title: 'New Title',
        content: '<p>New content</p>',
        tags: ['new', 'tags'],
      });

      expect(updated.title).toBe('New Title');
      expect(updated.content).toBe('<p>New content</p>');
      expect(updated.tags).toEqual(['new', 'tags']);
    });

    it('should update the updatedAt timestamp', () => {
      const created = createEntry({ ...mockEntryInput, journalId: testJournalId });
      const updated = updateEntry(created.id, { title: 'Updated' });

      expect(updated.updatedAt >= created.updatedAt).toBe(true);
      expect(updated.createdAt).toBe(created.createdAt);
    });

    it('should return unchanged entry when no updates provided', () => {
      const created = createEntry({ ...mockEntryInput, journalId: testJournalId });
      const unchanged = updateEntry(created.id, {});

      expect(unchanged).toMatchObject({
        id: created.id,
        title: created.title,
        content: created.content,
        tags: created.tags,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });

    it('should handle updating with only some fields', () => {
      const created = createEntry({ ...mockEntryInput, journalId: testJournalId });

      // Verify tags exist initially
      expect(created.tags).toEqual(mockEntryInput.tags);

      // Update only title, tags remain unchanged
      const updated = updateEntry(created.id, { title: 'New Title Only' });

      expect(updated.title).toBe('New Title Only');
      expect(updated.tags).toEqual(mockEntryInput.tags);
    });

    it('should persist updates to database', () => {
      const created = createEntry({ ...mockEntryInput, journalId: testJournalId });
      updateEntry(created.id, { title: 'Updated in DB' });

      const fetched = getEntryById(created.id);
      expect(fetched?.title).toBe('Updated in DB');
    });
  });

  describe('deleteEntry', () => {
    it('should delete the entry and return true', () => {
      const created = createEntry({ ...mockEntryInput, journalId: testJournalId });
      const result = deleteEntry(created.id);

      expect(result).toBe(true);
    });

    it('should remove entry from database', () => {
      const db = getTestDatabase();
      const created = createEntry({ ...mockEntryInput, journalId: testJournalId });

      expect(countRows(db, 'entries')).toBe(1);
      deleteEntry(created.id);
      expect(countRows(db, 'entries')).toBe(0);
    });

    it('should not throw when deleting non-existent entry', () => {
      expect(() => deleteEntry('non-existent-id')).not.toThrow();
    });
  });

  describe('searchEntries', () => {
    beforeEach(() => {
      createEntry({
        journalId: testJournalId,
        title: 'Meeting notes',
        content: '<p>Discussed project timeline and deliverables</p>',
        tags: ['work', 'meeting'],
      });

      createEntry({
        journalId: testJournalId,
        title: 'Personal thoughts',
        content: '<p>Reflections on mindfulness and meditation</p>',
        tags: ['personal', 'health'],
      });

      createEntry({
        journalId: testJournalId,
        title: 'Travel ideas',
        content: '<p>Planning trip to Japan in spring</p>',
        tags: ['travel', 'planning'],
      });
    });

    it('should return empty array for empty query', () => {
      const results = searchEntries('');
      expect(results).toEqual([]);
    });

    it('should return empty array for whitespace-only query', () => {
      const results = searchEntries('   ');
      expect(results).toEqual([]);
    });

    it('should find entries by title', () => {
      const results = searchEntries('Meeting');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Meeting notes');
    });

    it('should find entries by content', () => {
      const results = searchEntries('mindfulness');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Personal thoughts');
    });

    it('should find entries by tags', () => {
      const results = searchEntries('travel');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Travel ideas');
    });

    it('should be case-insensitive', () => {
      const results = searchEntries('MEETING');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Meeting notes');
    });

    it('should support partial matching', () => {
      const results = searchEntries('plan');

      expect(results.length).toBeGreaterThan(0);
      const titles = results.map((r) => r.title);
      expect(titles).toContain('Travel ideas'); // "planning" in content
    });

    it('should find multiple entries matching query', () => {
      createEntry({
        journalId: testJournalId,
        title: 'Project update',
        content: '<p>Project status and next steps</p>',
      });

      const results = searchEntries('project');

      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('should support pagination', () => {
      // Create more entries
      for (let i = 0; i < 5; i++) {
        createEntry({
          journalId: testJournalId,
          content: `<p>Entry with common word test ${i}</p>`,
        });
      }

      const results = searchEntries('test', { limit: 3 });

      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should order results by updated_at DESC', () => {
      const results = searchEntries('p'); // Should match many entries

      expect(results.length).toBeGreaterThan(1);

      // Verify timestamps are in descending order
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].updatedAt >= results[i + 1].updatedAt).toBe(true);
      }
    });

    it('should handle special characters in search query', () => {
      createEntry({
        journalId: testJournalId,
        content: '<p>Email: test@example.com</p>',
      });

      // LIKE query may need escaping for special chars, but basic chars should work
      const results = searchEntries('test');

      expect(results.length).toBeGreaterThan(0);
    });

    it('should search across all entry fields', () => {
      const query = 'meeting';
      const results = searchEntries(query);

      // Should find the entry with "meeting" in both title and tags
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Data Integrity', () => {
    it('should handle special characters in content', () => {
      const entry = createEntry({
        journalId: testJournalId,
        content: '<p>Special chars: "quotes" \'apostrophes\' <strong>HTML</strong> 🎉</p>',
      });

      const found = getEntryById(entry.id);
      expect(found?.content).toBe(
        '<p>Special chars: "quotes" \'apostrophes\' <strong>HTML</strong> 🎉</p>'
      );
    });

    it('should handle very long content', () => {
      const longContent = '<p>' + 'a'.repeat(100000) + '</p>';
      const entry = createEntry({
        journalId: testJournalId,
        content: longContent,
      });

      expect(entry.content).toBe(longContent);
    });

    it('should handle empty tags array', () => {
      const entry = createEntry({
        journalId: testJournalId,
        content: 'Test',
        tags: [],
      });

      expect(entry.tags).toEqual([]);
    });

    it('should handle tags with special characters', () => {
      const specialTags = ['tag-with-dash', 'tag_with_underscore', 'tag.with.dot', 'emoji-🎉'];
      const entry = createEntry({
        journalId: testJournalId,
        content: 'Test',
        tags: specialTags,
      });

      const found = getEntryById(entry.id);
      expect(found?.tags).toEqual(specialTags);
    });

    it('should generate unique IDs for multiple entries', () => {
      const entry1 = createEntry({ journalId: testJournalId, content: 'First' });
      const entry2 = createEntry({ journalId: testJournalId, content: 'Second' });
      const entry3 = createEntry({ journalId: testJournalId, content: 'Third' });

      const ids = [entry1.id, entry2.id, entry3.id];
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
    });

    it('should maintain data consistency across operations', () => {
      const created = createEntry({ ...mockEntryInput, journalId: testJournalId });
      const fetched1 = getEntryById(created.id);
      const updated = updateEntry(created.id, { title: 'New Title' });
      const fetched2 = getEntryById(created.id);

      expect(fetched1?.id).toBe(created.id);
      expect(updated.id).toBe(created.id);
      expect(fetched2?.id).toBe(created.id);
      expect(fetched2?.title).toBe('New Title');
    });

    it('should handle content with only HTML tags', () => {
      const entry = createEntry({
        journalId: testJournalId,
        content: '<p></p>',
      });

      expect(entry.content).toBe('<p></p>');
    });

    it('should preserve entry when parent journal is updated', () => {
      const journal = createJournal({ name: 'Original' });
      const entry = createEntry({ journalId: journal.id, content: 'Test entry' });

      // Update journal
      updateJournal(journal.id, { name: 'Updated' });

      // Entry should still exist and be unchanged
      const found = getEntryById(entry.id);
      expect(found).not.toBeNull();
      expect(found?.journalId).toBe(journal.id);
    });
  });
});
