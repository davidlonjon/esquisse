import { useState, useEffect } from 'react';

import { Editor } from './components/Editor/Editor';
import { ThemeProvider } from './components/theme-provider';
import { useAutoSave } from './hooks/useAutoSave';
import { useEntryStore } from './store/entries';
import { useJournalStore } from './store/journals';

function App() {
  const [content, setContent] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { journals, currentJournal, loadJournals, createJournal, setCurrentJournal } =
    useJournalStore();
  const { currentEntry, createEntry, updateEntry, setCurrentEntry } = useEntryStore();

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

        // Load the most recent entry for this journal
        const entries = await window.api.getAllEntries(journal.id);

        if (entries.length > 0) {
          const mostRecentEntry = entries[0];
          setCurrentEntry(mostRecentEntry);
          setContent(mostRecentEntry.content);
        } else {
          // Create a new blank entry
          const newEntry = await window.api.createEntry({
            journalId: journal.id,
            content: '',
          });
          setCurrentEntry(newEntry);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize:', error);
        setApiError(`Failed to initialize: ${error}`);
      }
    };

    initialize();
  }, []);

  // Auto-save functionality
  const { isSaving, lastSaved, trigger } = useAutoSave({
    delay: 2000, // Save 2 seconds after user stops typing
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
