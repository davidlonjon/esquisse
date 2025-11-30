/**
 * Entry IPC Handlers
 * Handles entry-related IPC communication between renderer and main process
 */

import { z } from 'zod';

import { IPC_CHANNELS } from '@shared/ipc';
import {
  AdvancedSearchInputSchema,
  CreateEntryInputSchema,
  EntryStatusSchema,
  IdSchema,
  SearchQuerySchema,
  UpdateEntryInputSchema,
} from '@shared/types';

import { getEntryService } from '../../domain/container';
import { registerSafeHandler } from '../../ipc/safe-handler';

const createEntrySchema = z.tuple([CreateEntryInputSchema]);

const listEntriesSchema = z.tuple([IdSchema.optional()]);
const entryIdSchema = z.tuple([IdSchema]);
const updateEntrySchema = z.tuple([IdSchema, UpdateEntryInputSchema]);
const searchSchema = z.tuple([SearchQuerySchema]);
const advancedSearchSchema = z.tuple([AdvancedSearchInputSchema]);
const updateStatusSchema = z.tuple([IdSchema, EntryStatusSchema]);
const getByStatusSchema = z.tuple([IdSchema.optional(), EntryStatusSchema]);

/**
 * Register all entry-related IPC handlers
 */
export function registerEntryHandlers(): void {
  const entryService = getEntryService();

  registerSafeHandler(IPC_CHANNELS.ENTRY_CREATE, createEntrySchema, async (_event, [entry]) =>
    entryService.createEntry(entry)
  );

  registerSafeHandler(IPC_CHANNELS.ENTRY_GET_ALL, listEntriesSchema, async (_event, [journalId]) =>
    entryService.getAllEntries({ journalId })
  );

  registerSafeHandler(IPC_CHANNELS.ENTRY_GET_BY_ID, entryIdSchema, async (_event, [id]) =>
    entryService.getEntryById(id)
  );

  registerSafeHandler(IPC_CHANNELS.ENTRY_UPDATE, updateEntrySchema, async (_event, [id, updates]) =>
    entryService.updateEntry(id, updates)
  );

  registerSafeHandler(IPC_CHANNELS.ENTRY_DELETE, entryIdSchema, async (_event, [id]) =>
    entryService.deleteEntry(id)
  );

  registerSafeHandler(IPC_CHANNELS.ENTRY_SEARCH, searchSchema, async (_event, [query]) =>
    entryService.searchEntries(query)
  );

  registerSafeHandler(
    IPC_CHANNELS.ENTRY_ADVANCED_SEARCH,
    advancedSearchSchema,
    async (_event, [input]) => entryService.advancedSearchEntries(input)
  );

  registerSafeHandler(IPC_CHANNELS.ENTRY_ARCHIVE, entryIdSchema, async (_event, [id]) =>
    entryService.archiveEntry(id)
  );

  registerSafeHandler(IPC_CHANNELS.ENTRY_UNARCHIVE, entryIdSchema, async (_event, [id]) =>
    entryService.unarchiveEntry(id)
  );

  registerSafeHandler(
    IPC_CHANNELS.ENTRY_UPDATE_STATUS,
    updateStatusSchema,
    async (_event, [id, status]) => entryService.updateEntryStatus(id, status)
  );

  registerSafeHandler(
    IPC_CHANNELS.ENTRY_GET_BY_STATUS,
    getByStatusSchema,
    async (_event, [journalId, status]) => entryService.getEntriesByStatus(journalId, status)
  );
}
