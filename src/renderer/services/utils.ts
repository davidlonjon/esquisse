import { getErrorMessage } from '@lib/utils';
import type { ElectronAPI } from '@shared/ipc';
import type { Result, ResultError } from '@shared/types';

export { getErrorMessage };

export const getWindowAPI = (): ElectronAPI => {
  if (!window.api) {
    throw new Error('Electron renderer API is unavailable.');
  }
  return window.api;
};

const DEFAULT_IPC_ERROR_MESSAGE = 'Unknown IPC error';

const formatErrorDetails = (details: unknown): string | null => {
  if (details == null) {
    return null;
  }

  if (typeof details === 'string') {
    return details;
  }

  if (Array.isArray(details)) {
    const parts = details
      .map((detail) => {
        if (typeof detail === 'string') {
          return detail;
        }
        if (detail && typeof detail === 'object' && 'message' in detail) {
          return String((detail as { message?: unknown }).message ?? '');
        }
        try {
          return JSON.stringify(detail);
        } catch {
          return String(detail);
        }
      })
      .filter(Boolean);
    return parts.length > 0 ? parts.join('; ') : null;
  }

  if (typeof details === 'object') {
    if (
      'message' in (details as Record<string, unknown>) &&
      typeof (details as { message?: unknown }).message === 'string'
    ) {
      return (details as { message: string }).message;
    }
    try {
      return JSON.stringify(details);
    } catch {
      return String(details);
    }
  }

  return String(details);
};

const buildErrorMessage = (error: ResultError): string => {
  const baseMessage =
    error.message && error.message.length > 0 ? error.message : DEFAULT_IPC_ERROR_MESSAGE;
  const codeSuffix = error.code ? ` (${error.code})` : '';
  const details = formatErrorDetails(error.details);
  return details
    ? `${baseMessage}${codeSuffix}\nDetails: ${details}`
    : `${baseMessage}${codeSuffix}`;
};

const logResultError = (error: ResultError) => {
  console.error('[IPC] Renderer call failed', {
    message: error.message || DEFAULT_IPC_ERROR_MESSAGE,
    code: error.code,
    details: error.details,
  });
};

export class IpcError extends Error {
  code?: string;
  details?: unknown;
  channel?: string;
  isRetryable: boolean;

  constructor(
    message: string,
    code?: string,
    details?: unknown,
    channel?: string,
    isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'IpcError';
    this.code = code;
    this.details = details;
    this.channel = channel;
    this.isRetryable = isRetryable;
  }

  /**
   * Create a retryable IpcError (e.g., network timeout, temporary DB lock)
   */
  static retryable(message: string, code?: string, details?: unknown, channel?: string): IpcError {
    return new IpcError(message, code, details, channel, true);
  }

  /**
   * Create a non-retryable IpcError (e.g., validation error, not found)
   */
  static fatal(message: string, code?: string, details?: unknown, channel?: string): IpcError {
    return new IpcError(message, code, details, channel, false);
  }
}

export const resolveResult = <T>(result: Result<T>, channel?: string): T => {
  if (result.ok) {
    return result.data;
  }

  logResultError(result.error);

  const message = buildErrorMessage(result.error);
  throw new IpcError(message, result.error.code, result.error.details, channel);
};
