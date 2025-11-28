import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react-dom';
import { type ReactNode, useEffect, useRef } from 'react';

import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';
import { cn } from '@lib/utils';

interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  anchorRef: React.RefObject<HTMLElement | HTMLDivElement | null>;
  className?: string;
}

export function Popover({ isOpen, onClose, children, anchorRef, className }: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  const { refs, floatingStyles } = useFloating({
    placement: 'bottom',
    middleware: [
      offset(8), // 8px gap from trigger
      flip(), // Flip to top if no space below
      shift({ padding: 8 }), // Keep within viewport with 8px padding
    ],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    refs.setReference(anchorRef.current);
  }, [anchorRef, refs]);

  // Custom outside click handler that excludes both popover and anchor
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Don't close if clicking inside popover
      if (popoverRef.current?.contains(target)) {
        return;
      }

      // Don't close if clicking on anchor (let anchor handle toggle)
      if (anchorRef.current?.contains(target)) {
        return;
      }

      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  useGlobalHotkeys('escape', onClose, { enabled: isOpen }, false);

  if (!isOpen) return null;

  return (
    <div
      ref={(node) => {
        refs.setFloating(node);
        (popoverRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      style={floatingStyles}
      className={cn(
        'z-50 rounded-lg border border-base-200 bg-base-100 p-4 shadow-lg dark:border-base-300/50 dark:bg-base-200',
        className
      )}
      onMouseDown={(e) => {
        // Prevent clicks inside the popover from closing it
        e.stopPropagation();
      }}
    >
      {children}
    </div>
  );
}
