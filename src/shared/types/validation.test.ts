/**
 * Tests for Zod validation schemas
 */

import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import {
  CreateEntryInputSchema,
  CreateJournalInputSchema,
  IdSchema,
  SearchQuerySchema,
  UpdateEntryInputSchema,
  UpdateJournalInputSchema,
  UpdateSettingsInputSchema,
} from './validation';

describe('validation.ts - Journal Schemas', () => {
  describe('CreateJournalInputSchema', () => {
    it('should validate valid journal input', () => {
      const input = {
        name: 'My Journal',
        description: 'A test journal',
        color: '#FF5733',
      };
      expect(() => CreateJournalInputSchema.parse(input)).not.toThrow();
    });

    it('should validate minimal journal input', () => {
      const input = { name: 'My Journal' };
      expect(() => CreateJournalInputSchema.parse(input)).not.toThrow();
    });

    it('should reject empty journal name', () => {
      const input = { name: '' };
      expect(() => CreateJournalInputSchema.parse(input)).toThrow(ZodError);
    });

    it('should reject journal name that is too long', () => {
      const input = { name: 'a'.repeat(256) };
      expect(() => CreateJournalInputSchema.parse(input)).toThrow(ZodError);
    });

    it('should reject description that is too long', () => {
      const input = {
        name: 'My Journal',
        description: 'a'.repeat(1001),
      };
      expect(() => CreateJournalInputSchema.parse(input)).toThrow(ZodError);
    });

    it('should reject invalid color format', () => {
      const input = {
        name: 'My Journal',
        color: 'red',
      };
      expect(() => CreateJournalInputSchema.parse(input)).toThrow(ZodError);
    });

    it('should accept valid hex color', () => {
      const input = {
        name: 'My Journal',
        color: '#ABCDEF',
      };
      expect(() => CreateJournalInputSchema.parse(input)).not.toThrow();
    });
  });

  describe('UpdateJournalInputSchema', () => {
    it('should validate empty update object', () => {
      const input = {};
      expect(() => UpdateJournalInputSchema.parse(input)).not.toThrow();
    });

    it('should validate partial update with name', () => {
      const input = { name: 'Updated Name' };
      expect(() => UpdateJournalInputSchema.parse(input)).not.toThrow();
    });

    it('should validate null description', () => {
      const input = { description: null };
      expect(() => UpdateJournalInputSchema.parse(input)).not.toThrow();
    });

    it('should validate null color', () => {
      const input = { color: null };
      expect(() => UpdateJournalInputSchema.parse(input)).not.toThrow();
    });

    it('should reject invalid color format', () => {
      const input = { color: 'invalid' };
      expect(() => UpdateJournalInputSchema.parse(input)).toThrow(ZodError);
    });
  });
});

describe('validation.ts - Entry Schemas', () => {
  describe('CreateEntryInputSchema', () => {
    it('should validate valid entry input', () => {
      const input = {
        journalId: 'journal-id-123',
        title: 'My Entry',
        content: 'Entry content',
        tags: ['tag1', 'tag2'],
      };
      expect(() => CreateEntryInputSchema.parse(input)).not.toThrow();
    });

    it('should validate minimal entry input', () => {
      const input = {
        journalId: 'journal-id-123',
        content: 'Entry content',
      };
      expect(() => CreateEntryInputSchema.parse(input)).not.toThrow();
    });

    it('should reject empty journalId', () => {
      const input = {
        journalId: '',
        content: 'Entry content',
      };
      expect(() => CreateEntryInputSchema.parse(input)).toThrow(ZodError);
    });

    it('should reject title that is too long', () => {
      const input = {
        journalId: 'journal-id-123',
        title: 'a'.repeat(256),
        content: 'Entry content',
      };
      expect(() => CreateEntryInputSchema.parse(input)).toThrow(ZodError);
    });

    it('should reject tag that is too long', () => {
      const input = {
        journalId: 'journal-id-123',
        content: 'Entry content',
        tags: ['a'.repeat(51)],
      };
      expect(() => CreateEntryInputSchema.parse(input)).toThrow(ZodError);
    });

    it('should reject too many tags', () => {
      const input = {
        journalId: 'journal-id-123',
        content: 'Entry content',
        tags: Array.from({ length: 21 }, (_, i) => `tag${i}`),
      };
      expect(() => CreateEntryInputSchema.parse(input)).toThrow(ZodError);
    });

    it('should accept exactly 20 tags', () => {
      const input = {
        journalId: 'journal-id-123',
        content: 'Entry content',
        tags: Array.from({ length: 20 }, (_, i) => `tag${i}`),
      };
      expect(() => CreateEntryInputSchema.parse(input)).not.toThrow();
    });
  });

  describe('UpdateEntryInputSchema', () => {
    it('should validate empty update object', () => {
      const input = {};
      expect(() => UpdateEntryInputSchema.parse(input)).not.toThrow();
    });

    it('should validate partial update with content', () => {
      const input = { content: 'Updated content' };
      expect(() => UpdateEntryInputSchema.parse(input)).not.toThrow();
    });

    it('should validate null title', () => {
      const input = { title: null };
      expect(() => UpdateEntryInputSchema.parse(input)).not.toThrow();
    });

    it('should validate null tags', () => {
      const input = { tags: null };
      expect(() => UpdateEntryInputSchema.parse(input)).not.toThrow();
    });

    it('should reject title that is too long', () => {
      const input = { title: 'a'.repeat(256) };
      expect(() => UpdateEntryInputSchema.parse(input)).toThrow(ZodError);
    });
  });
});

describe('validation.ts - Settings Schemas', () => {
  describe('UpdateSettingsInputSchema', () => {
    it('should validate empty update object', () => {
      const input = {};
      expect(() => UpdateSettingsInputSchema.parse(input)).not.toThrow();
    });

    it('should validate valid theme', () => {
      const input = { theme: 'dark' as const };
      expect(() => UpdateSettingsInputSchema.parse(input)).not.toThrow();
    });

    it('should reject invalid theme', () => {
      const input = { theme: 'invalid' };
      expect(() => UpdateSettingsInputSchema.parse(input)).toThrow(ZodError);
    });

    it('should validate valid fontSize', () => {
      const input = { fontSize: 16 };
      expect(() => UpdateSettingsInputSchema.parse(input)).not.toThrow();
    });

    it('should reject fontSize too small', () => {
      const input = { fontSize: 7 };
      expect(() => UpdateSettingsInputSchema.parse(input)).toThrow(ZodError);
    });

    it('should reject fontSize too large', () => {
      const input = { fontSize: 73 };
      expect(() => UpdateSettingsInputSchema.parse(input)).toThrow(ZodError);
    });

    it('should reject non-integer fontSize', () => {
      const input = { fontSize: 16.5 };
      expect(() => UpdateSettingsInputSchema.parse(input)).toThrow(ZodError);
    });

    it('should validate valid fontFamily', () => {
      const input = { fontFamily: 'Arial' };
      expect(() => UpdateSettingsInputSchema.parse(input)).not.toThrow();
    });

    it('should reject empty fontFamily', () => {
      const input = { fontFamily: '' };
      expect(() => UpdateSettingsInputSchema.parse(input)).toThrow(ZodError);
    });

    it('should reject fontFamily that is too long', () => {
      const input = { fontFamily: 'a'.repeat(256) };
      expect(() => UpdateSettingsInputSchema.parse(input)).toThrow(ZodError);
    });

    it('should validate valid autoSave', () => {
      const input = { autoSave: true };
      expect(() => UpdateSettingsInputSchema.parse(input)).not.toThrow();
    });

    it('should validate valid autoSaveInterval', () => {
      const input = { autoSaveInterval: 30000 };
      expect(() => UpdateSettingsInputSchema.parse(input)).not.toThrow();
    });

    it('should reject autoSaveInterval too short', () => {
      const input = { autoSaveInterval: 4999 };
      expect(() => UpdateSettingsInputSchema.parse(input)).toThrow(ZodError);
    });

    it('should reject autoSaveInterval too long', () => {
      const input = { autoSaveInterval: 300001 };
      expect(() => UpdateSettingsInputSchema.parse(input)).toThrow(ZodError);
    });

    it('should reject non-integer autoSaveInterval', () => {
      const input = { autoSaveInterval: 30000.5 };
      expect(() => UpdateSettingsInputSchema.parse(input)).toThrow(ZodError);
    });

    it('should validate valid language', () => {
      const input = { language: 'fr' as const };
      expect(() => UpdateSettingsInputSchema.parse(input)).not.toThrow();
    });

    it('should reject invalid language', () => {
      const input = { language: 'de' };
      expect(() => UpdateSettingsInputSchema.parse(input)).toThrow(ZodError);
    });
  });
});

describe('validation.ts - Generic Schemas', () => {
  describe('IdSchema', () => {
    it('should validate valid ID string', () => {
      const id = 'any-string-id-123';
      expect(() => IdSchema.parse(id)).not.toThrow();
    });

    it('should validate UUID format', () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      expect(() => IdSchema.parse(id)).not.toThrow();
    });

    it('should reject empty string', () => {
      const id = '';
      expect(() => IdSchema.parse(id)).toThrow(ZodError);
    });
  });

  describe('SearchQuerySchema', () => {
    it('should validate valid search query', () => {
      const query = 'search term';
      expect(() => SearchQuerySchema.parse(query)).not.toThrow();
    });

    it('should reject empty search query', () => {
      const query = '';
      expect(() => SearchQuerySchema.parse(query)).toThrow(ZodError);
    });

    it('should reject search query that is too long', () => {
      const query = 'a'.repeat(256);
      expect(() => SearchQuerySchema.parse(query)).toThrow(ZodError);
    });

    it('should accept search query with exactly 255 characters', () => {
      const query = 'a'.repeat(255);
      expect(() => SearchQuerySchema.parse(query)).not.toThrow();
    });
  });
});
