import clsx from 'clsx';
import { ReactNode, useState, useRef, useEffect } from 'react';

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

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

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
    >
      {children}

      {isVisible && (
        <div
          className={clsx(
            'pointer-events-none absolute z-50 whitespace-nowrap',
            positionClasses[position]
          )}
        >
          <div className="rounded-md border border-base-300 bg-base-200 px-3 py-2 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-sm text-base-content">{content}</span>
              {shortcut && <ShortcutKeys combo={shortcut} size="sm" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
