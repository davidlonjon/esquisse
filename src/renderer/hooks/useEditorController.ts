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
  onToggleEditMode?: () => void;
  onShowHud: () => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  canNavigatePrevious: boolean;
  canNavigateNext: boolean;
  currentEntryCreatedAt?: string;
  onDateTimeChange?: (isoString: string) => void;
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
  // Track if we're actively composing a new entry (just created it, not navigated to it)
  const [isActivelyComposing, setIsActivelyComposing] = useState(false);

  // Determine if we're in a new blank draft (no current entry)
  const isNewDraft = useMemo(() => {
    return currentEntry === null;
  }, [currentEntry]);

  // Calculate read-only state: new drafts and actively composed entries are editable
  const isReadOnly = useMemo(() => {
    if (isEditModeOverride !== null) {
      return !isEditModeOverride;
    }
    // New drafts or actively composing entries are editable
    return !isNewDraft && !isActivelyComposing;
  }, [isEditModeOverride, isNewDraft, isActivelyComposing]);

  // Track previous entry ID to detect navigation vs creation
  const prevEntryIdRef = useRef<string | undefined>(currentEntry?.id);

  // When entry changes (navigation), reset states
  useEffect(() => {
    const prevId = prevEntryIdRef.current;
    const currentId = currentEntry?.id;

    // Only reset if we're navigating between existing entries
    // Don't reset when creating a new entry (undefined -> id)
    if (prevId !== undefined && currentId !== prevId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsEditModeOverride(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsActivelyComposing(false);
    }

    prevEntryIdRef.current = currentId;
  }, [currentEntry?.id]);

  const currentEntryRef = useRef(currentEntry);
  useEffect(() => {
    currentEntryRef.current = currentEntry;
  }, [currentEntry]);

  const sessionTimer = useSessionTimer();
  const hud = useHud();
  const { isHudVisible, showHudTemporarily } = hud;

  // For display purposes, use 0 seconds when read-only
  const sessionSeconds = isReadOnly ? 0 : sessionTimer.seconds;

  const defaultJournalName = t('journals.defaultName');
  const initialization = useInitialization({
    defaultJournalName,
    showHudTemporarily,
    resetSessionTimer: sessionTimer.reset, // Use the stable reset function directly
  });

  const handleEntryCreatedFromBlank = useCallback(() => {
    setIsActivelyComposing(true);
  }, []);

  const { ensureEntryExists } = useEntryDraft({
    onEntryCreated: showHudTemporarily,
    onEntryCreatedFromBlank: handleEntryCreatedFromBlank,
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

  // Toggle edit mode handler
  const handleToggleEditMode = useCallback(() => {
    // Toggle: if no override exists, set to true (edit mode)
    // If override exists, flip it
    setIsEditModeOverride((prev) => (prev === null ? true : !prev));
    showHudTemporarily();
  }, [showHudTemporarily]);

  // Register keyboard shortcut for toggling edit mode
  useGlobalHotkeys(
    'mod+shift+e',
    (event) => {
      event.preventDefault();
      handleToggleEditMode();
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

  const handleDateTimeChange = useCallback(
    async (isoString: string) => {
      if (!currentEntry) return;

      try {
        await updateEntry(currentEntry.id, { createdAt: isoString });
        showHudTemporarily();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setApiError(t('app.errors.save', { message }));
      }
    },
    [currentEntry, updateEntry, showHudTemporarily, t]
  );

  // Navigation handlers
  const setCurrentEntry = useEntryStore((state) => state.setCurrentEntry);

  const handleNavigatePrevious = useCallback(() => {
    if (entries.length === 0) return;

    const currentIndex = currentEntry
      ? entries.findIndex((entry) => entry.id === currentEntry.id)
      : -1;

    // From blank draft, go back to Entry 0 (most recent saved entry)
    if (currentIndex === -1) {
      const firstEntry = entries[0];
      if (!firstEntry) return;
      setCurrentEntry(firstEntry);
      showHudTemporarily();
      return;
    }

    const targetIndex = currentIndex + 1; // Previous = older = higher index

    // Can't go past the last entry
    if (targetIndex >= entries.length) return;

    const targetEntry = entries[targetIndex];
    if (!targetEntry) return;
    setCurrentEntry(targetEntry);
    showHudTemporarily();
  }, [entries, currentEntry, setCurrentEntry, showHudTemporarily]);

  const handleNavigateNext = useCallback(() => {
    if (entries.length === 0) return;

    const currentIndex = currentEntry
      ? entries.findIndex((entry) => entry.id === currentEntry.id)
      : -1;

    // Don't navigate next from blank draft (already at newest position)
    if (currentIndex === -1) return;

    const targetIndex = currentIndex - 1; // Next = newer = lower index

    // From any entry, going next (towards newer)
    if (targetIndex < 0) {
      // Go to blank draft when going next from Entry 0
      setCurrentEntry(null);
      showHudTemporarily();
      return;
    }

    const targetEntry = entries[targetIndex];
    if (!targetEntry) return;
    setCurrentEntry(targetEntry);
    showHudTemporarily();
  }, [entries, currentEntry, setCurrentEntry, showHudTemporarily]);

  // Determine navigation availability
  const canNavigatePrevious = useMemo(() => {
    if (entries.length === 0) return false;
    if (!currentEntry) return true; // Can go previous from blank draft to Entry 0
    const currentIndex = entries.findIndex((entry) => entry.id === currentEntry.id);
    return currentIndex < entries.length - 1; // Can go previous (older) if not at last entry
  }, [entries, currentEntry]);

  const canNavigateNext = useMemo(() => {
    if (entries.length === 0) return false;
    if (!currentEntry) return false; // Can't go next from blank draft
    // Can always go next (newer) from any entry - either to a newer entry or to blank draft
    return true;
  }, [entries, currentEntry]);

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
    // Only show mode toggle if there's actual content
    onToggleEditMode: wordCount > 0 ? handleToggleEditMode : undefined,
    onShowHud: showHudTemporarily,
    onNavigatePrevious: handleNavigatePrevious,
    onNavigateNext: handleNavigateNext,
    canNavigatePrevious,
    canNavigateNext,
    currentEntryCreatedAt: currentEntry?.createdAt,
    onDateTimeChange: handleDateTimeChange,
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
