import clsx from 'clsx';
import { ReactNode, useState, useRef, useEffect, useCallback } from 'react';

import { ShortcutKeys } from './ShortcutKeys';

interface TooltipProps {
  /** The element that triggers the tooltip */
  children: ReactNode;
  /** The main tooltip content/description */
  content: string;
  /** Optional keyboard shortcut to display */
  shortcut?: string;
  /** Tooltip position relative to trigger element */
  position?: 'top' | 'bottom' | 'left' | 'right';
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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

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

      {isVisible && (
        <div
          role="tooltip"
          className={clsx(
            'pointer-events-none absolute z-50 whitespace-nowrap',
            positionClasses[position]
          )}
        >
          <div className="rounded-lg bg-neutral-800 px-3 py-1.5 dark:bg-neutral-700">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white">{content}</span>
              {shortcut && <ShortcutKeys combo={shortcut} size="sm" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
