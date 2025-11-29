/**
 * Mood type definitions for journal entries
 */

export const MOOD_VALUES = [1, 2, 3, 4, 5] as const;
export type MoodValue = (typeof MOOD_VALUES)[number];

export interface MoodConfig {
  value: MoodValue;
  labelKey: string;
  icon: 'Frown' | 'Annoyed' | 'Meh' | 'Smile' | 'Laugh';
  color: string;
  bgColor: string;
}

export const MOOD_CONFIGS: MoodConfig[] = [
  {
    value: 1,
    labelKey: 'mood.awful',
    icon: 'Frown',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  {
    value: 2,
    labelKey: 'mood.bad',
    icon: 'Annoyed',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    value: 3,
    labelKey: 'mood.neutral',
    icon: 'Meh',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    value: 4,
    labelKey: 'mood.good',
    icon: 'Smile',
    color: 'text-lime-500',
    bgColor: 'bg-lime-500/10',
  },
  {
    value: 5,
    labelKey: 'mood.great',
    icon: 'Laugh',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
];

export const getMoodConfig = (value: MoodValue): MoodConfig | undefined =>
  MOOD_CONFIGS.find((config) => config.value === value);

export const isValidMood = (value: unknown): value is MoodValue =>
  typeof value === 'number' && MOOD_VALUES.includes(value as MoodValue);
