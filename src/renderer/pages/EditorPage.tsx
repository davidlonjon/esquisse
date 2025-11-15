import { useRouterState } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Editor } from '@features/editor';
import { useEntryStore } from '@features/entries';
import { useJournalStore } from '@features/journals';
import { useAutoSave } from '@hooks/useAutoSave';
import { useEntryNavigation } from '@hooks/useEntryNavigation';
import { useHud } from '@hooks/useHud';
import { useInitialization } from '@hooks/useInitialization';
import { useSessionTimer } from '@hooks/useSessionTimer';
import { OverlayHUD } from '@layout/OverlayHUD';
import { getWordCountFromHTML } from '@lib/text';
import { formatDuration } from '@lib/time';

export function EditorPage() {
  const { t, i18n } = useTranslation();
  const { location } = useRouterState();
  const [content, setContent] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { isHudVisible, showHudTemporarily } = useHud();
  const { seconds: sessionSeconds, reset: resetSessionTimer } = useSessionTimer();

  const entries = useEntryStore((state) => state.entries);
  const currentEntry = useEntryStore((state) => state.currentEntry);
  const updateEntry = useEntryStore((state) => state.updateEntry);
  const currentJournal = useJournalStore((state) => state.currentJournal);

  useInitialization({
    setApiError,
    setContent,
    showHudTemporarily,
    resetSessionTimer,
    setIsInitialized,
    t,
  });

  const { lastSaved, trigger } = useAutoSave({
    onSave: async (htmlContent) => {
      try {
        if (getWordCountFromHTML(htmlContent) === 0) return;
        const activeEntry = useEntryStore.getState().currentEntry;
        if (!activeEntry) return;
        await updateEntry(activeEntry.id, { content: htmlContent });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setApiError(t('app.errors.save', { message }));
      }
    },
    enabled: isInitialized,
  });

  const ensureEntryExists = useCallback(
    async (html: string) => {
      const hasContent = getWordCountFromHTML(html) > 0;
      if (!hasContent || !currentJournal) {
        return useEntryStore.getState().currentEntry;
      }

      const existingEntry = useEntryStore.getState().currentEntry;
      if (existingEntry) {
        return existingEntry;
      }

      const createdEntry = await window.api.createEntry({
        journalId: currentJournal.id,
        content: html,
      });
      await useEntryStore.getState().loadEntries(currentJournal.id);
      const syncedEntry =
        useEntryStore.getState().entries.find((entry) => entry.id === createdEntry.id) ||
        createdEntry;
      useEntryStore.getState().setCurrentEntry(syncedEntry);
      showHudTemporarily();
      return syncedEntry;
    },
    [currentJournal, showHudTemporarily]
  );

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    const hasContent = getWordCountFromHTML(newContent) > 0;
    if (!hasContent) {
      return;
    }

    void (async () => {
      await ensureEntryExists(newContent);
      trigger(newContent);
    })();
  };

  const handleManualSave = async (htmlContent: string) => {
    try {
      if (getWordCountFromHTML(htmlContent) === 0) return;
      await ensureEntryExists(htmlContent);
      const activeEntry = useEntryStore.getState().currentEntry;
      if (!activeEntry) return;
      await updateEntry(activeEntry.id, { content: htmlContent });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setApiError(t('app.errors.save', { message }));
    }
  };

  useEntryNavigation({
    entries,
    currentEntry,
    setContent,
    showHudTemporarily,
  });

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
  const isSettingsRoute = location.pathname === '/settings';

  if (window.api === undefined) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center p-8">
        <div className="max-w-md rounded-lg border border-destructive bg-destructive/10 p-6">
          <h2 className="mb-2 text-lg font-semibold text-destructive">
            {t('app.errors.apiUnavailableTitle')}
          </h2>
          <p className="text-sm">{t('app.errors.apiUnavailableMessage')}</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center">
        <p className="text-muted-foreground">{t('app.initializing')}</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen">
      <OverlayHUD
        showTop={isHudVisible}
        showBottom={isHudVisible}
        dateLabel={dateLabel}
        wordCountLabel={wordCountLabel}
        sessionLabel={formatDuration(sessionSeconds)}
        snapshotLabel={snapshotLabel}
        disabled={isSettingsRoute}
      />
      <Editor
        content={content}
        onChange={handleContentChange}
        onSave={handleManualSave}
        focusMode={true}
        typewriterMode={true}
        placeholder={t('editor.placeholder')}
      />

      {apiError && (
        <div className="fixed top-4 right-4 max-w-sm rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {apiError}
        </div>
      )}
    </div>
  );
}
