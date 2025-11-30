/**
 * Search query parser
 * Parses user input into structured query with filters
 *
 * Supported syntax (bilingual - English/French):
 * - tag:work or étiquette:work → Filter by tag "work"
 * - tag:work,personal → Multiple tags (OR logic)
 * - mood:happy or humeur:excellent → Filter by mood (happy, good, neutral, bad, sad)
 * - date:2024-01 → Filter by year-month
 * - date:2024-01-15 → Filter by specific date
 * - is:favorite or est:favori → Only favorites
 * - is:archived or est:archivé → Include archived entries
 * - Plain text → Full-text search across content, title, tags
 */

import type { ParsedSearchQuery, SearchFilter } from '@shared/types';

import {
  createFilterPattern,
  createIsValuesPattern,
  createMoodValuesPattern,
  MOOD_MAP,
} from './search-keywords';

/**
 * Parse search query string into structured query
 */
export function parseSearchQuery(rawQuery: string): ParsedSearchQuery {
  const filters: SearchFilter = {};
  let fullTextQuery = rawQuery;

  // Extract tag: filters (bilingual: tag or étiquette)
  const tagPattern = new RegExp(`${createFilterPattern('tag')}:([^\\s]+)`, 'g');
  const tagMatches = rawQuery.matchAll(tagPattern);
  for (const match of tagMatches) {
    const tags = match[2]
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    filters.tags = [...(filters.tags || []), ...tags];
    fullTextQuery = fullTextQuery.replace(match[0], '');
  }

  // Extract mood: filter (bilingual: mood or humeur with English/French values)
  const moodPattern = new RegExp(`${createFilterPattern('mood')}:${createMoodValuesPattern()}`);
  const moodMatch = rawQuery.match(moodPattern);
  if (moodMatch) {
    const moodValue = moodMatch[2];
    filters.mood = MOOD_MAP[moodValue] as 1 | 2 | 3 | 4 | 5;
    fullTextQuery = fullTextQuery.replace(moodMatch[0], '');
  }

  // Extract date: filter (YYYY-MM or YYYY-MM-DD) - same keyword in both languages
  const datePattern = new RegExp(`${createFilterPattern('date')}:(\\d{4}-\\d{2}(?:-\\d{2})?)`);
  const dateMatch = rawQuery.match(datePattern);
  if (dateMatch) {
    const dateStr = dateMatch[2];
    if (dateStr.length === 7) {
      // YYYY-MM format
      filters.dateFrom = `${dateStr}-01T00:00:00.000Z`;
      // Calculate last day of month
      const [year, month] = dateStr.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      filters.dateTo = `${dateStr}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;
    } else {
      // YYYY-MM-DD format
      filters.dateFrom = `${dateStr}T00:00:00.000Z`;
      filters.dateTo = `${dateStr}T23:59:59.999Z`;
    }
    fullTextQuery = fullTextQuery.replace(dateMatch[0], '');
  }

  // Extract is: filters (bilingual: is or est)
  const isPattern = new RegExp(`${createFilterPattern('is')}:${createIsValuesPattern()}`, 'g');
  const isMatches = rawQuery.matchAll(isPattern);

  for (const match of isMatches) {
    const value = match[2];
    if (value === 'favorite' || value === 'favori') {
      filters.isFavorite = true;
      fullTextQuery = fullTextQuery.replace(match[0], '');
    } else if (value === 'archived' || value === 'archivé') {
      filters.isArchived = true;
      fullTextQuery = fullTextQuery.replace(match[0], '');
    }
  }

  // Clean up extra whitespace and trim
  return {
    fullTextQuery: fullTextQuery.replace(/\s+/g, ' ').trim(),
    filters,
  };
}
