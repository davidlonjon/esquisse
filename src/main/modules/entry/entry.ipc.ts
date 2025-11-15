/**
 * Entry IPC Handlers
 * Handles entry-related IPC communication between renderer and main process
 */

import { z } from 'zod';

import { IPC_CHANNELS } from '@shared/ipc';

import * as entryDb from '../../database/entries';
import { registerSafeHandler } from '../../ipc/safe-handler';

const createEntrySchema = z.tuple([
  z.object({
    journalId: z.string().min(1),
    title: z.string().optional(),
    content: z.string(),
    tags: z.array(z.string()).optional(),
  }),
]);

const listEntriesSchema = z.tuple([z.string().optional()]);
const entryIdSchema = z.tuple([z.string().min(1)]);
const updateEntrySchema = z.tuple([
  z.string().min(1),
  z
    .object({
      title: z.string().optional().nullable(),
      content: z.string().optional(),
      tags: z.array(z.string()).optional().nullable(),
    })
    .partial(),
]);
const searchSchema = z.tuple([z.string().min(1)]);

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
