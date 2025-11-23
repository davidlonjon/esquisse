import { useState } from 'react';

import { useEntryStore } from '@features/entries/entries.store';
import type { Entry } from '@shared/types';

export function useTimelineDeletion() {
  const [entryToDelete, setEntryToDelete] = useState<Entry | null>(null);
  const { deleteEntry, archiveEntry } = useEntryStore();

  const requestDelete = (entry: Entry) => {
    setEntryToDelete(entry);
  };

  const cancelDelete = () => {
    setEntryToDelete(null);
  };

  const confirmArchive = async () => {
    if (entryToDelete) {
      await archiveEntry(entryToDelete.id);
      setEntryToDelete(null);
    }
  };

  const confirmDelete = async () => {
    if (entryToDelete) {
      await deleteEntry(entryToDelete.id);
      setEntryToDelete(null);
    }
  };

  return {
    entryToDelete,
    requestDelete,
    cancelDelete,
    confirmArchive,
    confirmDelete,
    isDialogOpen: !!entryToDelete,
  };
}
