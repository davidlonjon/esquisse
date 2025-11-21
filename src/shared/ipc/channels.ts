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
  ENTRY_ARCHIVE: 'entry:archive',
  ENTRY_UNARCHIVE: 'entry:unarchive',
  ENTRY_UPDATE_STATUS: 'entry:updateStatus',
  ENTRY_GET_BY_STATUS: 'entry:getByStatus',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // Window operations
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',

  // Backups
  BACKUP_CREATE: 'backup:create',
  BACKUP_LIST: 'backup:list',
  BACKUP_RESTORE: 'backup:restore',
} as const;
