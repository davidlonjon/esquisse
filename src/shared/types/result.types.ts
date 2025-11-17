/**
 * Standard error codes for IPC operations
 */
export const IPC_ERROR_CODES = {
  // Validation errors
  VALIDATION_ERROR: 'IPC_VALIDATION_ERROR',

  // Handler errors
  HANDLER_ERROR: 'IPC_HANDLER_ERROR',

  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_NOT_FOUND: 'DATABASE_NOT_FOUND',
  DATABASE_CONSTRAINT: 'DATABASE_CONSTRAINT_ERROR',

  // Backup errors
  BACKUP_CREATE_FAILED: 'BACKUP_CREATE_FAILED',
  BACKUP_RESTORE_FAILED: 'BACKUP_RESTORE_FAILED',
  BACKUP_NOT_FOUND: 'BACKUP_NOT_FOUND',

  // Generic errors
  UNKNOWN_ERROR: 'IPC_UNKNOWN_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const;

export type IpcErrorCode = (typeof IPC_ERROR_CODES)[keyof typeof IPC_ERROR_CODES];

export interface ResultError {
  message: string;
  code: IpcErrorCode | string;
  details?: unknown;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: ResultError };
