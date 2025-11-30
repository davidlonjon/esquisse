import { enUS, fr } from 'date-fns/locale';
import { Loader2, Search, X } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';
import { useHotkeysContext } from '@providers/hotkeys-provider';
import type { SearchResult } from '@shared/types';
import type { SearchFilter } from '@shared/types/search.types';

import { FilterBar } from './FilterBar';
import { SearchResultItem } from './SearchResultItem';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  filters: SearchFilter;
  onFiltersChange: (filters: SearchFilter) => void;
  availableTags: string[];
  searchResults: SearchResult[];
  selectedIndex: number;
  isEmpty: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  onSelectPrevious: () => void;
  onSelectNext: () => void;
  onNavigateToSelected: () => void;
}

export function SearchOverlay({
  isOpen,
  onClose,
  inputValue,
  onInputChange,
  filters,
  onFiltersChange,
  availableTags,
  searchResults,
  selectedIndex,
  isEmpty,
  isLoading,
  hasError,
  errorMessage,
  onSelectPrevious,
  onSelectNext,
  onNavigateToSelected,
}: SearchOverlayProps) {
  const { t, i18n } = useTranslation();
  const { openModal, closeModal } = useHotkeysContext();
  const locale = i18n.language === 'fr' ? fr : enUS;

  useEffect(() => {
    if (isOpen) {
      openModal();
      return () => {
        closeModal();
      };
    }
  }, [isOpen, openModal, closeModal]);

  // Escape to clear input first, then close on second press
  useGlobalHotkeys(
    'escape',
    () => {
      if (inputValue.trim()) {
        onInputChange('');
      } else {
        onClose();
      }
    },
    { enabled: isOpen, enableOnFormTags: true },
    false
  );

  // Arrow navigation - enable on form tags so they work when input is focused
  useGlobalHotkeys(
    'arrowup',
    (e) => {
      e.preventDefault();
      onSelectPrevious();
    },
    { enabled: isOpen && searchResults.length > 0, enableOnFormTags: true },
    false
  );

  useGlobalHotkeys(
    'arrowdown',
    (e) => {
      e.preventDefault();
      onSelectNext();
    },
    { enabled: isOpen && searchResults.length > 0, enableOnFormTags: true },
    false
  );

  // Enter to navigate - enable on form tags so it works when input is focused
  useGlobalHotkeys(
    'enter',
    (e) => {
      e.preventDefault();
      onNavigateToSelected();
    },
    { enabled: isOpen && searchResults.length > 0, enableOnFormTags: true },
    false
  );

  if (!isOpen) {
    return null;
  }

  const showEmptyState = isEmpty && !isLoading && !hasError;
  const showResults = searchResults.length > 0 && !hasError;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-base-100/95 backdrop-blur-sm pt-20">
      <div
        className="relative w-full max-w-4xl mx-auto px-6 flex flex-col"
        style={{ height: 'calc(100vh - 10rem)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-base-content">{t('search.title')}</h2>
            {searchResults.length > 0 && (
              <span className="text-sm text-base-content/50">({searchResults.length})</span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-base-200 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-base-content/70" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-6 flex-shrink-0">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full px-4 py-3 pr-10 rounded-lg bg-base-200 text-base-content placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {inputValue && !isLoading && (
              <button
                onClick={() => onInputChange('')}
                className="p-1 rounded hover:bg-base-300 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-base-content/50" />
              </button>
            )}
            {isLoading && <Loader2 className="h-5 w-5 text-base-content/50 animate-spin" />}
          </div>
        </div>

        {/* Filter controls */}
        <div className="mb-6 flex-shrink-0">
          <FilterBar
            filters={filters}
            onFiltersChange={onFiltersChange}
            availableTags={availableTags}
          />
        </div>

        {/* Results area - fixed height */}
        <div className="flex-1 min-h-0 mb-6">
          {/* Error state */}
          {hasError && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-4 text-error/50" />
              <p className="text-error mb-2">{t('search.error')}</p>
              {errorMessage && <p className="text-sm text-base-content/40">{errorMessage}</p>}
            </div>
          )}

          {/* Empty state */}
          {showEmptyState && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-4 text-base-content/20" />
              <p className="text-base-content/60 mb-2">{t('search.noResults')}</p>
              <p className="text-sm text-base-content/40">{t('search.noResultsHint')}</p>
            </div>
          )}

          {/* Results list */}
          {showResults && (
            <div className="space-y-2 h-full overflow-y-auto p-1 -m-1">
              {searchResults.map((result, index) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  isSelected={index === selectedIndex}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>

        {/* Keyboard hints */}
        <p className="text-center text-xs text-base-content/40 flex-shrink-0">
          {showResults
            ? `↑ ↓ navigate · Enter select · Esc ${inputValue.trim() ? 'clear' : 'close'}`
            : `Esc ${inputValue.trim() ? 'clear' : 'close'}`}
        </p>
      </div>
    </div>
  );
}
