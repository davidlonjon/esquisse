import { useCallback, useEffect, useRef } from 'react';

import { selectCurrentEntry, useEntryStore } from '@features/entries';
import { selectCurrentJournal, useJournalStore } from '@features/journals';
import { getWordCountFromHTML } from '@lib/text';
import type { Entry } from '@shared/types';

interface UseEntryDraftOptions {
  onEntryCreated?: () => void;
}

type EnsureEntryExists = (html: string) => Promise<Entry | null>;

export function useEntryDraft({ onEntryCreated }: UseEntryDraftOptions = {}) {
  const currentJournal = useJournalStore(selectCurrentJournal);
  const createEntry = useEntryStore((state) => state.createEntry);
  const setCurrentEntry = useEntryStore((state) => state.setCurrentEntry);
  const currentEntry = useEntryStore(selectCurrentEntry);

  const currentEntryRef = useRef<Entry | null>(currentEntry);
  const creationPromiseRef = useRef<Promise<Entry> | null>(null);

  useEffect(() => {
    currentEntryRef.current = currentEntry;
  }, [currentEntry]);

  const ensureEntryExists: EnsureEntryExists = useCallback(
    async (html) => {
      const activeEntry = currentEntryRef.current;
      if (getWordCountFromHTML(html) === 0 || !currentJournal) {
        return activeEntry;
      }

      if (activeEntry) {
        return activeEntry;
      }

      if (!creationPromiseRef.current) {
        creationPromiseRef.current = createEntry({
          journalId: currentJournal.id,
          content: html,
        }).then((entry) => {
          setCurrentEntry(entry);
          onEntryCreated?.();
          return entry;
        });

        creationPromiseRef.current.finally(() => {
          creationPromiseRef.current = null;
        });
      }

      return creationPromiseRef.current;
    },
    [createEntry, currentJournal, onEntryCreated, setCurrentEntry]
  );

  return { ensureEntryExists };
}
