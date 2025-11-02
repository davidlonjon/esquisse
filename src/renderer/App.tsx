import { useEffect, useState } from 'react';

import { ThemeProvider } from './components/theme-provider';

function App() {
  const [journals, setJournals] = useState<unknown[]>([]);

  useEffect(() => {
    // Test the IPC connection
    const fetchJournals = async () => {
      try {
        const data = await window.api.getAllJournals();
        setJournals(data);
        console.log('Journals:', data);
      } catch (error) {
        console.error('Error fetching journals:', error);
      }
    };

    fetchJournals();
  }, []);

  return (
    <ThemeProvider defaultTheme="system" storageKey="esquisse-theme">
      <div className="flex h-screen w-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-4xl font-bold">Esquisse</h1>
        <p className="text-muted-foreground">Your minimalist journaling companion</p>
        <div className="mt-8 text-sm text-muted-foreground">
          <p>Journals loaded: {journals.length}</p>
          <p className="mt-2 text-xs">
            The database is connected and ready. Start building your app!
          </p>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
