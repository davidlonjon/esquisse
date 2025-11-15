export interface ResultError {
  message: string;
  code?: string;
  details?: unknown;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: ResultError };
