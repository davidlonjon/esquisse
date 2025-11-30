import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { router } from '@/router';
import { useEntryStore } from '@features/entries/entries.store';
import { useJournalStore } from '@features/journals/journals.store';
import type { SearchFilter, SearchResult } from '@shared/types';

const DEBOUNCE_MS = 700;

export function useSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [filters, setFilters] = useState<SearchFilter>({});
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentJournalId = useJournalStore((state) => state.currentJournalId);
  const searchState = useEntryStore((state) => state.search);
  const entries = useEntryStore((state) => state.entries);
  const advancedSearch = useEntryStore((state) => state.advancedSearch);
  const clearSearch = useEntryStore((state) => state.clearSearch);
  const setCurrentEntryId = useEntryStore((state) => state.setCurrentEntryId);

  // Extract all unique tags from entries
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((entry) => {
      entry.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [entries]);

  const searchResults = useMemo<SearchResult[]>(() => searchState.results, [searchState.results]);

  const open = useCallback(() => {
    setIsOpen(true);
    setSelectedIndex(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setInputValue('');
    setFilters({});
    clearSearch();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, [clearSearch]);

  const selectPrevious = useCallback(() => {
    setSelectedIndex((current) => Math.max(0, current - 1));
  }, []);

  const selectNext = useCallback(() => {
    setSelectedIndex((current) => Math.min(searchResults.length - 1, current + 1));
  }, [searchResults.length]);

  const navigateToSelected = useCallback(() => {
    const result = searchResults[selectedIndex];
    if (result) {
      setCurrentEntryId(result.id);
      close();
      void router.navigate({ to: '/' });
    }
  }, [searchResults, selectedIndex, setCurrentEntryId, close]);

  // Perform search with current query and filters
  const performSearch = useCallback(
    (query: string, currentFilters: SearchFilter) => {
      // Build search query - only full text, no filter syntax
      const trimmedQuery = query.trim();

      // Clear results if both query and all filters are empty
      if (!trimmedQuery && Object.keys(currentFilters).length === 0) {
        clearSearch();
        return;
      }

      // Execute search with separate query and filters
      void advancedSearch(trimmedQuery, currentJournalId ?? undefined, currentFilters);
    },
    [advancedSearch, clearSearch, currentJournalId]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      setSelectedIndex(0);

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // If query and filters are empty, clear immediately without debounce
      if (!value.trim() && Object.keys(filters).length === 0) {
        clearSearch();
        debounceTimerRef.current = null;
        return;
      }

      // Debounce the search
      debounceTimerRef.current = setTimeout(() => {
        performSearch(value, filters);
      }, DEBOUNCE_MS);
    },
    [performSearch, filters, clearSearch]
  );

  const handleFiltersChange = useCallback(
    (newFilters: SearchFilter) => {
      setFilters(newFilters);
      setSelectedIndex(0);

      // Immediately search when filters change (no debounce needed for UI controls)
      performSearch(inputValue, newFilters);
    },
    [performSearch, inputValue]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const selectedResult = searchResults[selectedIndex] ?? null;
  const isLoading = searchState.status.status === 'loading';
  const hasError = searchState.status.status === 'error';
  const errorMessage = searchState.status.error ?? undefined;

  return {
    isOpen,
    open,
    close,
    inputValue,
    handleInputChange,
    filters,
    handleFiltersChange,
    availableTags,
    searchResults,
    selectedIndex,
    selectedResult,
    selectPrevious,
    selectNext,
    navigateToSelected,
    isLoading,
    hasError,
    errorMessage,
    isEmpty: searchResults.length === 0 && inputValue.trim().length > 0 && !isLoading,
  };
}
