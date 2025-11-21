import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  selectEditorContent,
  selectEditorLastSaved,
  selectEditorWordCount,
  useEditorContentStore,
} from '@features/editor';
import { selectCurrentEntry, selectEntries, useEntryStore } from '@features/entries';
import { useAutoSave } from '@hooks/useAutoSave';
import { useEntryDeletion } from '@hooks/useEntryDeletion';
import { useEntryDraft } from '@hooks/useEntryDraft';
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
  deletion: {
    isDialogOpen: boolean;
    handleArchive: () => Promise<void>;
    handleDelete: () => Promise<void>;
    handleCloseDialog: () => void;
  };
}

export function useEditorController(): EditorController {
  const { t, i18n } = useTranslation();
  const content = useEditorContentStore(selectEditorContent);
  const wordCount = useEditorContentStore(selectEditorWordCount);
  const lastSaved = useEditorContentStore(selectEditorLastSaved);
  const setEditorContent = useEditorContentStore((state) => state.setContent);
  const resetEditorContent = useEditorContentStore((state) => state.resetContent);
  const setEditorLastSaved = useEditorContentStore((state) => state.setLastSaved);
  const [apiError, setApiError] = useState<string | null>(null);

  const entries = useEntryStore(selectEntries);
  const currentEntry = useEntryStore(selectCurrentEntry);
  const updateEntry = useEntryStore((state) => state.updateEntry);

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
    showHudTemporarily,
    resetSessionTimer,
  });

  const { ensureEntryExists } = useEntryDraft({
    onEntryCreated: showHudTemporarily,
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

  const { lastSaved: autoSavedAt, trigger: triggerAutoSave } = autoSave;

  useEffect(() => {
    setEditorLastSaved(autoSavedAt);
  }, [autoSavedAt, setEditorLastSaved]);

  const handleContentChange = (newContent: string) => {
    setEditorContent(newContent);
    const hasContent = getWordCountFromHTML(newContent) > 0;
    if (!hasContent) {
      return;
    }

    void (async () => {
      // Wait for entry to exist before triggering auto-save to prevent race condition
      await ensureEntryExists(newContent);
      // Only trigger auto-save after entry is confirmed to exist
      triggerAutoSave(newContent);
    })();
  };

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
    onNavigate: showHudTemporarily,
  });

  const entryDeletion = useEntryDeletion({
    currentEntry,
    entries,
  });

  // Effect to update local content state when currentEntry changes
  useEffect(() => {
    const nextContent = currentEntry?.content ?? '';
    resetEditorContent(nextContent);
  }, [currentEntry?.content, currentEntry?.id, resetEditorContent]);

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
    deletion: entryDeletion,
  };
}
