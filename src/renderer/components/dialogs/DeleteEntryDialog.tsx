import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface DeleteEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onArchive: () => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  entryTitle?: string;
}

export function DeleteEntryDialog({
  isOpen,
  onClose,
  onArchive,
  onDelete,
  entryTitle,
}: DeleteEntryDialogProps) {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleArchive = async () => {
    setIsProcessing(true);
    try {
      await onArchive();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" disableOutsideClose={isProcessing}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">{t('entry.delete.title')}</h2>
          {entryTitle && <p className="mt-1 text-sm opacity-70">&ldquo;{entryTitle}&rdquo;</p>}
        </div>

        {/* Description */}
        <p className="text-base">{t('entry.delete.message')}</p>

        {/* Options */}
        <div className="space-y-3">
          {/* Archive Option (Primary) */}
          <div className="card border border-primary/20 bg-primary/10">
            <div className="card-body p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-primary">{t('entry.delete.archive')}</h3>
                  <p className="mt-1 text-sm opacity-70">{t('entry.delete.archiveDescription')}</p>
                </div>
                <Button variant="default" onClick={handleArchive} disabled={isProcessing}>
                  {t('entry.delete.archive')}
                </Button>
              </div>
            </div>
          </div>

          {/* Delete Permanently Option (Destructive) */}
          <div className="card border border-error/20 bg-error/10">
            <div className="card-body p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-error">{t('entry.delete.deletePermanent')}</h3>
                  <p className="mt-1 text-sm opacity-70">
                    {t('entry.delete.deletePermanentDescription')}
                  </p>
                </div>
                <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
                  {t('entry.delete.deletePermanent')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
            {t('entry.delete.cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
