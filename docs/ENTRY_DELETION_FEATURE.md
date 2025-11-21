# Entry Deletion with Archive Feature

> Implementation plan for adding entry deletion with archive support via Cmd+D keyboard shortcut.
>
> **Status:** In Progress
> **Created:** November 2025

## Overview

Add a Cmd+D keyboard shortcut to delete or archive entries. When triggered, show a confirmation dialog with three options:

- **Archive** (primary/recommended) - Move to archived status
- **Delete Permanently** - Remove from database
- **Cancel** - Close dialog without action

## Design Decisions

### Status Column Architecture

**Decision:** Use `status` column instead of boolean `archived` field

**Rationale:**

- More extensible for future features (draft, deleted, pinned, etc.)
- Cleaner architecture for entry lifecycle management
- Industry standard pattern

**Status Values:**

```typescript
type EntryStatus = 'active' | 'archived' | 'draft';
// Future possibilities: 'deleted', 'pinned', 'template'
```

### UX Decisions (Based on User Preferences)

1. **Archive Display:** Separate "Archived" section/view
   - Archived entries NOT mixed with active entries in main list
   - Dedicated view for browsing archived entries
   - Clean separation of concerns

2. **Default Action:** Archive (safer option)
   - Primary blue button for Archive
   - Destructive red button for Delete Permanently
   - Less risk of accidental data loss

3. **Search Behavior:** Include archived with visual indicator
   - Search returns both active and archived entries
   - Archived entries shown with badge/styling
   - Allows finding archived content easily

4. **Unarchive UI:** Available from multiple locations
   - Archived entries section (dedicated view)
   - Search results (inline action)
   - Future: Entry context menu

## Technical Implementation

### Phase 1: Database & Backend

#### 1.1 Database Migration

**Migration ID:** `003_add_entry_status_field`

```sql
-- Add status column (default to 'active' for existing entries)
ALTER TABLE entries ADD COLUMN status TEXT DEFAULT 'active';

-- Add index for filtering by status
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);

-- Add composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_entries_journal_status
ON entries(journal_id, status);
```

**Files to modify:**

- `src/main/database/migrations.ts`
- `src/main/database/schema.sql` (update current schema documentation)

#### 1.2 TypeScript Types

**Update Entry Interface:**

```typescript
// src/shared/types/entry.types.ts

export type EntryStatus = 'active' | 'archived' | 'draft';

export interface Entry {
  id: string;
  journalId: string;
  title?: string;
  content: string;
  tags?: string[];
  status: EntryStatus; // NEW
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntryInput {
  journalId: string;
  title?: string;
  content?: string;
  tags?: string[];
  status?: EntryStatus; // NEW - optional, defaults to 'active'
}

export interface UpdateEntryInput {
  title?: string | null;
  content?: string;
  tags?: string[] | null;
  status?: EntryStatus; // NEW - allow status updates
}

// Helper type guards
export const isActiveEntry = (entry: Entry): boolean => entry.status === 'active';
export const isArchivedEntry = (entry: Entry): boolean => entry.status === 'archived';
export const isDraftEntry = (entry: Entry): boolean => entry.status === 'draft';
```

**Files to modify:**

- `src/shared/types/entry.types.ts`

#### 1.3 Repository Layer

**Update Entry Repository:**

```typescript
// src/main/domain/entries/entry.repository.interface.ts

export interface FindAllOptions extends PaginationOptions {
  journalId?: string;
  status?: EntryStatus | EntryStatus[]; // Filter by status
  includeAllStatuses?: boolean; // Include all statuses
}

export interface IEntryRepository {
  // Existing methods...

  // New status management methods
  updateStatus(id: string, status: EntryStatus): Entry;
  archive(id: string): Entry;
  unarchive(id: string): Entry;

  // Updated findAll with status filtering
  findAll(options?: FindAllOptions): Entry[];
}
```

```typescript
// src/main/domain/entries/entry.repository.ts

// Add status to column mapping
private readonly COLUMNS = [
  'id',
  'journal_id',
  'title',
  'content',
  'tags',
  'status',  // NEW
  'created_at',
  'updated_at',
];

// Helper to map database row to Entry object
private mapRowToEntry(row: any): Entry {
  return {
    id: row.id,
    journalId: row.journal_id,
    title: row.title || undefined,
    content: row.content,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
    status: row.status as EntryStatus,  // NEW
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Update create method to include status
create(input: CreateEntryInput): Entry {
  return withTransaction((db) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    const status = input.status || 'active';  // Default to active

    db.prepare(
      `INSERT INTO entries (id, journal_id, title, content, tags, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.journalId,
      input.title || null,
      input.content,
      input.tags ? JSON.stringify(input.tags) : null,
      status,  // NEW
      now,
      now
    );

    return this.findById(id)!;
  });
}

// Update findAll to filter by status (default: active only)
findAll(options: FindAllOptions = {}): Entry[] {
  const { journalId, status, includeAllStatuses = false, limit, offset } = options;

  let query = `SELECT ${this.COLUMNS.join(', ')} FROM entries WHERE 1=1`;
  const params: any[] = [];

  if (journalId) {
    query += ' AND journal_id = ?';
    params.push(journalId);
  }

  // Filter by status
  if (!includeAllStatuses) {
    if (status) {
      if (Array.isArray(status)) {
        query += ` AND status IN (${status.map(() => '?').join(',')})`;
        params.push(...status);
      } else {
        query += ' AND status = ?';
        params.push(status);
      }
    } else {
      // Default: only show active entries
      query += ' AND status = ?';
      params.push('active');
    }
  }

  query += ' ORDER BY updated_at DESC';

  if (limit) {
    query += ' LIMIT ?';
    params.push(limit);
  }

  if (offset) {
    query += ' OFFSET ?';
    params.push(offset);
  }

  const rows = db.prepare(query).all(...params);
  return rows.map(this.mapRowToEntry);
}

// New method: Update entry status
updateStatus(id: string, status: EntryStatus): Entry {
  return withTransaction((db) => {
    const now = new Date().toISOString();

    db.prepare(
      'UPDATE entries SET status = ?, updated_at = ? WHERE id = ?'
    ).run(status, now, id);

    const updated = this.findById(id);
    if (!updated) {
      throw new Error(`Entry ${id} not found after status update`);
    }
    return updated;
  });
}

// Convenience method: Archive entry
archive(id: string): Entry {
  return this.updateStatus(id, 'archived');
}

// Convenience method: Unarchive entry
unarchive(id: string): Entry {
  return this.updateStatus(id, 'active');
}

// Update update method to handle status changes
update(id: string, input: UpdateEntryInput): Entry {
  return withTransaction((db) => {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const params: any[] = [];

    if (input.title !== undefined) {
      updates.push('title = ?');
      params.push(input.title);
    }

    if (input.content !== undefined) {
      updates.push('content = ?');
      params.push(input.content);
    }

    if (input.tags !== undefined) {
      updates.push('tags = ?');
      params.push(input.tags ? JSON.stringify(input.tags) : null);
    }

    if (input.status !== undefined) {  // NEW
      updates.push('status = ?');
      params.push(input.status);
    }

    if (updates.length === 0) {
      return this.findById(id)!;
    }

    updates.push('updated_at = ?');
    params.push(now);
    params.push(id);

    db.prepare(
      `UPDATE entries SET ${updates.join(', ')} WHERE id = ?`
    ).run(...params);

    return this.findById(id)!;
  });
}
```

**Files to modify:**

- `src/main/domain/entries/entry.repository.interface.ts`
- `src/main/domain/entries/entry.repository.ts`

#### 1.4 Service Layer

```typescript
// src/main/domain/entries/entry.service.ts

export class EntryService {
  // Existing methods...

  // Archive entry
  archiveEntry(id: string): Entry {
    if (!this.entryRepository.exists(id)) {
      throw new Error(`Entry with id ${id} not found`);
    }
    return this.entryRepository.archive(id);
  }

  // Unarchive entry
  unarchiveEntry(id: string): Entry {
    if (!this.entryRepository.exists(id)) {
      throw new Error(`Entry with id ${id} not found`);
    }
    return this.entryRepository.unarchive(id);
  }

  // Update status
  updateEntryStatus(id: string, status: EntryStatus): Entry {
    if (!this.entryRepository.exists(id)) {
      throw new Error(`Entry with id ${id} not found`);
    }

    // Validate status value
    const validStatuses: EntryStatus[] = ['active', 'archived', 'draft'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    return this.entryRepository.updateStatus(id, status);
  }

  // Get entries by status
  getEntriesByStatus(journalId: string | undefined, status: EntryStatus): Entry[] {
    return this.entryRepository.findAll({ journalId, status });
  }

  // Get archived entries
  getArchivedEntries(journalId?: string): Entry[] {
    return this.getEntriesByStatus(journalId, 'archived');
  }
}
```

**Files to modify:**

- `src/main/domain/entries/entry.service.ts`

#### 1.5 IPC Layer

**Add IPC Channels:**

```typescript
// src/shared/ipc/channels.ts

export const IPC_CHANNELS = {
  // ... existing channels

  // Entry status management
  ENTRY_ARCHIVE: 'entry:archive',
  ENTRY_UNARCHIVE: 'entry:unarchive',
  ENTRY_UPDATE_STATUS: 'entry:updateStatus',
  ENTRY_GET_BY_STATUS: 'entry:getByStatus',
} as const;
```

**Update API Types:**

```typescript
// src/shared/ipc/api.types.ts

export interface ApiMethods {
  // ... existing methods

  // Entry status management
  archiveEntry: (id: string) => Promise<Result<Entry>>;
  unarchiveEntry: (id: string) => Promise<Result<Entry>>;
  updateEntryStatus: (id: string, status: EntryStatus) => Promise<Result<Entry>>;
  getEntriesByStatus: (
    journalId: string | undefined,
    status: EntryStatus
  ) => Promise<Result<Entry[]>>;
}
```

**Add IPC Handlers:**

```typescript
// src/main/modules/entry/entry.ipc.ts

import { z } from 'zod';

// Add status schema
const EntryStatusSchema = z.enum(['active', 'archived', 'draft']);

// Register handlers
ipcMain.handle(IPC_CHANNELS.ENTRY_ARCHIVE, async (_, id: string) => {
  try {
    const validatedId = IdSchema.parse(id);
    const entry = entryService.archiveEntry(validatedId);
    return { success: true, data: entry };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle(IPC_CHANNELS.ENTRY_UNARCHIVE, async (_, id: string) => {
  try {
    const validatedId = IdSchema.parse(id);
    const entry = entryService.unarchiveEntry(validatedId);
    return { success: true, data: entry };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle(IPC_CHANNELS.ENTRY_UPDATE_STATUS, async (_, id: string, status: EntryStatus) => {
  try {
    const validatedId = IdSchema.parse(id);
    const validatedStatus = EntryStatusSchema.parse(status);
    const entry = entryService.updateEntryStatus(validatedId, validatedStatus);
    return { success: true, data: entry };
  } catch (error) {
    return handleError(error);
  }
});

ipcMain.handle(
  IPC_CHANNELS.ENTRY_GET_BY_STATUS,
  async (_, journalId: string | undefined, status: EntryStatus) => {
    try {
      const validatedJournalId = journalId ? IdSchema.parse(journalId) : undefined;
      const validatedStatus = EntryStatusSchema.parse(status);
      const entries = entryService.getEntriesByStatus(validatedJournalId, validatedStatus);
      return { success: true, data: entries };
    } catch (error) {
      return handleError(error);
    }
  }
);
```

**Files to modify:**

- `src/shared/ipc/channels.ts`
- `src/shared/ipc/api.types.ts`
- `src/main/modules/entry/entry.ipc.ts`

#### 1.6 Preload Bridge

```typescript
// src/preload/api/entry.api.ts

export const entryAPI: EntryAPI = {
  // ... existing methods

  archiveEntry: (id: string): Promise<Result<Entry>> =>
    ipcRenderer.invoke(IPC_CHANNELS.ENTRY_ARCHIVE, id),

  unarchiveEntry: (id: string): Promise<Result<Entry>> =>
    ipcRenderer.invoke(IPC_CHANNELS.ENTRY_UNARCHIVE, id),

  updateEntryStatus: (id: string, status: EntryStatus): Promise<Result<Entry>> =>
    ipcRenderer.invoke(IPC_CHANNELS.ENTRY_UPDATE_STATUS, id, status),

  getEntriesByStatus: (
    journalId: string | undefined,
    status: EntryStatus
  ): Promise<Result<Entry[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.ENTRY_GET_BY_STATUS, journalId, status),
};
```

**Files to modify:**

- `src/preload/api/entry.api.ts`

---

### Phase 2: Frontend Infrastructure

#### 2.1 Renderer Service

```typescript
// src/renderer/services/entry.service.ts

export class EntryService {
  // ... existing methods

  async archive(id: string): Promise<Entry> {
    const validatedId = IdSchema.parse(id);
    const api = getWindowAPI();
    return resolveResult(await api.archiveEntry(validatedId));
  }

  async unarchive(id: string): Promise<Entry> {
    const validatedId = IdSchema.parse(id);
    const api = getWindowAPI();
    return resolveResult(await api.unarchiveEntry(validatedId));
  }

  async updateStatus(id: string, status: EntryStatus): Promise<Entry> {
    const validatedId = IdSchema.parse(id);
    const api = getWindowAPI();
    return resolveResult(await api.updateEntryStatus(validatedId, status));
  }

  async getByStatus(journalId: string | undefined, status: EntryStatus): Promise<Entry[]> {
    const api = getWindowAPI();
    return resolveResult(await api.getEntriesByStatus(journalId, status));
  }
}
```

**Files to modify:**

- `src/renderer/services/entry.service.ts`

#### 2.2 Entries Store

```typescript
// src/renderer/features/entries/entries.store.ts

interface EntriesState {
  // ... existing state
  showArchived: boolean;
  archivedEntries: Entry[];

  // ... existing actions
  archiveEntry: (id: string) => Promise<Entry>;
  unarchiveEntry: (id: string) => Promise<Entry>;
  fetchArchivedEntries: (journalId?: string) => Promise<void>;
  toggleShowArchived: () => void;
}

export const useEntriesStore = create<EntriesState>((set, get) => ({
  // ... existing state
  showArchived: false,
  archivedEntries: [],

  // Archive entry
  archiveEntry: async (id) => {
    return withAsyncHandler(set, 'archive', async () => {
      const entry = await entryService.archive(id);

      set((state) => {
        // Remove from active entries
        const updatedEntries = state.entries.filter((e) => e.id !== id);

        // Clear if it was the current entry
        const updatedCurrentEntryId = state.currentEntryId === id ? null : state.currentEntryId;

        // Update lookup
        const updatedLookup = { ...state.entryLookup };
        updatedLookup[id] = entry;

        // Add to archived entries
        const updatedArchived = [...state.archivedEntries, entry];

        return {
          entries: updatedEntries,
          entryLookup: updatedLookup,
          archivedEntries: updatedArchived,
          currentEntryId: updatedCurrentEntryId,
        };
      });

      return entry;
    });
  },

  // Unarchive entry
  unarchiveEntry: async (id) => {
    return withAsyncHandler(set, 'unarchive', async () => {
      const entry = await entryService.unarchive(id);

      set((state) => {
        // Remove from archived
        const updatedArchived = state.archivedEntries.filter((e) => e.id !== id);

        // Add back to active entries
        const updatedEntries = [entry, ...state.entries].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        // Update lookup
        const updatedLookup = { ...state.entryLookup };
        updatedLookup[id] = entry;

        return {
          entries: updatedEntries,
          entryLookup: updatedLookup,
          archivedEntries: updatedArchived,
        };
      });

      return entry;
    });
  },

  // Fetch archived entries
  fetchArchivedEntries: async (journalId) => {
    return withAsyncHandler(set, 'fetch', async () => {
      const entries = await entryService.getByStatus(journalId, 'archived');

      set({
        archivedEntries: entries,
      });
    });
  },

  // Toggle show archived
  toggleShowArchived: () => {
    set((state) => ({
      showArchived: !state.showArchived,
    }));
  },
}));
```

**Files to modify:**

- `src/renderer/features/entries/entries.store.ts`

---

### Phase 3: UI Components

#### 3.1 Delete Entry Dialog

**New File:** `src/renderer/components/dialogs/DeleteEntryDialog.tsx`

```typescript
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface DeleteEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onArchive: () => void;
  onDelete: () => void;
  entryTitle?: string;
}

export function DeleteEntryDialog({
  isOpen,
  onClose,
  onArchive,
  onDelete,
  entryTitle,
}: DeleteEntryDialogProps) {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleArchive = async () => {
    setIsProcessing(true);
    try {
      await onArchive();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      disableOutsideClose={isProcessing}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">
            {t('entry.delete.title')}
          </h2>
          {entryTitle && (
            <p className="text-sm opacity-70 mt-1">
              "{entryTitle}"
            </p>
          )}
        </div>

        {/* Description */}
        <p className="text-base">
          {t('entry.delete.message')}
        </p>

        {/* Options */}
        <div className="space-y-3">
          {/* Archive Option (Primary) */}
          <div className="card bg-primary/10 border border-primary/20">
            <div className="card-body p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-primary">
                    {t('entry.delete.archive')}
                  </h3>
                  <p className="text-sm opacity-70 mt-1">
                    {t('entry.delete.archiveDescription')}
                  </p>
                </div>
                <Button
                  variant="default"
                  onClick={handleArchive}
                  disabled={isProcessing}
                >
                  {t('entry.delete.archive')}
                </Button>
              </div>
            </div>
          </div>

          {/* Delete Permanently Option (Destructive) */}
          <div className="card bg-error/10 border border-error/20">
            <div className="card-body p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-error">
                    {t('entry.delete.deletePermanent')}
                  </h3>
                  <p className="text-sm opacity-70 mt-1">
                    {t('entry.delete.deletePermanentDescription')}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isProcessing}
                >
                  {t('entry.delete.deletePermanent')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isProcessing}
          >
            {t('entry.delete.cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
```

**Files to create:**

- `src/renderer/components/dialogs/DeleteEntryDialog.tsx`
- `src/renderer/components/dialogs/index.ts` (barrel export)

#### 3.2 Translations

**English:**

```json
// src/renderer/locales/en/common.json

{
  "entry": {
    "delete": {
      "title": "Delete this entry?",
      "message": "Choose how to handle this entry:",
      "archive": "Archive",
      "archiveDescription": "Hide but keep accessible. You can unarchive it later.",
      "deletePermanent": "Delete Permanently",
      "deletePermanentDescription": "Cannot be undone. Entry will be lost forever.",
      "cancel": "Cancel"
    },
    "archived": {
      "title": "Archived Entries",
      "empty": "No archived entries",
      "badge": "Archived",
      "unarchive": "Unarchive",
      "showArchived": "Show Archived",
      "hideArchived": "Hide Archived"
    }
  },
  "hud": {
    "keyboard": {
      "shortcut": {
        "deleteEntry": {
          "label": "Delete/Archive Entry",
          "description": "Delete or archive the current entry"
        }
      }
    }
  }
}
```

**French:**

```json
// src/renderer/locales/fr/common.json

{
  "entry": {
    "delete": {
      "title": "Supprimer cette entrée ?",
      "message": "Choisissez comment gérer cette entrée :",
      "archive": "Archiver",
      "archiveDescription": "Masquer mais garder accessible. Vous pourrez la désarchiver plus tard.",
      "deletePermanent": "Supprimer définitivement",
      "deletePermanentDescription": "Action irréversible. L'entrée sera perdue pour toujours.",
      "cancel": "Annuler"
    },
    "archived": {
      "title": "Entrées archivées",
      "empty": "Aucune entrée archivée",
      "badge": "Archivée",
      "unarchive": "Désarchiver",
      "showArchived": "Afficher les archives",
      "hideArchived": "Masquer les archives"
    }
  },
  "hud": {
    "keyboard": {
      "shortcut": {
        "deleteEntry": {
          "label": "Supprimer/Archiver l'entrée",
          "description": "Supprimer ou archiver l'entrée actuelle"
        }
      }
    }
  }
}
```

**Files to modify:**

- `src/renderer/locales/en/common.json`
- `src/renderer/locales/fr/common.json`

---

### Phase 4: Keyboard Shortcut Integration

#### 4.1 Shortcut Configuration

```typescript
// src/renderer/config/shortcuts.ts

export type ShortcutId =
  | 'previousEntry'
  | 'nextEntry'
  | 'openSettings'
  | 'toggleHudPin'
  | 'toggleShortcutsPanel'
  | 'searchEntries'
  | 'commandPalette'
  | 'closeModal'
  | 'deleteEntry'; // NEW

export const SHORTCUTS: Shortcut[] = [
  // ... existing shortcuts
  {
    id: 'deleteEntry',
    keys: 'mod+d',
    description: 'Delete or archive current entry',
    category: 'editor',
    location: 'hooks/useEntryDeletion.ts',
    globallyControlled: true,
    display: {
      labelKey: 'hud.keyboard.shortcut.deleteEntry.label',
      descriptionKey: 'hud.keyboard.shortcut.deleteEntry.description',
      combos: {
        mac: '⌘D',
        windows: 'Ctrl D',
      },
    },
  },
];
```

**Files to modify:**

- `src/renderer/config/shortcuts.ts`

#### 4.2 Entry Deletion Hook

**New File:** `src/renderer/hooks/useEntryDeletion.ts`

```typescript
import { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useEntriesStore } from '@features/entries/entries.store';
import { useEntryNavigation } from './useEntryNavigation';
import type { Entry } from '@shared/types/entry.types';

interface UseEntryDeletionProps {
  currentEntry: Entry | null;
}

export function useEntryDeletion({ currentEntry }: UseEntryDeletionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { deleteEntry, archiveEntry } = useEntriesStore();
  const { navigateToNext } = useEntryNavigation();

  // Register Cmd+D shortcut
  useHotkeys(
    'mod+d',
    (e) => {
      e.preventDefault();

      if (!currentEntry) {
        return;
      }

      setIsDialogOpen(true);
    },
    {
      enabled: !!currentEntry,
      enableOnFormTags: ['INPUT', 'TEXTAREA'],
    },
    [currentEntry]
  );

  const handleArchive = async () => {
    if (!currentEntry) return;

    try {
      await archiveEntry(currentEntry.id);

      // Navigate to next entry
      navigateToNext();
    } catch (error) {
      console.error('Failed to archive entry:', error);
      // TODO: Show error notification
    }
  };

  const handleDelete = async () => {
    if (!currentEntry) return;

    try {
      await deleteEntry(currentEntry.id);

      // Navigate to next entry
      navigateToNext();
    } catch (error) {
      console.error('Failed to delete entry:', error);
      // TODO: Show error notification
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return {
    isDialogOpen,
    handleArchive,
    handleDelete,
    handleCloseDialog,
  };
}
```

**Files to create:**

- `src/renderer/hooks/useEntryDeletion.ts`

#### 4.3 Editor Integration

```typescript
// src/renderer/hooks/useEditorController.ts

import { useEntryDeletion } from './useEntryDeletion';
import { DeleteEntryDialog } from '@components/dialogs/DeleteEntryDialog';

export function useEditorController() {
  // ... existing code

  const currentEntry = useEntryStore(selectCurrentEntry);

  // Entry deletion
  const {
    isDialogOpen: isDeleteDialogOpen,
    handleArchive,
    handleDelete,
    handleCloseDialog: handleCloseDeleteDialog,
  } = useEntryDeletion({ currentEntry });

  // ... existing code

  // Return dialog component to render
  return {
    // ... existing returns
    DeleteDialog: (
      <DeleteEntryDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onArchive={handleArchive}
        onDelete={handleDelete}
        entryTitle={currentEntry?.title}
      />
    ),
  };
}
```

**Files to modify:**

- `src/renderer/hooks/useEditorController.ts`

---

### Phase 5: Navigation & Search Updates

#### 5.1 Entry Navigation

Update navigation to skip archived entries:

```typescript
// src/renderer/hooks/useEntryNavigation.ts

// Ensure entries selector filters out archived by default
const entries = useEntriesStore((state) => state.entries.filter((e) => e.status === 'active'));
```

**Files to modify:**

- `src/renderer/hooks/useEntryNavigation.ts`

#### 5.2 Search Enhancement

Update search to include archived entries with visual indicators:

- Show "(Archived)" badge for archived entries in search results
- Add inline unarchive action
- Maintain separate styling for archived entries

**Files to modify:**

- Search-related components (identify during implementation)

---

### Phase 6: Testing & Documentation

#### 6.1 Unit Tests

**Test Files to Update:**

- `src/main/database/migrations.test.ts` - Test status migration
- `src/main/domain/entries/entry.repository.test.ts` - Test status filtering, archive/unarchive
- `src/main/domain/entries/entry.service.test.ts` - Test archive business logic
- `src/main/modules/entry/entry.ipc.test.ts` - Test IPC handlers
- `src/renderer/features/entries/entries.store.test.ts` - Test store actions

#### 6.2 E2E Tests

**Test Scenarios:**

- Cmd+D opens delete dialog
- Archive flow navigates to next entry
- Permanent delete flow works correctly
- Cancel closes dialog without action
- Archived entries excluded from navigation
- Search includes archived entries with badge

#### 6.3 Documentation

**Files to Update:**

- `README.md` - Add Cmd+D shortcut documentation
- `docs/MIGRATIONS.md` - Add migration example

---

## Implementation Checklist

### Phase 1: Database & Backend

- [ ] Create migration `003_add_entry_status_field`
- [ ] Update `schema.sql` with status column
- [ ] Update Entry TypeScript types
- [ ] Update entry repository interface
- [ ] Update entry repository implementation
- [ ] Update entry service
- [ ] Add IPC channels and types
- [ ] Add IPC handlers with validation
- [ ] Update preload API bridge

### Phase 2: Frontend Infrastructure

- [ ] Update renderer entry service
- [ ] Update entries store with archive actions
- [ ] Add archived entries state management

### Phase 3: UI Components

- [ ] Create DeleteEntryDialog component
- [ ] Add English translations
- [ ] Add French translations
- [ ] Create dialog barrel export

### Phase 4: Keyboard Shortcuts

- [ ] Add deleteEntry to shortcuts config
- [ ] Create useEntryDeletion hook
- [ ] Integrate into editor controller

### Phase 5: Navigation & Search

- [ ] Update entry navigation to skip archived
- [ ] Update search to include archived with badge
- [ ] Add unarchive action to search results

### Phase 6: Testing & Documentation

- [ ] Write/update unit tests
- [ ] Write E2E tests
- [ ] Update README.md
- [ ] Update MIGRATIONS.md

---

## Future Enhancements

### Draft Status (Future)

- Add "Save as Draft" option
- Draft entries don't show in main list
- Draft indicator in search
- Auto-save to draft periodically

### Soft Delete (Future)

- Add "deleted" status (soft delete)
- Retention period (e.g., 30 days)
- "Recently Deleted" section
- Permanent deletion after retention

### Bulk Operations (Future)

- Multi-select entries
- Bulk archive/unarchive
- Bulk delete

### Archive View UI (Future)

- Dedicated archived entries page/sidebar
- Filter by date archived
- Search within archived
- Bulk unarchive

---

## Files Summary

### Files to Create (4)

1. `src/renderer/components/dialogs/DeleteEntryDialog.tsx`
2. `src/renderer/components/dialogs/index.ts`
3. `src/renderer/hooks/useEntryDeletion.ts`
4. `docs/ENTRY_DELETION_FEATURE.md` (this file)

### Files to Modify (~20)

**Backend (9):**

1. `src/main/database/migrations.ts`
2. `src/main/database/schema.sql`
3. `src/shared/types/entry.types.ts`
4. `src/shared/ipc/channels.ts`
5. `src/shared/ipc/api.types.ts`
6. `src/main/domain/entries/entry.repository.interface.ts`
7. `src/main/domain/entries/entry.repository.ts`
8. `src/main/domain/entries/entry.service.ts`
9. `src/main/modules/entry/entry.ipc.ts`

**Preload (1):** 10. `src/preload/api/entry.api.ts`

**Frontend (7):** 11. `src/renderer/services/entry.service.ts` 12. `src/renderer/features/entries/entries.store.ts` 13. `src/renderer/config/shortcuts.ts` 14. `src/renderer/hooks/useEditorController.ts` 15. `src/renderer/hooks/useEntryNavigation.ts` 16. `src/renderer/locales/en/common.json` 17. `src/renderer/locales/fr/common.json`

**Tests (5-7):**

- Migration tests
- Repository tests
- Service tests
- IPC tests
- Store tests
- E2E tests

---

## Estimated Timeline

- **Phase 1** (Backend): 2-3 hours
- **Phase 2** (Frontend infra): 1-2 hours
- **Phase 3** (UI): 2-3 hours
- **Phase 4** (Shortcuts): 1-2 hours
- **Phase 5** (Navigation/Search): 2-3 hours
- **Phase 6** (Testing): 2-3 hours

**Total:** 10-16 hours

---

_Last updated: November 2025_
