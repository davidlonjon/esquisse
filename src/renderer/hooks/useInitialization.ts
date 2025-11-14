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
  const { loadJournals, createJournal, setCurrentJournal } = useJournalStore();
  const { loadEntries, setCurrentEntry } = useEntryStore();

  useEffect(() => {
    const initialize = async () => {
      try {
        await loadJournals();
        let journal = useJournalStore.getState().journals[0];
        if (!journal) {
          await createJournal({ name: 'Personal Journal' });
          journal = useJournalStore.getState().journals[0];
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
