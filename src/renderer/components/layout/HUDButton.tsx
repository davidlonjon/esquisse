import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Tooltip } from '@ui';

interface HUDButtonProps {
  onClick: () => void;
  disabled?: boolean;
  tooltip: string;
  shortcut?: string;
  icon: LucideIcon;
  variant?: 'default' | 'favorite' | 'mode';
  isActive?: boolean;
  className?: string;
  children?: ReactNode;
  tooltipPosition?: 'top' | 'bottom' | 'bottom-left' | 'left' | 'right';
}

export function HUDButton({
  onClick,
  disabled = false,
  tooltip,
  shortcut,
  icon: Icon,
  variant = 'default',
  isActive = false,
  className,
  children,
  tooltipPosition = 'bottom',
}: HUDButtonProps) {
  const variantStyles = {
    default: 'text-base-content/40 hover:bg-base-200',
    favorite: isActive
      ? 'text-primary bg-primary/10 hover:bg-primary/20'
      : 'text-base-content/40 hover:text-primary',
    mode: isActive
      ? 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30 dark:text-emerald-400'
      : 'bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 dark:text-blue-400',
  };

  const button = (
    <button
      type="button"
      onClick={() => {
        if (!disabled) {
          onClick();
        }
      }}
      disabled={disabled}
      className={clsx(
        'flex items-center justify-center rounded-full px-2 py-1 transition',
        disabled ? 'opacity-40 cursor-not-allowed' : variantStyles[variant],
        className
      )}
    >
      <Icon
        className={clsx('h-4 w-4', variant === 'favorite' && isActive && 'fill-current heart-pop')}
      />
      {children}
    </button>
  );

  if (disabled) {
    return button;
  }

  return (
    <Tooltip content={tooltip} shortcut={shortcut} position={tooltipPosition}>
      {button}
    </Tooltip>
  );
}
