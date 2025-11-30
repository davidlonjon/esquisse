import clsx from 'clsx';
import { useMemo } from 'react';

import { tokenizeSearchQuery } from '@lib/search-tokenizer';
import type { SearchToken } from '@lib/search-tokenizer';

interface HighlightedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  className?: string;
}

export function HighlightedSearchInput({
  value,
  onChange,
  placeholder,
  autoFocus = false,
  className,
}: HighlightedSearchInputProps) {
  // Tokenize the query for highlighting
  const tokens = useMemo(() => tokenizeSearchQuery(value), [value]);

  // Render a token with appropriate styling
  const renderToken = (token: SearchToken, index: number) => {
    const baseClasses = 'whitespace-pre';

    switch (token.type) {
      case 'filter-keyword':
        return (
          <span
            key={index}
            className={clsx(baseClasses, 'bg-primary/10 text-primary rounded px-0.5')}
          >
            {token.text}
          </span>
        );
      case 'filter-value':
        return (
          <span
            key={index}
            className={clsx(baseClasses, 'bg-accent/10 text-accent rounded px-0.5')}
          >
            {token.text}
          </span>
        );
      case 'text':
      default:
        return (
          <span key={index} className={clsx(baseClasses, 'text-base-content')}>
            {token.text}
          </span>
        );
    }
  };

  return (
    <div className={clsx('relative', className)}>
      {/* Highlighted overlay - positioned absolutely on top of input */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center px-4 py-3 pr-10"
        aria-hidden="true"
      >
        <div className="whitespace-pre-wrap break-words">{tokens.map(renderToken)}</div>
      </div>

      {/* Actual input - transparent text but visible cursor */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={clsx(
          'relative z-10 w-full px-4 py-3 pr-10',
          'rounded-lg bg-base-200',
          'text-transparent caret-base-content',
          'placeholder:text-base-content/40',
          'focus:outline-none focus:ring-2 focus:ring-primary',
          'selection:bg-primary/30'
        )}
        style={{
          caretColor: 'hsl(var(--bc))',
        }}
      />
    </div>
  );
}
