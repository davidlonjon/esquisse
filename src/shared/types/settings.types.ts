/**
 * Settings type definitions
 */

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  fontFamily: string;
  autoSave: boolean;
  autoSaveInterval: number;
}

export type UpdateSettingsInput = Partial<Settings>;
