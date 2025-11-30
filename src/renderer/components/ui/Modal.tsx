import clsx from 'clsx';
import { type ReactNode, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';
import { useOnClickOutside } from '@hooks/useOnClickOutside';
import { useHotkeysContext } from '@providers/hotkeys-provider';

type ModalSize = 'sm' | 'md' | 'lg';
type ModalAlignment = 'center' | 'top';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
  align?: ModalAlignment;
  panelClassName?: string;
  overlayClassName?: string;
  disableOutsideClose?: boolean;
}

const SIZE_CLASS_MAP: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
};

const ALIGN_CLASS_MAP: Record<ModalAlignment, string> = {
  center: 'modal-middle',
  top: 'modal-top',
};

export function Modal({
  isOpen,
  onClose,
  children,
  size = 'md',
  align = 'center',
  panelClassName,
  overlayClassName,
  disableOutsideClose = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { openModal, closeModal } = useHotkeysContext();
  const { t } = useTranslation();

  useOnClickOutside(panelRef, () => {
    if (!disableOutsideClose) {
      onClose();
    }
  });

  // Automatically disable global hotkeys when modal opens
  useEffect(() => {
    if (isOpen) {
      openModal();
      return () => {
        closeModal();
      };
    }
  }, [isOpen, openModal, closeModal]);

  // Register Escape key handler (always enabled, even when global hotkeys are disabled)
  useGlobalHotkeys(
    'escape',
    () => {
      if (!disableOutsideClose) {
        onClose();
      }
    },
    { enabled: isOpen },
    false // Don't respect global enabled state
  );

  if (!isOpen) {
    return null;
  }

  return (
    <dialog open className={clsx('modal modal-open', ALIGN_CLASS_MAP[align])}>
      <div
        ref={panelRef}
        className={clsx(
          'modal-box w-full bg-base-100 text-base-content dark:bg-base-200 dark:text-base-content',
          SIZE_CLASS_MAP[size],
          panelClassName
        )}
      >
        {children}
      </div>

      {!disableOutsideClose && (
        <form method="dialog" className="modal-backdrop" onClick={onClose}>
          <button type="button" aria-label={t('common.actions.close')} />
        </form>
      )}

      {disableOutsideClose && (
        <div
          className={clsx('modal-backdrop pointer-events-none bg-transparent', overlayClassName)}
          aria-hidden="true"
        />
      )}
    </dialog>
  );
}
