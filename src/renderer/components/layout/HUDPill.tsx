import { forwardRef } from 'react';

import { cn } from '@lib/utils';

interface HUDPillProps {
  label: string;
  onClick?: () => void;
  className?: string;
}

export const HUDPill = forwardRef<HTMLDivElement, HUDPillProps>(
  ({ label, onClick, className }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          'rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-base-content/60 backdrop-blur-sm',
          onClick &&
            'pointer-events-auto cursor-pointer transition-colors hover:bg-background/90 hover:text-base-content/80',
          className
        )}
      >
        {label}
      </div>
    );
  }
);

HUDPill.displayName = 'HUDPill';
