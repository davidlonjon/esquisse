import type { CreateJournalInput, Journal } from '@shared/types';

export const mockJournalInput: CreateJournalInput = {
  name: 'Test Journal',
  description: 'A test journal for unit tests',
  color: '#3B82F6',
};

export const mockJournalInputMinimal: CreateJournalInput = {
  name: 'Minimal Journal',
};

export const mockJournalInputs: CreateJournalInput[] = [
  {
    name: 'Personal',
    description: 'Personal thoughts and reflections',
    color: '#10B981',
  },
  {
    name: 'Work',
    description: 'Work-related notes',
    color: '#F59E0B',
  },
  {
    name: 'Travel',
    color: '#8B5CF6',
  },
];

export const createMockJournal = (overrides: Partial<Journal> = {}): Journal => {
  const now = new Date().toISOString();
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Journal',
    description: 'A test journal',
    color: '#3B82F6',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};
