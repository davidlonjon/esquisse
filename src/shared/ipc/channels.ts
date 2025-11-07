/**
 * IPC Channel definitions for type-safe communication between main and renderer processes
 */

export const IPC_CHANNELS = {
  // Journal operations
  JOURNAL_CREATE: 'journal:create',
  JOURNAL_GET_ALL: 'journal:getAll',
  JOURNAL_GET_BY_ID: 'journal:getById',
  JOURNAL_UPDATE: 'journal:update',
  JOURNAL_DELETE: 'journal:delete',

  // Entry operations
  ENTRY_CREATE: 'entry:create',
  ENTRY_GET_ALL: 'entry:getAll',
  ENTRY_GET_BY_ID: 'entry:getById',
  ENTRY_UPDATE: 'entry:update',
  ENTRY_DELETE: 'entry:delete',
  ENTRY_SEARCH: 'entry:search',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // Window operations
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
} as const;
