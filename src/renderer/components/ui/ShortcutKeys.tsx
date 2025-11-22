import { cn } from '@lib/utils';

interface ShortcutKeysProps {
  combo: string;
  className?: string;
}

export function ShortcutKeys({ combo, className }: ShortcutKeysProps) {
  // Split the combo string into individual keys
  // Matches:
  // - Symbols: ⌘, ⇧, ⌃, ⌥
  // - Keywords: Ctrl, Shift, Alt, Esc, Enter, Space, Backspace, Delete, Tab, Fn
  // - Everything else (excluding + and spaces): [^+ ]+
  const keys = combo.match(
    /(?:[⌘⇧⌃⌥]|Ctrl|Shift|Alt|Esc|Enter|Space|Backspace|Delete|Tab|Fn|[^+ ]+)/g
  ) || [combo];

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {keys.map((key, index) => (
        <kbd
          key={index}
          className={cn(
            'inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-base-content/20 bg-base-200/50 px-1.5 font-sans text-[11px] font-medium text-base-content/90 shadow-sm',
            // Make single characters square-ish
            key.length === 1 && 'w-5 px-0'
          )}
        >
          {key}
        </kbd>
      ))}
    </div>
  );
}
