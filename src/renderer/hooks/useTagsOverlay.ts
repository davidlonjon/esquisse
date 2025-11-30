import { useCallback, useMemo, useState } from 'react';

import { router } from '@/router';
import { useEntryStore } from '@features/entries/entries.store';
import type { Entry } from '@shared/types';

export interface TagWithCount {
  tag: string;
  count: number;
}

export function useTagsOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(0);
  const [focusedTagIndex, setFocusedTagIndex] = useState(0);
  const [focusArea, setFocusArea] = useState<'tags' | 'entries'>('tags');

  const entries = useEntryStore((state) => state.entries);
  const setCurrentEntryId = useEntryStore((state) => state.setCurrentEntryId);
  const toggleFavorite = useEntryStore((state) => state.toggleFavorite);

  // Extract all unique tags with counts
  const tagsWithCounts = useMemo<TagWithCount[]>(() => {
    const tagMap = new Map<string, number>();
    entries.forEach((entry) => {
      entry.tags?.forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
      });
    });
    return Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => a.tag.localeCompare(b.tag));
  }, [entries]);

  // Filter entries by selected tags (AND logic - entry must have ALL selected tags)
  const filteredEntries = useMemo<Entry[]>(() => {
    if (selectedTags.length === 0) {
      return [];
    }
    return entries
      .filter((entry) => {
        if (!entry.tags || entry.tags.length === 0) return false;
        return selectedTags.every((tag) => entry.tags?.includes(tag));
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [entries, selectedTags]);

  const open = useCallback(() => {
    setIsOpen(true);
    setSelectedTags([]);
    setSelectedEntryIndex(0);
    setFocusedTagIndex(0);
    setFocusArea('tags');
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedTags([]);
    setSelectedEntryIndex(0);
    setFocusedTagIndex(0);
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((current) => {
      if (current.includes(tag)) {
        return current.filter((t) => t !== tag);
      }
      return [...current, tag];
    });
    setSelectedEntryIndex(0);
  }, []);

  const clearSelectedTags = useCallback(() => {
    setSelectedTags([]);
    setSelectedEntryIndex(0);
  }, []);

  // Tag navigation
  const focusPreviousTag = useCallback(() => {
    setFocusedTagIndex((current) => Math.max(0, current - 1));
  }, []);

  const focusNextTag = useCallback(() => {
    setFocusedTagIndex((current) => Math.min(tagsWithCounts.length - 1, current + 1));
  }, [tagsWithCounts.length]);

  const selectFocusedTag = useCallback(() => {
    const tagItem = tagsWithCounts[focusedTagIndex];
    if (tagItem) {
      toggleTag(tagItem.tag);
    }
  }, [tagsWithCounts, focusedTagIndex, toggleTag]);

  // Entry navigation
  const selectPreviousEntry = useCallback(() => {
    setSelectedEntryIndex((current) => Math.max(0, current - 1));
  }, []);

  const selectNextEntry = useCallback(() => {
    setSelectedEntryIndex((current) => Math.min(filteredEntries.length - 1, current + 1));
  }, [filteredEntries.length]);

  const navigateToSelectedEntry = useCallback(() => {
    const entry = filteredEntries[selectedEntryIndex];
    if (entry) {
      setCurrentEntryId(entry.id);
      close();
      void router.navigate({ to: '/' });
    }
  }, [filteredEntries, selectedEntryIndex, setCurrentEntryId, close]);

  // Switch focus between panels
  const switchFocusToEntries = useCallback(() => {
    if (filteredEntries.length > 0) {
      setFocusArea('entries');
    }
  }, [filteredEntries.length]);

  const switchFocusToTags = useCallback(() => {
    setFocusArea('tags');
  }, []);

  // Toggle favorite for an entry
  const handleToggleFavorite = useCallback(
    (entryId: string) => {
      void toggleFavorite(entryId);
    },
    [toggleFavorite]
  );

  // Click on entry to navigate
  const handleEntryClick = useCallback(
    (entryId: string) => {
      setCurrentEntryId(entryId);
      close();
      void router.navigate({ to: '/' });
    },
    [setCurrentEntryId, close]
  );

  const selectedEntry = filteredEntries[selectedEntryIndex] ?? null;
  const hasNoTags = tagsWithCounts.length === 0;
  const hasNoEntries = filteredEntries.length === 0 && selectedTags.length > 0;

  return {
    isOpen,
    open,
    close,
    tagsWithCounts,
    selectedTags,
    toggleTag,
    clearSelectedTags,
    filteredEntries,
    selectedEntryIndex,
    selectedEntry,
    focusedTagIndex,
    focusArea,
    focusPreviousTag,
    focusNextTag,
    selectFocusedTag,
    selectPreviousEntry,
    selectNextEntry,
    navigateToSelectedEntry,
    switchFocusToEntries,
    switchFocusToTags,
    handleToggleFavorite,
    handleEntryClick,
    hasNoTags,
    hasNoEntries,
  };
}
