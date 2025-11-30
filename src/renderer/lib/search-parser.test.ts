/**
 * Search parser unit tests
 */

import { describe, expect, it } from 'vitest';

import { parseSearchQuery } from './search-parser';

describe('parseSearchQuery', () => {
  describe('plain text search', () => {
    it('should parse plain text query', () => {
      const result = parseSearchQuery('hello world');
      expect(result.fullTextQuery).toBe('hello world');
      expect(result.filters).toEqual({});
    });

    it('should handle empty query', () => {
      const result = parseSearchQuery('');
      expect(result.fullTextQuery).toBe('');
      expect(result.filters).toEqual({});
    });

    it('should trim whitespace', () => {
      const result = parseSearchQuery('  hello  world  ');
      expect(result.fullTextQuery).toBe('hello world');
      expect(result.filters).toEqual({});
    });
  });

  describe('tag filters', () => {
    it('should parse single tag filter', () => {
      const result = parseSearchQuery('tag:work');
      expect(result.fullTextQuery).toBe('');
      expect(result.filters.tags).toEqual(['work']);
    });

    it('should parse multiple tags with comma', () => {
      const result = parseSearchQuery('tag:work,personal');
      expect(result.fullTextQuery).toBe('');
      expect(result.filters.tags).toEqual(['work', 'personal']);
    });

    it('should parse multiple tag filters', () => {
      const result = parseSearchQuery('tag:work tag:personal');
      expect(result.fullTextQuery).toBe('');
      expect(result.filters.tags).toEqual(['work', 'personal']);
    });

    it('should combine tag filter with text query', () => {
      const result = parseSearchQuery('tag:work meeting notes');
      expect(result.fullTextQuery).toBe('meeting notes');
      expect(result.filters.tags).toEqual(['work']);
    });

    it('should trim tag names', () => {
      const result = parseSearchQuery('tag:work,personal,urgent');
      expect(result.fullTextQuery).toBe('');
      expect(result.filters.tags).toEqual(['work', 'personal', 'urgent']);
    });
  });

  describe('mood filters', () => {
    it('should parse mood:happy', () => {
      const result = parseSearchQuery('mood:happy');
      expect(result.fullTextQuery).toBe('');
      expect(result.filters.mood).toBe(5);
    });

    it('should parse mood:good', () => {
      const result = parseSearchQuery('mood:good');
      expect(result.fullTextQuery).toBe('');
      expect(result.filters.mood).toBe(4);
    });

    it('should parse mood:neutral', () => {
      const result = parseSearchQuery('mood:neutral');
      expect(result.fullTextQuery).toBe('');
      expect(result.filters.mood).toBe(3);
    });

    it('should parse mood:bad', () => {
      const result = parseSearchQuery('mood:bad');
      expect(result.fullTextQuery).toBe('');
      expect(result.filters.mood).toBe(2);
    });

    it('should parse mood:sad', () => {
      const result = parseSearchQuery('mood:sad');
      expect(result.fullTextQuery).toBe('');
      expect(result.filters.mood).toBe(1);
    });

    it('should combine mood filter with text query', () => {
      const result = parseSearchQuery('mood:happy great day');
      expect(result.fullTextQuery).toBe('great day');
      expect(result.filters.mood).toBe(5);
    });

    it('should ignore invalid mood values', () => {
      const result = parseSearchQuery('mood:invalid');
      expect(result.fullTextQuery).toBe('mood:invalid');
      expect(result.filters.mood).toBeUndefined();
    });
  });

  describe('date filters', () => {
    it('should parse year-month format (YYYY-MM)', () => {
      const result = parseSearchQuery('date:2024-01');
      expect(result.fullTextQuery).toBe('');
      expect(result.filters.dateFrom).toBe('2024-01-01T00:00:00.000Z');
      expect(result.filters.dateTo).toBe('2024-01-31T23:59:59.999Z');
    });

    it('should parse specific date (YYYY-MM-DD)', () => {
      const result = parseSearchQuery('date:2024-01-15');
      expect(result.fullTextQuery).toBe('');
      expect(result.filters.dateFrom).toBe('2024-01-15T00:00:00.000Z');
      expect(result.filters.dateTo).toBe('2024-01-15T23:59:59.999Z');
    });

    it('should handle February correctly', () => {
      const result = parseSearchQuery('date:2024-02');
      expect(result.fullTextQuery).toBe('');
      expect(result.filters.dateFrom).toBe('2024-02-01T00:00:00.000Z');
      expect(result.filters.dateTo).toBe('2024-02-29T23:59:59.999Z'); // 2024 is leap year
    });

    it('should handle non-leap year February', () => {
      const result = parseSearchQuery('date:2023-02');
      expect(result.fullTextQuery).toBe('');
      expect(result.filters.dateFrom).toBe('2023-02-01T00:00:00.000Z');
      expect(result.filters.dateTo).toBe('2023-02-28T23:59:59.999Z');
    });

    it('should combine date filter with text query', () => {
      const result = parseSearchQuery('date:2024-01 vacation');
      expect(result.fullTextQuery).toBe('vacation');
      expect(result.filters.dateFrom).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('is:favorite filter', () => {
    it('should parse is:favorite', () => {
      const result = parseSearchQuery('is:favorite');
      expect(result.fullTextQuery).toBe('');
      expect(result.filters.isFavorite).toBe(true);
    });

    it('should combine is:favorite with text query', () => {
      const result = parseSearchQuery('is:favorite important notes');
      expect(result.fullTextQuery).toBe('important notes');
      expect(result.filters.isFavorite).toBe(true);
    });
  });

  describe('is:archived filter', () => {
    it('should parse is:archived', () => {
      const result = parseSearchQuery('is:archived');
      expect(result.fullTextQuery).toBe('');
      expect(result.filters.isArchived).toBe(true);
    });

    it('should combine is:archived with text query', () => {
      const result = parseSearchQuery('is:archived old notes');
      expect(result.fullTextQuery).toBe('old notes');
      expect(result.filters.isArchived).toBe(true);
    });
  });

  describe('combined filters', () => {
    it('should parse multiple filters together', () => {
      const result = parseSearchQuery('tag:work mood:happy date:2024-01 is:favorite meeting');
      expect(result.fullTextQuery).toBe('meeting');
      expect(result.filters.tags).toEqual(['work']);
      expect(result.filters.mood).toBe(5);
      expect(result.filters.dateFrom).toBe('2024-01-01T00:00:00.000Z');
      expect(result.filters.dateTo).toBe('2024-01-31T23:59:59.999Z');
      expect(result.filters.isFavorite).toBe(true);
    });

    it('should handle all filters at once', () => {
      const result = parseSearchQuery(
        'tag:work,personal mood:good date:2024-01-15 is:favorite is:archived project'
      );
      expect(result.fullTextQuery).toBe('project');
      expect(result.filters.tags).toEqual(['work', 'personal']);
      expect(result.filters.mood).toBe(4);
      expect(result.filters.dateFrom).toBe('2024-01-15T00:00:00.000Z');
      expect(result.filters.dateTo).toBe('2024-01-15T23:59:59.999Z');
      expect(result.filters.isFavorite).toBe(true);
      expect(result.filters.isArchived).toBe(true);
    });

    it('should handle filters in any order', () => {
      const result = parseSearchQuery('is:favorite meeting date:2024-01 tag:work mood:happy');
      expect(result.fullTextQuery).toBe('meeting');
      expect(result.filters.tags).toEqual(['work']);
      expect(result.filters.mood).toBe(5);
      expect(result.filters.isFavorite).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle query with only filters', () => {
      const result = parseSearchQuery('tag:work mood:happy is:favorite');
      expect(result.fullTextQuery).toBe('');
      expect(result.filters.tags).toEqual(['work']);
      expect(result.filters.mood).toBe(5);
      expect(result.filters.isFavorite).toBe(true);
    });

    it('should handle multiple spaces', () => {
      const result = parseSearchQuery('tag:work    mood:happy    meeting');
      expect(result.fullTextQuery).toBe('meeting');
      expect(result.filters.tags).toEqual(['work']);
      expect(result.filters.mood).toBe(5);
    });

    it('should handle special characters in text query', () => {
      const result = parseSearchQuery('tag:work meeting@home #important');
      expect(result.fullTextQuery).toBe('meeting@home #important');
      expect(result.filters.tags).toEqual(['work']);
    });
  });
});
