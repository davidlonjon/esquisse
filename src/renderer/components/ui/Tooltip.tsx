import clsx from 'clsx';
import { ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

import { ShortcutKeys } from './ShortcutKeys';

interface TooltipProps {
  /** The element that triggers the tooltip */
  children: ReactNode;
  /** The main tooltip content/description */
  content: string;
  /** Optional keyboard shortcut to display */
  shortcut?: string;
  /** Tooltip position relative to trigger element */
  position?: 'top' | 'bottom' | 'bottom-left' | 'left' | 'right';
  /** Delay before showing tooltip in ms */
  delay?: number;
}

export function Tooltip({
  children,
  content,
  shortcut,
  position = 'bottom',
  delay = 500,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  const showTooltip = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay]);

  const handleClick = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  // Calculate tooltip position based on trigger element
  useEffect(() => {
    if (!isVisible || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top - 8; // 8px gap (mb-2)
        left = rect.left + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + 8; // 8px gap (mt-2)
        left = rect.left + rect.width / 2;
        break;
      case 'bottom-left':
        top = rect.bottom + 8;
        left = rect.left;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - 8;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + 8;
        break;
    }

    // Use functional update to avoid setting state if position hasn't changed
    setTooltipPosition((prev) => {
      if (prev.top === top && prev.left === left) return prev;
      return { top, left };
    });
  }, [isVisible, position]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    'bottom-left': '',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  };

  const tooltipContent = isVisible ? (
    <div
      role="tooltip"
      className={clsx(
        'pointer-events-none fixed z-[100] whitespace-nowrap',
        positionClasses[position]
      )}
      style={{ top: `${tooltipPosition.top}px`, left: `${tooltipPosition.left}px` }}
    >
      <div className="rounded-lg bg-neutral-800 px-3 py-1.5 dark:bg-neutral-700">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white">{content}</span>
          {shortcut && <ShortcutKeys combo={shortcut} size="sm" />}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onClick={handleClick}
    >
      {children}
      {tooltipContent && createPortal(tooltipContent, document.body)}
    </div>
  );
}
