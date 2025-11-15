interface EditorErrorToastProps {
  message: string;
  onDismiss?: () => void;
}

export function EditorErrorToast({ message, onDismiss }: EditorErrorToastProps) {
  return (
    <div className="fixed right-4 top-4 max-w-sm rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
      <div className="flex items-start gap-2">
        <p className="flex-1">{message}</p>
        {onDismiss && (
          <button
            type="button"
            aria-label="Dismiss error"
            className="btn btn-ghost btn-xs"
            onClick={onDismiss}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
