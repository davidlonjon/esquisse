import { useState, useEffect, useMemo } from 'react';

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
        setApiError(`Failed to initialize: ${error}`);
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
        setApiError(`Failed to save: ${error}`);
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
      setApiError(`Failed to save: ${error}`);
    }
  };

  const wordCount = useMemo(() => {
    return getWordCountFromHTML(content);
  }, [content]);

  const dateLabel = useMemo(() => {
    const now = new Date();
    return `Today · ${now.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })}`;
  }, []);

  const snapshotLabel = lastSaved
    ? `Snapshot saved · ${lastSaved.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : 'Snapshot pending';

  // Check if the Electron API is available
  if (window.api === undefined) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="esquisse-theme">
        <div className="flex h-screen w-screen flex-col items-center justify-center p-8">
          <div className="max-w-md rounded-lg border border-destructive bg-destructive/10 p-6">
            <h2 className="mb-2 text-lg font-semibold text-destructive">Error</h2>
            <p className="text-sm">
              Electron API not available. Preload script may have failed to load.
            </p>
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
          <p className="text-muted-foreground">Initializing...</p>
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
          wordCountLabel={`Words · ${wordCount}`}
          sessionLabel={formatDuration(sessionSeconds)}
          snapshotLabel={snapshotLabel}
        />
        <Editor
          content={content}
          onChange={handleContentChange}
          onSave={handleManualSave}
          focusMode={true}
          typewriterMode={true}
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
