import { useTranslation } from 'react-i18next';

import { DeleteEntryDialog } from '@components/dialogs';
import { IpcErrorBoundary, IpcErrorFallback } from '@components/layout';
import { Editor } from '@features/editor';
import { EditorErrorToast, EditorHud, EditorStatus } from '@features/editor/components';
import { useEditorController } from '@hooks/useEditorController';

export function EditorPage() {
  const { t } = useTranslation();
  const controller = useEditorController();
  const isApiAvailable = typeof window !== 'undefined' && Boolean(window.api);

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
        <EditorHud
          isVisible={controller.hud.isVisible}
          isReadOnly={controller.hud.isReadOnly}
          dateLabel={controller.hud.dateLabel}
          wordCountLabel={controller.hud.wordCountLabel}
          sessionLabel={controller.hud.sessionLabel}
          snapshotLabel={controller.hud.snapshotLabel}
          lastUpdatedLabel={controller.hud.lastUpdatedLabel}
          disabled={false}
          isFavorite={controller.hud.isFavorite}
          onToggleFavorite={controller.hud.onToggleFavorite}
        />
        <Editor
          content={controller.content}
          onChange={controller.handleContentChange}
          onSave={controller.handleManualSave}
          focusMode={true}
          typewriterMode={true}
          placeholder={controller.placeholder}
          editable={!controller.hud.isReadOnly}
        />

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
