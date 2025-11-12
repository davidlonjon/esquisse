import clsx from 'clsx';
import { type ReactNode, useEffect, useRef } from 'react';

import { useOnClickOutside } from '@hooks/useOnClickOutside';

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
  center: 'items-center justify-center',
  top: 'items-start justify-center pt-16',
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

  useOnClickOutside(panelRef, () => {
    if (!disableOutsideClose) {
      onClose();
    }
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={clsx('fixed inset-0 z-50 flex px-4 py-6 sm:py-10', ALIGN_CLASS_MAP[align])}>
      <div
        className={clsx(
          'absolute inset-0 bg-background/70 backdrop-blur-xl transition-opacity',
          overlayClassName
        )}
        onClick={() => {
          if (!disableOutsideClose) {
            onClose();
          }
        }}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={clsx('relative z-10 w-full', SIZE_CLASS_MAP[size], panelClassName)}
      >
        {children}
      </div>
    </div>
  );
}
