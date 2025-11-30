import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  selectEditorContent,
  selectEditorWordCount,
  useEditorContentStore,
} from '@features/editor';
import { selectCurrentEntry, selectEntries, useEntryStore } from '@features/entries';
import { useAutoSave } from '@hooks/useAutoSave';
import { useEditorHud } from '@hooks/useEditorHud';
import { useEditorNavigation } from '@hooks/useEditorNavigation';
import { useEntryDeletion } from '@hooks/useEntryDeletion';
import { useEntryDraft } from '@hooks/useEntryDraft';
import { useEntryNavigation as useEntryNavigationHotkeys } from '@hooks/useEntryNavigation';
import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';
import { useHud } from '@hooks/useHud';
import { useInitialization } from '@hooks/useInitialization';
import { useSessionTimer } from '@hooks/useSessionTimer';
import { getWordCountFromHTML } from '@lib/text';

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
  hud: ReturnType<typeof useEditorHud>;
  deletion: {
    isDialogOpen: boolean;
    handleArchive: () => Promise<void>;
    handleDelete: () => Promise<void>;
    handleCloseDialog: () => void;
  };
}

export function useEditorController(): EditorController {
  const { t } = useTranslation();
  const content = useEditorContentStore(selectEditorContent);
  const wordCount = useEditorContentStore(selectEditorWordCount);
  const setEditorContent = useEditorContentStore((state) => state.setContent);
  const resetEditorContent = useEditorContentStore((state) => state.resetContent);
  const setEditorLastSaved = useEditorContentStore((state) => state.setLastSaved);
  const [apiError, setApiError] = useState<string | null>(null);

  const entries = useEntryStore(selectEntries);
  const currentEntry = useEntryStore(selectCurrentEntry);
  const updateEntry = useEntryStore((state) => state.updateEntry);

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

  useEntryNavigationHotkeys({
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

  // Navigation
  const navigation = useEditorNavigation({ onNavigate: showHudTemporarily });

  // HUD view model
  const hudViewModel = useEditorHud({
    isHudVisible,
    isReadOnly,
    initializationSuccess: initialization.status === 'success',
    sessionSeconds,
    wordCount,
    onToggleEditMode: handleToggleEditMode,
    onShowHud: showHudTemporarily,
    onNavigatePrevious: navigation.handleNavigatePrevious,
    onNavigateNext: navigation.handleNavigateNext,
    canNavigatePrevious: navigation.canNavigatePrevious,
    canNavigateNext: navigation.canNavigateNext,
    onApiError: setApiError,
    onOpenSearch: undefined, // Will be provided by EditorPage
  });

  const placeholder = t('editor.placeholder');
  const initializingLabel = t('app.initializing');
  const initializationMessage =
    initialization.status === 'error' && initialization.error
      ? t('app.errors.initialize', { message: initialization.error })
      : null;

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
