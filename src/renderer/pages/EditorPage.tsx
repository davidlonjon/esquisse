import { useRouteContext } from '@tanstack/react-router';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteEntryDialog } from '@components/dialogs';
import { IpcErrorBoundary, IpcErrorFallback } from '@components/layout';
import { Editor } from '@features/editor';
import { EditorErrorToast, EditorHud, EditorStatus } from '@features/editor/components';
import { selectCurrentEntryId, selectEntries, useEntryStore } from '@features/entries';
import { useEditorController } from '@hooks/useEditorController';

export function EditorPage() {
  let searchOpen: (() => void) | undefined;
  try {
    const routeContext = useRouteContext({ from: '/' }) as { searchOpen?: () => void };
    searchOpen = routeContext?.searchOpen;
  } catch {
    // Router context may be unavailable in isolated environments (e.g., unit tests)
    searchOpen = undefined;
  }
  const { t } = useTranslation();
  const controller = useEditorController();
  const isApiAvailable = typeof window !== 'undefined' && Boolean(window.api);

  const currentEntryId = useEntryStore(selectCurrentEntryId);
  const entries = useEntryStore(selectEntries);
  const prevEntryIdRef = useRef<string | null>(currentEntryId ?? null);
  const [entryTransitionDirection, setEntryTransitionDirection] = useState<
    'older' | 'newer' | null
  >(null);

  useEffect(() => {
    const prevId = prevEntryIdRef.current;
    const nextId = currentEntryId ?? null;

    // Initial load: don't animate
    if (!prevId || !nextId || prevId === nextId || entries.length === 0) {
      prevEntryIdRef.current = nextId;
      return;
    }

    const prevIndex = entries.findIndex((entry) => entry.id === prevId);
    const nextIndex = entries.findIndex((entry) => entry.id === nextId);

    if (prevIndex === -1 || nextIndex === -1) {
      prevEntryIdRef.current = nextId;
      return;
    }

    // Entries are sorted newest-first (index 0 = newest)
    // Navigating to an entry with a higher index means going to an older entry
    const direction: 'older' | 'newer' = nextIndex > prevIndex ? 'older' : 'newer';

    setEntryTransitionDirection(direction);

    const timeoutId = setTimeout(() => {
      setEntryTransitionDirection(null);
    }, 300);

    prevEntryIdRef.current = nextId;

    return () => {
      clearTimeout(timeoutId);
    };
  }, [currentEntryId, entries]);

  if (!isApiAvailable) {
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

  if (controller.status !== 'success') {
    return (
      <EditorStatus
        status={controller.status}
        initializingLabel={controller.initializingLabel}
        errorMessage={controller.initializationMessage}
      />
    );
  }

  return (
    <IpcErrorBoundary
      fallback={(error, retry) => (
        <IpcErrorFallback error={error} retry={retry} variant="fullscreen" />
      )}
    >
      <div className="relative h-screen w-screen">
        <EditorHud {...controller.hud} disabled={false} onOpenSearch={searchOpen} />
        <div
          className={clsx(
            'h-full editor-page-transition',
            entryTransitionDirection === 'older' && 'editor-page-transition-older',
            entryTransitionDirection === 'newer' && 'editor-page-transition-newer'
          )}
        >
          <Editor
            content={controller.content}
            onChange={controller.handleContentChange}
            onSave={controller.handleManualSave}
            focusMode={true}
            typewriterMode={true}
            placeholder={controller.placeholder}
            editable={!controller.hud.isReadOnly}
          />
        </div>

        {controller.apiError && (
          <EditorErrorToast message={controller.apiError} onDismiss={controller.clearApiError} />
        )}

        <DeleteEntryDialog
          isOpen={controller.deletion.isDialogOpen}
          onClose={controller.deletion.handleCloseDialog}
          onArchive={controller.deletion.handleArchive}
          onDelete={controller.deletion.handleDelete}
        />
      </div>
    </IpcErrorBoundary>
  );
}
