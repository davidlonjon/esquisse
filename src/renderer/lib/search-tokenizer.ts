/**
 * Search query tokenizer for syntax highlighting
 * Breaks down search query into tokens for visual styling
 */

import {
  createFilterPattern,
  createIsValuesPattern,
  createMoodValuesPattern,
} from './search-keywords';

export type TokenType = 'filter-keyword' | 'filter-value' | 'text';

export interface SearchToken {
  type: TokenType;
  text: string;
  start: number;
  end: number;
}

/**
 * Tokenize search query string for syntax highlighting
 */
export function tokenizeSearchQuery(query: string): SearchToken[] {
  const tokens: SearchToken[] = [];
  let position = 0;

  // Build regex patterns for all filter types
  const tagPattern = new RegExp(`${createFilterPattern('tag')}:([^\\s]+)`, 'g');
  const moodPattern = new RegExp(
    `${createFilterPattern('mood')}:${createMoodValuesPattern()}`,
    'g'
  );
  const datePattern = new RegExp(`${createFilterPattern('date')}:(\\d{4}-\\d{2}(?:-\\d{2})?)`, 'g');
  const isPattern = new RegExp(`${createFilterPattern('is')}:${createIsValuesPattern()}`, 'g');

  // Collect all matches with their positions
  interface Match {
    type: 'tag' | 'mood' | 'date' | 'is';
    keywordStart: number;
    keywordEnd: number;
    valueStart: number;
    valueEnd: number;
    fullText: string;
  }

  const matches: Match[] = [];

  // Find all tag matches using regex pattern matching
  for (const match of query.matchAll(tagPattern)) {
    const keywordMatch = match[1]; // Captured keyword (tag or étiquette)
    const colonIndex = match.index! + keywordMatch.length;

    matches.push({
      type: 'tag',
      keywordStart: match.index!,
      keywordEnd: colonIndex,
      valueStart: colonIndex + 1, // +1 for the colon
      valueEnd: match.index! + match[0].length,
      fullText: match[0],
    });
  }

  // Find all mood matches
  for (const match of query.matchAll(moodPattern)) {
    const keywordMatch = match[1];
    const colonIndex = match.index! + keywordMatch.length;

    matches.push({
      type: 'mood',
      keywordStart: match.index!,
      keywordEnd: colonIndex,
      valueStart: colonIndex + 1,
      valueEnd: match.index! + match[0].length,
      fullText: match[0],
    });
  }

  // Find all date matches
  for (const match of query.matchAll(datePattern)) {
    const keywordMatch = match[1];
    const colonIndex = match.index! + keywordMatch.length;

    matches.push({
      type: 'date',
      keywordStart: match.index!,
      keywordEnd: colonIndex,
      valueStart: colonIndex + 1,
      valueEnd: match.index! + match[0].length,
      fullText: match[0],
    });
  }

  // Find all is: matches
  for (const match of query.matchAll(isPattern)) {
    const keywordMatch = match[1];
    const colonIndex = match.index! + keywordMatch.length;

    matches.push({
      type: 'is',
      keywordStart: match.index!,
      keywordEnd: colonIndex,
      valueStart: colonIndex + 1,
      valueEnd: match.index! + match[0].length,
      fullText: match[0],
    });
  }

  // Sort matches by position
  matches.sort((a, b) => a.keywordStart - b.keywordStart);

  // Build tokens from matches and fill in text tokens for gaps
  for (const m of matches) {
    // Add plain text token before this match if there's a gap
    if (position < m.keywordStart) {
      const textContent = query.substring(position, m.keywordStart);
      if (textContent) {
        tokens.push({
          type: 'text',
          text: textContent,
          start: position,
          end: m.keywordStart,
        });
      }
    }

    // Add filter keyword token (includes colon)
    tokens.push({
      type: 'filter-keyword',
      text: query.substring(m.keywordStart, m.keywordEnd + 1), // +1 to include colon
      start: m.keywordStart,
      end: m.keywordEnd + 1,
    });

    // Add filter value token
    tokens.push({
      type: 'filter-value',
      text: query.substring(m.valueStart, m.valueEnd),
      start: m.valueStart,
      end: m.valueEnd,
    });

    position = m.valueEnd;
  }

  // Add remaining text after last match
  if (position < query.length) {
    tokens.push({
      type: 'text',
      text: query.substring(position),
      start: position,
      end: query.length,
    });
  }

  // If no matches at all, return entire query as text token
  if (tokens.length === 0 && query.length > 0) {
    tokens.push({
      type: 'text',
      text: query,
      start: 0,
      end: query.length,
    });
  }

  return tokens;
}
