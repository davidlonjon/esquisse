import { useRouterState } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { selectCurrentEntry, selectEntries, useEntryStore } from '@features/entries';
import { selectCurrentJournal, useJournalStore } from '@features/journals';
import { useAutoSave } from '@hooks/useAutoSave';
import { useEntryNavigation } from '@hooks/useEntryNavigation';
import { useHud } from '@hooks/useHud';
import { useInitialization } from '@hooks/useInitialization';
import { useSessionTimer } from '@hooks/useSessionTimer';
import { getWordCountFromHTML } from '@lib/text';
import { formatDuration } from '@lib/time';

interface HudViewModel {
  isVisible: boolean;
  dateLabel: string;
  wordCountLabel: string;
  sessionLabel: string;
  snapshotLabel: string;
}

export interface EditorController {
  status: ReturnType<typeof useInitialization>['status'];
  initializationError: string | null;
  initializationMessage: string | null;
  initializingLabel: string;
  apiError: string | null;
  setApiError: (message: string | null) => void;
  clearApiError: () => void;
  content: string;
  placeholder: string;
  handleContentChange: (content: string) => void;
  handleManualSave: (content: string) => Promise<void>;
  hud: HudViewModel;
  isSettingsRoute: boolean;
}

export function useEditorController(): EditorController {
  const { location } = useRouterState();
  const { t, i18n } = useTranslation();
  const [content, setContent] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);

  const entries = useEntryStore(selectEntries);
  const currentEntry = useEntryStore(selectCurrentEntry);
  const updateEntry = useEntryStore((state) => state.updateEntry);
  const createEntry = useEntryStore((state) => state.createEntry);
  const setCurrentEntry = useEntryStore((state) => state.setCurrentEntry);
  const currentJournal = useJournalStore(selectCurrentJournal);

  const currentEntryRef = useRef(currentEntry);
  useEffect(() => {
    currentEntryRef.current = currentEntry;
  }, [currentEntry]);

  const { seconds: sessionSeconds, reset: resetSessionTimer } = useSessionTimer();
  const hud = useHud();
  const { isHudVisible, showHudTemporarily } = hud;

  const defaultJournalName = t('journals.defaultName');
  const initialization = useInitialization({
    defaultJournalName,
    // setContent, // No longer passed directly
    showHudTemporarily,
    resetSessionTimer,
  });

  const autoSave = useAutoSave({
    onSave: async (htmlContent) => {
      try {
        const activeEntry = currentEntryRef.current;
        if (!activeEntry) return;
        if (getWordCountFromHTML(htmlContent) === 0) return;
        await updateEntry(activeEntry.id, { content: htmlContent });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setApiError(t('app.errors.save', { message }));
      }
    },
    enabled: initialization.status === 'success',
  });

  const { lastSaved, trigger: triggerAutoSave } = autoSave;

  const ensureEntryExists = useCallback(
    async (html: string) => {
      const hasContent = getWordCountFromHTML(html) > 0;
      const activeEntry = currentEntryRef.current;
      if (!hasContent || !currentJournal) {
        return activeEntry;
      }

      if (activeEntry) {
        return activeEntry;
      }

      const createdEntry = await createEntry({
        journalId: currentJournal.id,
        content: html,
      });
      setCurrentEntry(createdEntry);
      showHudTemporarily();
      return createdEntry;
    },
    [createEntry, currentJournal, setCurrentEntry, showHudTemporarily]
  );

  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      const hasContent = getWordCountFromHTML(newContent) > 0;
      if (!hasContent) {
        return;
      }

      void (async () => {
        await ensureEntryExists(newContent);
        triggerAutoSave(newContent);
      })();
    },
    [ensureEntryExists, triggerAutoSave]
  );

  const handleManualSave = useCallback(
    async (htmlContent: string) => {
      if (getWordCountFromHTML(htmlContent) === 0) return;
      await ensureEntryExists(htmlContent);
      const activeEntry = currentEntryRef.current;
      if (!activeEntry) return;
      try {
        await updateEntry(activeEntry.id, { content: htmlContent });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setApiError(t('app.errors.save', { message }));
      }
    },
    [ensureEntryExists, t, updateEntry]
  );

  useEntryNavigation({
    entries,
    currentEntry,
    // setContent, // No longer passed directly
    // showHudTemporarily, // No longer passed directly
  });

  // Effect to update local content state when currentEntry changes
  useEffect(() => {
    if (currentEntry) {
      setContent(currentEntry.content ?? '');
    } else {
      setContent('');
    }
  }, [currentEntry]);

  const wordCount = useMemo(() => getWordCountFromHTML(content), [content]);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    [i18n.language]
  );
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [i18n.language]
  );

  const dateLabel = useMemo(
    () => t('hud.today', { date: dateFormatter.format(new Date()) }),
    [dateFormatter, t]
  );

  const snapshotLabel = useMemo(
    () =>
      lastSaved
        ? t('hud.snapshotSaved', { time: timeFormatter.format(lastSaved) })
        : t('hud.snapshotPending'),
    [lastSaved, t, timeFormatter]
  );

  const wordCountLabel = useMemo(() => t('hud.words', { count: wordCount }), [t, wordCount]);
  const sessionLabel = useMemo(() => formatDuration(sessionSeconds), [sessionSeconds]);

  const isSettingsRoute = location.pathname === '/settings';
  const placeholder = t('editor.placeholder');
  const initializingLabel = t('app.initializing');
  const initializationMessage =
    initialization.status === 'error' && initialization.error
      ? t('app.errors.initialize', { message: initialization.error })
      : null;

  const hudViewModel: HudViewModel = {
    isVisible: isHudVisible && initialization.status === 'success',
    dateLabel,
    wordCountLabel,
    sessionLabel,
    snapshotLabel,
  };

  return {
    status: initialization.status,
    initializationError: initialization.error,
    initializationMessage,
    initializingLabel,
    apiError,
    setApiError,
    clearApiError: () => setApiError(null),
    content,
    placeholder,
    handleContentChange,
    handleManualSave,
    hud: hudViewModel,
    isSettingsRoute,
  };
}
