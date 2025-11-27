import { cn } from '@lib/utils';

interface ShortcutKeysProps {
  combo: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function ShortcutKeys({ combo, className, size = 'md' }: ShortcutKeysProps) {
  // Split the combo string into individual keys
  // Matches:
  // - Symbols: ⌘, ⇧, ⌃, ⌥
  // - Keywords: Ctrl, Shift, Alt, Esc, Enter, Space, Backspace, Delete, Tab, Fn
  // - Everything else (excluding + and spaces): [^+ ]+
  const keys = combo.match(
    /(?:[⌘⇧⌃⌥]|Ctrl|Shift|Alt|Esc|Enter|Space|Backspace|Delete|Tab|Fn|[^+ ]+)/g
  ) || [combo];

  const sizeClasses = {
    sm: {
      container: 'gap-0.5',
      kbd: 'h-4 min-w-[16px] px-1 text-[10px]',
      square: 'w-4 px-0',
    },
    md: {
      container: 'gap-1',
      kbd: 'h-5 min-w-[20px] px-1.5 text-[11px]',
      square: 'w-5 px-0',
    },
  };

  return (
    <div className={cn('flex items-center', sizeClasses[size].container, className)}>
      {keys.map((key, index) => (
        <kbd
          key={index}
          className={cn(
            'inline-flex items-center justify-center rounded font-sans font-medium',
            size === 'sm'
              ? 'border border-white/20 bg-white/10 text-white/90'
              : 'border border-base-content/20 bg-base-200/50 text-base-content/90 shadow-sm',
            sizeClasses[size].kbd,
            // Make single characters square-ish
            key.length === 1 && sizeClasses[size].square
          )}
        >
          {key}
        </kbd>
      ))}
    </div>
  );
}
