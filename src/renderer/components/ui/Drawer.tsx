import { X } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';
import { useOnClickOutside } from '@hooks/useOnClickOutside';
import { cn } from '@lib/utils';
import { useHotkeysContext } from '@providers/hotkeys-provider';
import { Button } from '@ui';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Drawer({ isOpen, onClose, children, className, title }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { openModal, closeModal } = useHotkeysContext();
  const [isVisible, setIsVisible] = useState(false);

  // Handle animation state
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      // Use requestAnimationFrame to avoid synchronous state update warning
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      timer = setTimeout(() => setIsVisible(false), 300); // Match transition duration
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen]);

  useOnClickOutside(panelRef, () => {
    onClose();
  });

  // Automatically disable global hotkeys when drawer opens
  useEffect(() => {
    if (isOpen) {
      openModal();
      return () => {
        closeModal();
      };
    }
  }, [isOpen, openModal, closeModal]);

  // Register Escape key handler
  useGlobalHotkeys(
    'escape',
    () => {
      onClose();
    },
    { enabled: true, enableOnFormTags: true }, // Always enabled, even in inputs
    false // Don't respect global enabled state
  );

  if (!isVisible && !isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex justify-end transition-opacity duration-300',
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      )}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={panelRef}
        className={cn(
          'relative h-full w-full max-w-md transform border-l border-base-200 bg-base-100 text-base-content shadow-xl transition-transform duration-300 ease-in-out dark:border-base-300/50 dark:bg-base-200',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-base-200 px-6 py-4 dark:border-base-300/50">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button
              variant="ghost"
              size="sm"
              shape="circle"
              onClick={onClose}
              aria-label="Close drawer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
