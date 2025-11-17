/**
 * Entry IPC Handlers
 * Handles entry-related IPC communication between renderer and main process
 */

import { z } from 'zod';

import { IPC_CHANNELS } from '@shared/ipc';
import {
  CreateEntryInputSchema,
  IdSchema,
  SearchQuerySchema,
  UpdateEntryInputSchema,
} from '@shared/types';

import * as entryDb from '../../database/entries';
import { registerSafeHandler } from '../../ipc/safe-handler';

const createEntrySchema = z.tuple([CreateEntryInputSchema]);

const listEntriesSchema = z.tuple([IdSchema.optional()]);
const entryIdSchema = z.tuple([IdSchema]);
const updateEntrySchema = z.tuple([IdSchema, UpdateEntryInputSchema]);
const searchSchema = z.tuple([SearchQuerySchema]);

/**
 * Register all entry-related IPC handlers
 */
export function registerEntryHandlers(): void {
  registerSafeHandler(IPC_CHANNELS.ENTRY_CREATE, createEntrySchema, async (_event, [entry]) =>
    entryDb.createEntry(entry)
  );

  registerSafeHandler(IPC_CHANNELS.ENTRY_GET_ALL, listEntriesSchema, async (_event, [journalId]) =>
    entryDb.getAllEntries(journalId)
  );

  registerSafeHandler(IPC_CHANNELS.ENTRY_GET_BY_ID, entryIdSchema, async (_event, [id]) =>
    entryDb.getEntryById(id)
  );

  registerSafeHandler(IPC_CHANNELS.ENTRY_UPDATE, updateEntrySchema, async (_event, [id, updates]) =>
    entryDb.updateEntry(id, updates)
  );

  registerSafeHandler(IPC_CHANNELS.ENTRY_DELETE, entryIdSchema, async (_event, [id]) =>
    entryDb.deleteEntry(id)
  );

  registerSafeHandler(IPC_CHANNELS.ENTRY_SEARCH, searchSchema, async (_event, [query]) =>
    entryDb.searchEntries(query)
  );
}
