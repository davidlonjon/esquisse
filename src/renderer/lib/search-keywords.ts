/**
 * Bilingual keyword mappings for search filters
 * Supports both English and French filter syntax
 */

export const FILTER_KEYWORDS = {
  tag: { en: 'tag', fr: 'étiquette' },
  mood: { en: 'mood', fr: 'humeur' },
  date: { en: 'date', fr: 'date' },
  is: { en: 'is', fr: 'est' },
} as const;

export const MOOD_VALUES = {
  happy: { en: 'happy', fr: 'excellent' },
  good: { en: 'good', fr: 'bien' },
  neutral: { en: 'neutral', fr: 'neutre' },
  bad: { en: 'bad', fr: 'mauvais' },
  sad: { en: 'sad', fr: 'terrible' },
} as const;

export const IS_VALUES = {
  favorite: { en: 'favorite', fr: 'favori' },
  archived: { en: 'archived', fr: 'archivé' },
} as const;

/**
 * Map of mood values (both English and French) to numeric mood values
 */
export const MOOD_MAP: Record<string, number> = {
  // English
  happy: 5,
  good: 4,
  neutral: 3,
  bad: 2,
  sad: 1,
  // French
  excellent: 5,
  bien: 4,
  neutre: 3,
  mauvais: 2,
  terrible: 1,
};

/**
 * Helper to create bilingual regex pattern for filter keywords
 */
export function createFilterPattern(filterType: keyof typeof FILTER_KEYWORDS): string {
  const keywords = FILTER_KEYWORDS[filterType];
  return `(${keywords.en}|${keywords.fr})`;
}

/**
 * Helper to create bilingual regex pattern for mood values
 */
export function createMoodValuesPattern(): string {
  const values = Object.values(MOOD_VALUES)
    .flatMap((v) => [v.en, v.fr])
    .join('|');
  return `(${values})`;
}

/**
 * Helper to create bilingual regex pattern for is: values
 */
export function createIsValuesPattern(): string {
  const values = Object.values(IS_VALUES)
    .flatMap((v) => [v.en, v.fr])
    .join('|');
  return `(${values})`;
}
