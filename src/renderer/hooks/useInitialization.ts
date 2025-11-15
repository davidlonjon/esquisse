import { TFunction } from 'i18next';
import { useEffect } from 'react';

import { useEntryStore } from '@features/entries';
import { useJournalStore } from '@features/journals';

interface UseInitializationProps {
  setApiError: (error: string | null) => void;
  setContent: (content: string) => void;
  showHudTemporarily: () => void;
  resetSessionTimer: () => void;
  setIsInitialized: (isInitialized: boolean) => void;
  t: TFunction;
}

export function useInitialization({
  setApiError,
  setContent,
  showHudTemporarily,
  resetSessionTimer,
  setIsInitialized,
  t,
}: UseInitializationProps) {
  const loadJournals = useJournalStore((state) => state.loadJournals);
  const createJournal = useJournalStore((state) => state.createJournal);
  const setCurrentJournal = useJournalStore((state) => state.setCurrentJournal);
  const loadEntries = useEntryStore((state) => state.loadEntries);
  const setCurrentEntry = useEntryStore((state) => state.setCurrentEntry);

  useEffect(() => {
    const initialize = async () => {
      try {
        const journals = await loadJournals();
        let journal = journals[0];
        if (!journal) {
          journal = await createJournal({ name: 'Personal Journal' });
        }

        setCurrentJournal(journal);
        await loadEntries(journal.id);
        setCurrentEntry(null);
        setContent('');
        showHudTemporarily();

        resetSessionTimer();
        setIsInitialized(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setApiError(t('app.errors.initialize', { message }));
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // This should only run once
}
