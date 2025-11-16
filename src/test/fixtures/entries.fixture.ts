import type { CreateEntryInput, Entry } from '@shared/types';

// Factory function that accepts a journalId
export const createMockEntryInput = (journalId: string): CreateEntryInput => ({
  journalId,
  title: 'Test Entry',
  content: '<p>This is a test entry content</p>',
  tags: ['test', 'unit-test'],
});

// Default for backwards compatibility (you need to override journalId)
export const mockEntryInput: CreateEntryInput = {
  journalId: 'test-journal-id',
  title: 'Test Entry',
  content: '<p>This is a test entry content</p>',
  tags: ['test', 'unit-test'],
};

export const mockEntryInputMinimal: CreateEntryInput = {
  journalId: 'test-journal-id',
  content: '<p>Minimal content</p>',
};

export const mockEntryInputs: CreateEntryInput[] = [
  {
    journalId: 'test-journal-id',
    title: 'First Entry',
    content: '<p>First entry content with some <strong>bold</strong> text</p>',
    tags: ['first', 'important'],
  },
  {
    journalId: 'test-journal-id',
    title: 'Second Entry',
    content: '<p>Second entry with different content</p>',
    tags: ['second'],
  },
  {
    journalId: 'test-journal-id',
    content: '<p>Third entry without title</p>',
  },
  {
    journalId: 'another-journal-id',
    title: 'Entry in different journal',
    content: '<p>This belongs to another journal</p>',
    tags: ['other'],
  },
];

export const createMockEntry = (overrides: Partial<Entry> = {}): Entry => {
  const now = new Date().toISOString();
  return {
    id: 'test-entry-id',
    journalId: 'test-journal-id',
    title: 'Test Entry',
    content: '<p>Test content</p>',
    tags: ['test'],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};
