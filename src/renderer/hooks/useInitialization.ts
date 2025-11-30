import { useEffect, useRef, useState } from 'react';

import { useEntryStore } from '@features/entries';
import { useJournalStore } from '@features/journals';

export type InitializationStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseInitializationProps {
  defaultJournalName: string;
  showHudTemporarily: () => void;
  resetSessionTimer: () => void;
}

export function useInitialization({
  defaultJournalName,
  showHudTemporarily,
  resetSessionTimer,
}: UseInitializationProps): { status: InitializationStatus; error: string | null } {
  const loadJournals = useJournalStore((state) => state.loadJournals);
  const createJournal = useJournalStore((state) => state.createJournal);
  const setCurrentJournal = useJournalStore((state) => state.setCurrentJournal);
  const loadEntries = useEntryStore((state) => state.loadEntries);
  const setCurrentEntry = useEntryStore((state) => state.setCurrentEntry);
  const [status, setStatus] = useState<InitializationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const defaultJournalNameRef = useRef(defaultJournalName);

  useEffect(() => {
    defaultJournalNameRef.current = defaultJournalName;
  }, [defaultJournalName]);

  useEffect(() => {
    let isCancelled = false;

    const initialize = async () => {
      setStatus('loading');
      setError(null);

      try {
        const journals = await loadJournals();
        let journal = journals[0];
        if (!journal) {
          journal = await createJournal({ name: defaultJournalNameRef.current });
        }

        setCurrentJournal(journal);
        await loadEntries(journal.id);
        // Only clear current entry if we haven't selected one already (e.g. from an overlay)
        // This prevents overwriting the selection when navigating from overlays -> Editor
        // setCurrentEntry(null);
        // setContent(''); // Removed
        showHudTemporarily();
        resetSessionTimer();

        if (!isCancelled) {
          setStatus('success');
        }
      } catch (initializationError) {
        const message =
          initializationError instanceof Error
            ? initializationError.message
            : String(initializationError);
        if (!isCancelled) {
          setError(message);
          setStatus('error');
        }
      }
    };

    void initialize();

    return () => {
      isCancelled = true;
    };
  }, [
    createJournal,
    loadEntries,
    loadJournals,
    resetSessionTimer,
    // setContent, // Removed from dependencies
    setCurrentEntry,
    setCurrentJournal,
    showHudTemporarily,
  ]);

  return { status, error };
}
