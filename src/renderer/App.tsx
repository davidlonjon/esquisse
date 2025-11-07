import { useState, useEffect } from 'react';

import { Editor } from '@features/editor';
import { useEntryStore } from '@features/entries';
import { useJournalStore } from '@features/journals';
import { useAutoSave } from '@hooks/useAutoSave';
import { ThemeProvider } from '@providers/theme-provider';

function App() {
  const [content, setContent] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
  const { isSaving, lastSaved, trigger } = useAutoSave({
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
        <Editor
          content={content}
          onChange={handleContentChange}
          onSave={handleManualSave}
          focusMode={true}
          typewriterMode={true}
        />

        {/* Save status indicator */}
        {(isSaving || lastSaved) && (
          <div className="fixed bottom-4 right-4 text-xs text-muted-foreground">
            {isSaving ? 'Saving...' : lastSaved && `Saved at ${lastSaved.toLocaleTimeString()}`}
          </div>
        )}

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
