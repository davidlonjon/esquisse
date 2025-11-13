import { useRouterState } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Editor } from '@features/editor';
import { HUD_AUTO_HIDE_DELAY } from '@features/editor/constants';
import { useEntryStore } from '@features/entries';
import { useJournalStore } from '@features/journals';
import { useAutoSave } from '@hooks/useAutoSave';
import { useEdgeReveal } from '@hooks/useEdgeReveal';
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
  const [isHudPinned, setIsHudPinned] = useState(false);
  const [hudTemporaryVisible, setHudTemporaryVisible] = useState(false);
  const hudTimeoutRef = useRef<number | null>(null);

  const { loadJournals, createJournal, setCurrentJournal } = useJournalStore();
  const entries = useEntryStore((state) => state.entries);
  const currentEntry = useEntryStore((state) => state.currentEntry);
  const updateEntry = useEntryStore((state) => state.updateEntry);
  const setCurrentEntry = useEntryStore((state) => state.setCurrentEntry);
  const loadEntries = useEntryStore((state) => state.loadEntries);
  const { seconds: sessionSeconds, reset: resetSessionTimer } = useSessionTimer();

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
        let entryToOpen = useEntryStore.getState().entries[0];

        if (!entryToOpen) {
          entryToOpen = await window.api.createEntry({
            journalId: journal.id,
            content: '',
          });
          await loadEntries(journal.id);
        }

        if (entryToOpen) {
          setCurrentEntry(entryToOpen);
          setContent(entryToOpen.content ?? '');
          showHudTemporarily();
        } else {
          setCurrentEntry(null);
          setContent('');
        }

        resetSessionTimer();
        setIsInitialized(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setApiError(t('app.errors.initialize', { message }));
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { lastSaved, trigger } = useAutoSave({
    onSave: async (htmlContent) => {
      try {
        if (!currentEntry) return;
        await updateEntry(currentEntry.id, { content: htmlContent });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setApiError(t('app.errors.save', { message }));
      }
    },
    enabled: isInitialized && !!currentEntry,
  });

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    trigger(newContent);
  };

  const handleManualSave = async (htmlContent: string) => {
    try {
      if (!currentEntry) return;
      await updateEntry(currentEntry.id, { content: htmlContent });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setApiError(t('app.errors.save', { message }));
    }
  };

  const wordCount = useMemo(() => getWordCountFromHTML(content), [content]);

  const showHudTemporarily = useCallback(() => {
    setHudTemporaryVisible(true);
    if (hudTimeoutRef.current) {
      window.clearTimeout(hudTimeoutRef.current);
    }
    hudTimeoutRef.current = window.setTimeout(() => {
      setHudTemporaryVisible(false);
      hudTimeoutRef.current = null;
    }, HUD_AUTO_HIDE_DELAY);
  }, []);

  const navigateEntry = useCallback(
    (direction: -1 | 1) => {
      if (!currentEntry || entries.length === 0) return;
      const currentIndex = entries.findIndex((entry) => entry.id === currentEntry.id);
      if (currentIndex === -1) return;
      const targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= entries.length) return;
      const targetEntry = entries[targetIndex];
      if (!targetEntry) return;
      setCurrentEntry(targetEntry);
      setContent(targetEntry.content ?? '');
      showHudTemporarily();
    },
    [entries, currentEntry, setCurrentEntry, showHudTemporarily]
  );

  useEffect(() => {
    const handleHudToggle = (event: KeyboardEvent) => {
      const isMetaCombo = event.metaKey || event.ctrlKey;
      if (isMetaCombo && event.key === '.') {
        event.preventDefault();
        setIsHudPinned((prev) => !prev);
      }
    };

    const handleEntryNavigation = (event: KeyboardEvent) => {
      const isMetaCombo = event.metaKey || event.ctrlKey;
      if (!isMetaCombo) return;
      if (event.key === '[') {
        event.preventDefault();
        navigateEntry(1);
      } else if (event.key === ']') {
        event.preventDefault();
        navigateEntry(-1);
      }
    };

    window.addEventListener('keydown', handleHudToggle);
    window.addEventListener('keydown', handleEntryNavigation);
    return () => {
      window.removeEventListener('keydown', handleHudToggle);
      window.removeEventListener('keydown', handleEntryNavigation);
    };
  }, [navigateEntry]);

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
  const hudEdgeVisible = useEdgeReveal();
  const hudVisible = isHudPinned || hudEdgeVisible || hudTemporaryVisible;
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
        showTop={hudVisible}
        showBottom={hudVisible}
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
