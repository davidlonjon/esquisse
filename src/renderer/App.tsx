import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Editor } from '@features/editor';
import { useEntryStore } from '@features/entries';
import { useJournalStore } from '@features/journals';
import { useAutoSave } from '@hooks/useAutoSave';
import { useEdgeReveal } from '@hooks/useEdgeReveal';
import { useSessionTimer } from '@hooks/useSessionTimer';
import { OverlayHUD } from '@layout/OverlayHUD';
import { getWordCountFromHTML } from '@lib/text';
import { formatDuration } from '@lib/time';
import { ThemeProvider } from '@providers/theme-provider';

function App() {
  const [content, setContent] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { t, i18n } = useTranslation();
  const hudVisible = useEdgeReveal();
  const { seconds: sessionSeconds, reset: resetSessionTimer } = useSessionTimer();

  const { loadJournals, createJournal, setCurrentJournal } = useJournalStore();
  const { currentEntry, updateEntry, setCurrentEntry } = useEntryStore();

  // Initialize journal and entry on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load all journals
        await loadJournals();

        // Get journals after loading
        const allJournals = useJournalStore.getState().journals;

        // If no journals exist, create a default one
        let journal = allJournals[0];
        if (!journal) {
          await createJournal({ name: 'Personal Journal' });
          journal = useJournalStore.getState().journals[0];
        }

        // Set the current journal
        setCurrentJournal(journal);

        // Always create a new blank entry when the app opens
        const newEntry = await window.api.createEntry({
          journalId: journal.id,
          content: '',
        });
        setCurrentEntry(newEntry);
        setContent('');
        resetSessionTimer();

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize:', error);
        const message = error instanceof Error ? error.message : String(error);
        setApiError(i18n.t('app.errors.initialize', { message }));
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save functionality (uses AUTO_SAVE_DELAY constant by default)
  const { lastSaved, trigger } = useAutoSave({
    onSave: async (htmlContent) => {
      try {
        if (!currentEntry) return;

        // Update the existing entry
        await updateEntry(currentEntry.id, { content: htmlContent });
      } catch (error) {
        console.error('Failed to save:', error);
        const message = error instanceof Error ? error.message : String(error);
        setApiError(i18n.t('app.errors.save', { message }));
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

      // Update the existing entry
      await updateEntry(currentEntry.id, { content: htmlContent });
    } catch (error) {
      console.error('Failed to save:', error);
      const message = error instanceof Error ? error.message : String(error);
      setApiError(i18n.t('app.errors.save', { message }));
    }
  };

  const wordCount = useMemo(() => {
    return getWordCountFromHTML(content);
  }, [content]);

  const dateFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(i18n.language, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [i18n.language]);

  const dateLabel = useMemo(() => {
    return t('hud.today', { date: dateFormatter.format(new Date()) });
  }, [dateFormatter, t]);

  const timeFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [i18n.language]);

  const snapshotLabel = useMemo(() => {
    if (!lastSaved) {
      return t('hud.snapshotPending');
    }

    return t('hud.snapshotSaved', { time: timeFormatter.format(lastSaved) });
  }, [lastSaved, t, timeFormatter]);

  const wordCountLabel = useMemo(() => t('hud.words', { count: wordCount }), [t, wordCount]);

  // Check if the Electron API is available
  if (window.api === undefined) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="esquisse-theme">
        <div className="flex h-screen w-screen flex-col items-center justify-center p-8">
          <div className="max-w-md rounded-lg border border-destructive bg-destructive/10 p-6">
            <h2 className="mb-2 text-lg font-semibold text-destructive">
              {t('app.errors.apiUnavailableTitle')}
            </h2>
            <p className="text-sm">{t('app.errors.apiUnavailableMessage')}</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="esquisse-theme">
        <div className="flex h-screen w-screen flex-col items-center justify-center">
          <p className="text-muted-foreground">{t('app.initializing')}</p>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="esquisse-theme">
      <div className="relative h-screen w-screen">
        <OverlayHUD
          showTop={hudVisible}
          showBottom={hudVisible}
          dateLabel={dateLabel}
          wordCountLabel={wordCountLabel}
          sessionLabel={formatDuration(sessionSeconds)}
          snapshotLabel={snapshotLabel}
        />
        <Editor
          content={content}
          onChange={handleContentChange}
          onSave={handleManualSave}
          focusMode={true}
          typewriterMode={true}
          placeholder={t('editor.placeholder')}
        />

        {/* Error display */}
        {apiError && (
          <div className="fixed top-4 right-4 max-w-sm rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {apiError}
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
