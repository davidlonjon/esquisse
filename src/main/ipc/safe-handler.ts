import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import { ZodError, type ZodTypeAny, type infer as Infer } from 'zod';

import type { Result, ResultError } from '@shared/types';
import { IPC_ERROR_CODES } from '@shared/types';

import { logger } from '../logger';

type Handler<TSchema extends ZodTypeAny, TResult> = (
  event: IpcMainInvokeEvent,
  parsedArgs: Infer<TSchema>
) => Promise<TResult> | TResult;

const formatError = (error: unknown): ResultError => {
  if (error instanceof ZodError) {
    return {
      message: 'Invalid IPC payload received.',
      code: IPC_ERROR_CODES.VALIDATION_ERROR,
      details: error.issues,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: IPC_ERROR_CODES.HANDLER_ERROR,
    };
  }

  return {
    message: 'Unknown IPC error occurred.',
    code: IPC_ERROR_CODES.UNKNOWN_ERROR,
  };
};

export function registerSafeHandler<TSchema extends ZodTypeAny, TResult>(
  channel: string,
  schema: TSchema,
  handler: Handler<TSchema, TResult>
): void {
  ipcMain.handle(channel, async (event, ...rawArgs) => {
    try {
      const parsedArgs = schema.parse(rawArgs);
      const data = await handler(event, parsedArgs);
      return { ok: true, data } satisfies Result<TResult>;
    } catch (error) {
      const errorPayload = formatError(error);
      logger.error(`IPC handler failed for channel ${channel}`, { error: errorPayload });
      return { ok: false, error: errorPayload } satisfies Result<TResult>;
    }
  });
}
