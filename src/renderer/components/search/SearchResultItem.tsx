import clsx from 'clsx';
import type { Locale } from 'date-fns';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { memo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { SearchResult } from '@shared/types';

interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  locale: Locale;
}

export const SearchResultItem = memo(({ result, isSelected, locale }: SearchResultItemProps) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isSelected]);

  const formattedDate = format(new Date(result.createdAt), 'MMM d, yyyy · HH:mm', { locale });

  // Determine what to display
  const displayText = result.snippet?.text
    ? result.snippet.text
    : result.title || result.content.replace(/<[^>]*>?/gm, '').trim() || t('common.emptyEntry');

  // Highlight matched text if we have snippet info
  const renderText = () => {
    if (!result.snippet) {
      return (
        <p className="text-sm text-base-content/80 leading-relaxed line-clamp-3">{displayText}</p>
      );
    }

    const { text, highlightStart, highlightEnd } = result.snippet;
    const before = text.substring(0, highlightStart);
    const match = text.substring(highlightStart, highlightEnd);
    const after = text.substring(highlightEnd);

    return (
      <p className="text-sm text-base-content/80 leading-relaxed line-clamp-3">
        {before}
        <mark className="bg-warning/30 text-base-content">{match}</mark>
        {after}
      </p>
    );
  };

  return (
    <div
      ref={itemRef}
      className={clsx(
        'rounded-xl border px-4 py-3 bg-card/80 transition-all',
        isSelected
          ? 'border-primary bg-primary/5 shadow-warm-md ring-1 ring-primary/40'
          : 'border-transparent hover:bg-base-200/80 hover:border-primary/20 hover:shadow-warm-sm'
      )}
    >
      <div className="flex items-start gap-3">
        <FileText className="h-4 w-4 mt-1 text-primary shrink-0" />
        <div className="min-w-0 flex-1">
          {renderText()}
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-xs text-base-content/50">{formattedDate}</p>
            {result.matchedField && (
              <>
                <span className="text-xs text-base-content/30">·</span>
                <span className="text-xs text-base-content/40 capitalize">
                  {result.matchedField}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

SearchResultItem.displayName = 'SearchResultItem';
