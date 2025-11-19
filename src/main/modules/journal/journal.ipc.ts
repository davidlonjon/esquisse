/**
 * Journal IPC Handlers
 * Handles journal-related IPC communication between renderer and main process
 */

import { z } from 'zod';

import { IPC_CHANNELS } from '@shared/ipc';
import { CreateJournalInputSchema, IdSchema, UpdateJournalInputSchema } from '@shared/types';

import { getJournalService } from '../../domain/container';
import { registerSafeHandler } from '../../ipc/safe-handler';

const createJournalSchema = z.tuple([CreateJournalInputSchema]);

const updateJournalSchema = z.tuple([IdSchema, UpdateJournalInputSchema]);

const idParamSchema = z.tuple([IdSchema]);
const emptyArgsSchema = z.tuple([]);

/**
 * Register all journal-related IPC handlers
 */
export function registerJournalHandlers(): void {
  const journalService = getJournalService();

  registerSafeHandler(IPC_CHANNELS.JOURNAL_CREATE, createJournalSchema, async (_event, [journal]) =>
    journalService.createJournal(journal)
  );

  registerSafeHandler(IPC_CHANNELS.JOURNAL_GET_ALL, emptyArgsSchema, async () =>
    journalService.getAllJournals()
  );

  registerSafeHandler(IPC_CHANNELS.JOURNAL_GET_BY_ID, idParamSchema, async (_event, [id]) =>
    journalService.getJournalById(id)
  );

  registerSafeHandler(
    IPC_CHANNELS.JOURNAL_UPDATE,
    updateJournalSchema,
    async (_event, [id, updates]) => journalService.updateJournal(id, updates)
  );

  registerSafeHandler(IPC_CHANNELS.JOURNAL_DELETE, idParamSchema, async (_event, [id]) =>
    journalService.deleteJournal(id)
  );
}
