/**
 * Search type definitions
 */

import type { Entry } from './entry.types';
import type { MoodValue } from './mood.types';

export interface SearchFilter {
  tags?: string[];
  mood?: MoodValue | null;
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
  isFavorite?: boolean;
  isArchived?: boolean;
}

export interface ParsedSearchQuery {
  fullTextQuery: string; // Plain text search term
  filters: SearchFilter;
}

export interface AdvancedSearchInput {
  query: ParsedSearchQuery;
  journalId?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResultSnippet {
  text: string; // Context snippet (150 chars)
  highlightStart: number; // Start index of match
  highlightEnd: number; // End index of match
  matchedField?: 'content' | 'title' | 'tags';
}

export interface SearchResult extends Entry {
  snippet?: SearchResultSnippet;
  matchedField?: 'content' | 'title' | 'tags';
}
