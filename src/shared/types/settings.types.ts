/**
 * Settings type definitions
 */

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  fontFamily: string;
  autoSave: boolean;
  autoSaveInterval: number;
  language: 'en' | 'fr';
}

export type UpdateSettingsInput = Partial<Settings>;
