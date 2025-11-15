/**
 * Settings IPC Handlers
 * Handles settings-related IPC communication between renderer and main process
 */

import { z } from 'zod';

import { IPC_CHANNELS } from '@shared/ipc';

import * as settingsDb from '../../database/settings';
import { registerSafeHandler } from '../../ipc/safe-handler';

const emptyArgsSchema = z.tuple([]);
const updateSettingsSchema = z.tuple([
  z
    .object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      fontSize: z.number().min(10).max(48).optional(),
      fontFamily: z.string().optional(),
      autoSave: z.boolean().optional(),
      autoSaveInterval: z.number().min(1000).optional(),
      language: z.enum(['en', 'fr']).optional(),
    })
    .partial(),
]);

/**
 * Register all settings-related IPC handlers
 */
export function registerSettingsHandlers(): void {
  registerSafeHandler(IPC_CHANNELS.SETTINGS_GET, emptyArgsSchema, async () =>
    settingsDb.getSettings()
  );

  registerSafeHandler(IPC_CHANNELS.SETTINGS_SET, updateSettingsSchema, async (_event, [settings]) =>
    settingsDb.setSettings(settings)
  );
}
