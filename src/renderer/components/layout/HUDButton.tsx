import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface HUDButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  icon: LucideIcon;
  variant?: 'default' | 'favorite' | 'mode';
  isActive?: boolean;
  className?: string;
  children?: ReactNode;
}

export function HUDButton({
  onClick,
  disabled = false,
  title,
  icon: Icon,
  variant = 'default',
  isActive = false,
  className,
  children,
}: HUDButtonProps) {
  const variantStyles = {
    default: 'text-base-content/40 hover:bg-base-200',
    favorite: isActive
      ? 'text-error bg-error/10 hover:bg-error/20'
      : 'text-base-content/40 hover:text-error',
    mode: isActive
      ? 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30 dark:text-emerald-400'
      : 'bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 dark:text-blue-400',
  };

  return (
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
      title={title}
    >
      <Icon className={clsx('h-4 w-4', variant === 'favorite' && isActive && 'fill-current')} />
      {children}
    </button>
  );
}
