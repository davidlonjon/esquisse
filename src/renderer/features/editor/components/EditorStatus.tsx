import type { InitializationStatus } from '@hooks/useInitialization';

interface EditorStatusProps {
  status: InitializationStatus;
  initializingLabel: string;
  errorMessage?: string | null;
}

export function EditorStatus({ status, initializingLabel, errorMessage }: EditorStatusProps) {
  if (status === 'error') {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center p-8">
        <div className="max-w-md rounded-lg border border-destructive bg-destructive/10 p-6 text-destructive">
          <h2 className="mb-2 text-lg font-semibold">{errorMessage}</h2>
          {!errorMessage && <p>Unable to initialize the editor.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <p className="text-muted-foreground">{initializingLabel}</p>
    </div>
  );
}
