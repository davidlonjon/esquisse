import { type LucideIcon } from 'lucide-react';
import { memo } from 'react';

import { cn } from '@lib/utils';
import { Tooltip } from '@ui';

interface BubbleMenuButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip?: string;
  shortcut?: string | null;
  'aria-label': string;
}

function BubbleMenuButtonComponent({
  icon: Icon,
  onClick,
  isActive = false,
  disabled = false,
  tooltip,
  shortcut,
  'aria-label': ariaLabel,
}: BubbleMenuButtonProps) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn('bubble-menu__button', isActive && 'is-active')}
      aria-label={ariaLabel}
      aria-pressed={isActive}
    >
      <Icon size={18} />
    </button>
  );

  if (!tooltip) {
    return button;
  }

  return (
    <Tooltip content={tooltip} shortcut={shortcut ?? undefined} position="top">
      {button}
    </Tooltip>
  );
}

export const BubbleMenuButton = memo(BubbleMenuButtonComponent);
