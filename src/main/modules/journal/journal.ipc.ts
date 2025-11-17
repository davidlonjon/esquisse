/**
 * Journal IPC Handlers
 * Handles journal-related IPC communication between renderer and main process
 */

import { z } from 'zod';

import { IPC_CHANNELS } from '@shared/ipc';
import { CreateJournalInputSchema, IdSchema, UpdateJournalInputSchema } from '@shared/types';

import * as journalDb from '../../database/journals';
import { registerSafeHandler } from '../../ipc/safe-handler';

const createJournalSchema = z.tuple([CreateJournalInputSchema]);

const updateJournalSchema = z.tuple([IdSchema, UpdateJournalInputSchema]);

const idParamSchema = z.tuple([IdSchema]);
const emptyArgsSchema = z.tuple([]);

/**
 * Register all journal-related IPC handlers
 */
export function registerJournalHandlers(): void {
  registerSafeHandler(IPC_CHANNELS.JOURNAL_CREATE, createJournalSchema, async (_event, [journal]) =>
    journalDb.createJournal(journal)
  );

  registerSafeHandler(IPC_CHANNELS.JOURNAL_GET_ALL, emptyArgsSchema, async () =>
    journalDb.getAllJournals()
  );

  registerSafeHandler(IPC_CHANNELS.JOURNAL_GET_BY_ID, idParamSchema, async (_event, [id]) =>
    journalDb.getJournalById(id)
  );

  registerSafeHandler(
    IPC_CHANNELS.JOURNAL_UPDATE,
    updateJournalSchema,
    async (_event, [id, updates]) => journalDb.updateJournal(id, updates)
  );

  registerSafeHandler(IPC_CHANNELS.JOURNAL_DELETE, idParamSchema, async (_event, [id]) =>
    journalDb.deleteJournal(id)
  );
}
