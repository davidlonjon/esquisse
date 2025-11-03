import { useEffect, useState } from 'react';

import { ThemeProvider } from './components/theme-provider';

function App() {
  const [journals, setJournals] = useState<unknown[]>([]);

  // Check if the Electron API is available (evaluated once at component mount)
  const apiAvailable = window.api !== undefined;
  const [apiError, setApiError] = useState<string | null>(
    !apiAvailable ? 'Electron API not available. Preload script may have failed to load.' : null
  );

  useEffect(() => {
    if (!apiAvailable) {
      console.error('window.api is undefined - preload script did not load correctly');
      return;
    }

    // Test the IPC connection
    const fetchJournals = async () => {
      try {
        const data = await window.api.getAllJournals();
        setJournals(data);
      } catch (error) {
        console.error('Error fetching journals:', error);
        setApiError(`Error fetching journals: ${error}`);
      }
    };

    fetchJournals();
  }, [apiAvailable]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="esquisse-theme">
      <div className="flex h-screen w-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-4xl font-bold">Esquisse</h1>
        <p className="text-muted-foreground">Your minimalist journaling companion</p>

        {apiError ? (
          <div className="mt-8 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-semibold">Error</p>
            <p className="mt-1">{apiError}</p>
          </div>
        ) : (
          <div className="mt-8 text-sm text-muted-foreground">
            <p>Journals loaded: {journals.length}</p>
            <p className="mt-2 text-xs">
              The database is connected and ready. Start building your app!
            </p>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
