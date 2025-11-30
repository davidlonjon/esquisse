import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  selectEditorLastSaved,
  selectEditorWordCount,
  useEditorContentStore,
} from '@features/editor';
import { selectCurrentEntry, useEntryStore } from '@features/entries';
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
  onOpenSearch?: () => void;
}

interface UseEditorHudOptions {
  isHudVisible: boolean;
  isReadOnly: boolean;
  initializationSuccess: boolean;
  sessionSeconds: number;
  wordCount: number;
  onToggleEditMode?: () => void;
  onShowHud: () => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  canNavigatePrevious: boolean;
  canNavigateNext: boolean;
  onApiError: (message: string) => void;
  onOpenSearch?: () => void;
}

export function useEditorHud({
  isHudVisible,
  isReadOnly,
  initializationSuccess,
  sessionSeconds,
  wordCount,
  onToggleEditMode,
  onShowHud,
  onNavigatePrevious,
  onNavigateNext,
  canNavigatePrevious,
  canNavigateNext,
  onApiError,
  onOpenSearch,
}: UseEditorHudOptions): HudViewModel {
  const { t, i18n } = useTranslation();
  const currentEntry = useEntryStore(selectCurrentEntry);
  const lastSaved = useEditorContentStore(selectEditorLastSaved);
  const editorWordCount = useEditorContentStore(selectEditorWordCount);
  const updateEntry = useEntryStore((state) => state.updateEntry);
  const toggleFavorite = useEntryStore((state) => state.toggleFavorite);

  // Date formatters
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

  // Labels
  const dateLabel = useMemo(() => {
    if (!currentEntry) {
      const now = new Date();
      return t('hud.today', {
        date: `${dateFormatterWithoutYear.format(now)} · ${timeFormatter.format(now)}`,
      });
    }
    const entryDate = new Date(currentEntry.createdAt);
    const currentYear = new Date().getFullYear();
    const entryYear = entryDate.getFullYear();
    const dateFormatter =
      entryYear === currentYear ? dateFormatterWithoutYear : dateFormatterWithYear;
    const dateText = dateFormatter.format(entryDate);
    const timeText = timeFormatter.format(entryDate);
    return t('hud.entryDate', { date: `${dateText} · ${timeText}` });
  }, [currentEntry, dateFormatterWithYear, dateFormatterWithoutYear, timeFormatter, t]);

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
    const dateText = formatter.format(updatedDate);
    const timeText = timeFormatter.format(updatedDate);
    return t('hud.lastUpdated', { date: `${dateText} · ${timeText}` });
  }, [currentEntry, dateFormatterWithYear, dateFormatterWithoutYear, timeFormatter, t]);

  const wordCountLabel = useMemo(
    () => t('hud.words', { count: editorWordCount }),
    [t, editorWordCount]
  );
  const sessionLabel = useMemo(() => formatDuration(sessionSeconds), [sessionSeconds]);

  // Handlers
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
        onShowHud();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        onApiError(t('app.errors.save', { message }));
      }
    },
    [currentEntry, updateEntry, onShowHud, t, onApiError]
  );

  return {
    isVisible: isHudVisible && initializationSuccess,
    isReadOnly,
    dateLabel,
    wordCountLabel,
    sessionLabel,
    snapshotLabel,
    lastUpdatedLabel,
    isFavorite: currentEntry?.isFavorite ?? false,
    onToggleFavorite: handleToggleFavorite,
    // Only show mode toggle if there's actual content
    onToggleEditMode: wordCount > 0 ? onToggleEditMode : undefined,
    onShowHud,
    onNavigatePrevious,
    onNavigateNext,
    canNavigatePrevious,
    canNavigateNext,
    currentEntryCreatedAt: currentEntry?.createdAt,
    onDateTimeChange: handleDateTimeChange,
    onOpenSearch,
  };
}
