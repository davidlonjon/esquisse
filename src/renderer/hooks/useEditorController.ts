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
import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';
import { useHud } from '@hooks/useHud';
import { useInitialization } from '@hooks/useInitialization';
import { useSessionTimer } from '@hooks/useSessionTimer';
import { getWordCountFromHTML } from '@lib/text';
import { formatDuration } from '@lib/time';

interface HudViewModel {
  isVisible: boolean;
  isReadOnly: boolean;
  dateLabel: string;
  wordCountLabel: string;
  sessionLabel: string;
  snapshotLabel: string;
  lastUpdatedLabel: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
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
  const toggleFavorite = useEntryStore((state) => state.toggleFavorite);

  // Read-only mode state
  const [isEditModeOverride, setIsEditModeOverride] = useState<boolean | null>(null);

  // Determine if current entry is the newest
  const isNewestEntry = useMemo(() => {
    if (currentEntry === null) return true; // New draft
    if (entries.length === 0) return true;
    return currentEntry.id === entries[0]?.id;
  }, [currentEntry, entries]);

  // Calculate read-only state: by default, past entries are read-only
  const isReadOnly = useMemo(() => {
    if (isEditModeOverride !== null) {
      return !isEditModeOverride;
    }
    return !isNewestEntry;
  }, [isEditModeOverride, isNewestEntry]);

  // Reset override when entry changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsEditModeOverride(null);
  }, [currentEntry?.id]);

  const currentEntryRef = useRef(currentEntry);
  useEffect(() => {
    currentEntryRef.current = currentEntry;
  }, [currentEntry]);

  const sessionTimer = useSessionTimer();
  const noop = useCallback(() => {}, []);
  const { seconds: sessionSeconds, reset: resetSessionTimer } = isReadOnly
    ? { seconds: 0, reset: noop }
    : sessionTimer;
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
    enabled: !isReadOnly && initialization.status === 'success',
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

  // Register keyboard shortcut for toggling edit mode
  useGlobalHotkeys(
    'mod+shift+e',
    (event) => {
      event.preventDefault();
      setIsEditModeOverride((prev) => (prev === null ? !isNewestEntry : !prev));
      showHudTemporarily();
    },
    { preventDefault: true }
  );

  const entryDeletion = useEntryDeletion({
    currentEntry,
    entries,
  });

  // Effect to update local content state when currentEntry changes
  useEffect(() => {
    const nextContent = currentEntry?.content ?? '';
    resetEditorContent(nextContent);
  }, [currentEntry?.content, currentEntry?.id, resetEditorContent]);

  const dateFormatterWithYear = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [i18n.language]
  );
  const dateFormatterWithoutYear = useMemo(
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

  const dateLabel = useMemo(() => {
    if (!currentEntry) {
      return t('hud.today', { date: dateFormatterWithoutYear.format(new Date()) });
    }
    const entryDate = new Date(currentEntry.createdAt);
    const currentYear = new Date().getFullYear();
    const entryYear = entryDate.getFullYear();
    const formatter = entryYear === currentYear ? dateFormatterWithoutYear : dateFormatterWithYear;
    return t('hud.entryDate', { date: formatter.format(entryDate) });
  }, [currentEntry, dateFormatterWithYear, dateFormatterWithoutYear, t]);

  const snapshotLabel = useMemo(
    () =>
      lastSaved
        ? t('hud.snapshotSaved', { time: timeFormatter.format(lastSaved) })
        : t('hud.snapshotPending'),
    [lastSaved, t, timeFormatter]
  );

  const lastUpdatedLabel = useMemo(() => {
    if (!currentEntry) return '';
    const updatedDate = new Date(currentEntry.updatedAt);
    const currentYear = new Date().getFullYear();
    const updatedYear = updatedDate.getFullYear();
    const formatter =
      updatedYear === currentYear ? dateFormatterWithoutYear : dateFormatterWithYear;
    return t('hud.lastUpdated', { date: formatter.format(updatedDate) });
  }, [currentEntry, dateFormatterWithYear, dateFormatterWithoutYear, t]);

  const wordCountLabel = useMemo(() => t('hud.words', { count: wordCount }), [t, wordCount]);
  const sessionLabel = useMemo(() => formatDuration(sessionSeconds), [sessionSeconds]);

  const placeholder = t('editor.placeholder');
  const initializingLabel = t('app.initializing');
  const initializationMessage =
    initialization.status === 'error' && initialization.error
      ? t('app.errors.initialize', { message: initialization.error })
      : null;

  const handleToggleFavorite = useCallback(() => {
    if (currentEntry) {
      void toggleFavorite(currentEntry.id);
    }
  }, [currentEntry, toggleFavorite]);

  const hudViewModel: HudViewModel = {
    isVisible: isHudVisible && initialization.status === 'success',
    isReadOnly,
    dateLabel,
    wordCountLabel,
    sessionLabel,
    snapshotLabel,
    lastUpdatedLabel,
    isFavorite: currentEntry?.isFavorite ?? false,
    onToggleFavorite: handleToggleFavorite,
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
