/**
 * Settings IPC Handlers
 * Handles settings-related IPC communication between renderer and main process
 */

import { z } from 'zod';

import { IPC_CHANNELS } from '@shared/ipc';
import { UpdateSettingsInputSchema } from '@shared/types';

import * as settingsDb from '../../database/settings';
import { registerSafeHandler } from '../../ipc/safe-handler';

const emptyArgsSchema = z.tuple([]);
const updateSettingsSchema = z.tuple([UpdateSettingsInputSchema]);

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
