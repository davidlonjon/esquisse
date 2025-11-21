import { useState } from 'react';

import { useEntryStore } from '@features/entries';
import type { Entry } from '@shared/types';

import { useGlobalHotkeys } from './useGlobalHotkeys';

interface UseEntryDeletionProps {
  currentEntry: Entry | null;
  entries: Entry[];
}

interface UseEntryDeletionResult {
  isDialogOpen: boolean;
  handleArchive: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handleCloseDialog: () => void;
}

export function useEntryDeletion({
  currentEntry,
  entries,
}: UseEntryDeletionProps): UseEntryDeletionResult {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { deleteEntry, archiveEntry, setCurrentEntry } = useEntryStore();

  const navigateToNext = () => {
    if (!currentEntry) return;

    const currentIndex = entries.findIndex((entry) => entry.id === currentEntry.id);
    if (currentIndex === -1) return;

    if (currentIndex < entries.length - 1) {
      setCurrentEntry(entries[currentIndex + 1]);
    } else if (currentIndex > 0) {
      setCurrentEntry(entries[currentIndex - 1]);
    } else {
      setCurrentEntry(null);
    }
  };

  useGlobalHotkeys(
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
      preventDefault: true,
    }
  );

  const handleArchive = async () => {
    if (!currentEntry) return;

    try {
      await archiveEntry(currentEntry.id);
      navigateToNext();
    } catch (error) {
      console.error('Failed to archive entry:', error);
    }
  };

  const handleDelete = async () => {
    if (!currentEntry) return;

    try {
      await deleteEntry(currentEntry.id);
      navigateToNext();
    } catch (error) {
      console.error('Failed to delete entry:', error);
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
