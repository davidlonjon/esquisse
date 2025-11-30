import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEntryStore } from '@features/entries/entries.store';
import { useJournalStore } from '@features/journals/journals.store';
import type { SearchFilter, SearchResult } from '@shared/types';

import { useSearch } from './useSearch';

// Mock stores
vi.mock('@features/entries/entries.store');
vi.mock('@features/journals/journals.store');
vi.mock('@/router', () => ({
  router: {
    navigate: vi.fn(),
  },
}));

describe('useSearch', () => {
  const mockAdvancedSearch = vi.fn();
  const mockClearSearch = vi.fn();
  const mockSetCurrentEntryId = vi.fn();

  const mockSearchResults: SearchResult[] = [
    {
      id: '1',
      journalId: 'journal-1',
      title: 'Test Entry 1',
      content: 'Test content 1',
      tags: ['work'],
      status: 'active' as const,
      isFavorite: false,
      mood: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      journalId: 'journal-1',
      title: 'Test Entry 2',
      content: 'Test content 2',
      tags: ['personal'],
      status: 'active' as const,
      isFavorite: true,
      mood: 5,
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup entry store mock
    vi.mocked(useEntryStore).mockImplementation((selector) => {
      const state = {
        search: {
          results: [],
          status: { status: 'idle' as const },
        },
        entries: [
          {
            id: '1',
            journalId: 'journal-1',
            title: 'Entry 1',
            content: 'Content',
            tags: ['work', 'ideas'],
            status: 'active' as const,
            isFavorite: false,
            mood: null,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
          {
            id: '2',
            journalId: 'journal-1',
            title: 'Entry 2',
            content: 'Content',
            tags: ['personal', 'ideas'],
            status: 'active' as const,
            isFavorite: false,
            mood: null,
            createdAt: '2024-01-02T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
          },
        ],
        advancedSearch: mockAdvancedSearch,
        clearSearch: mockClearSearch,
        setCurrentEntryId: mockSetCurrentEntryId,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return selector(state as any);
    });

    // Setup journal store mock
    vi.mocked(useJournalStore).mockImplementation((selector) => {
      const state = {
        currentJournalId: 'journal-1',
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return selector(state as any);
    });
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useSearch());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.inputValue).toBe('');
    expect(result.current.filters).toEqual({});
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.selectedIndex).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
  });

  it('extracts available tags from entries', () => {
    const { result } = renderHook(() => useSearch());

    expect(result.current.availableTags).toEqual(['ideas', 'personal', 'work']);
  });

  it('opens and closes search overlay', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.inputValue).toBe('');
    expect(result.current.filters).toEqual({});
    expect(mockClearSearch).toHaveBeenCalled();
  });

  it('debounces search input changes', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.handleInputChange('test query');
    });

    expect(mockAdvancedSearch).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(700);
    });

    await waitFor(() => {
      expect(mockAdvancedSearch).toHaveBeenCalledWith('test query', 'journal-1', {});
    });

    vi.useRealTimers();
  });

  it('clears search when input is empty', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.handleInputChange('');
    });

    expect(mockClearSearch).toHaveBeenCalled();
    expect(mockAdvancedSearch).not.toHaveBeenCalled();
  });

  it('triggers immediate search when filters change', () => {
    const { result } = renderHook(() => useSearch());

    const newFilters: SearchFilter = {
      tags: ['work'],
      mood: 5,
    };

    act(() => {
      result.current.handleFiltersChange(newFilters);
    });

    expect(result.current.filters).toEqual(newFilters);
    expect(mockAdvancedSearch).toHaveBeenCalledWith('', 'journal-1', newFilters);
  });

  it('combines text input and filters in search', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSearch());

    // Set filters first
    act(() => {
      result.current.handleFiltersChange({ tags: ['work'] });
    });

    // Then add text input
    act(() => {
      result.current.handleInputChange('test query');
    });

    act(() => {
      vi.advanceTimersByTime(700);
    });

    await waitFor(() => {
      expect(mockAdvancedSearch).toHaveBeenCalledWith('test query', 'journal-1', {
        tags: ['work'],
      });
    });

    vi.useRealTimers();
  });

  it('navigates to previous result', () => {
    vi.mocked(useEntryStore).mockImplementation((selector) => {
      const state = {
        search: {
          results: mockSearchResults,
          status: { status: 'success' as const },
        },
        entries: [],
        advancedSearch: mockAdvancedSearch,
        clearSearch: mockClearSearch,
        setCurrentEntryId: mockSetCurrentEntryId,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return selector(state as any);
    });

    const { result } = renderHook(() => useSearch());

    // Start at index 1
    act(() => {
      result.current.selectNext();
    });

    expect(result.current.selectedIndex).toBe(1);

    // Navigate to previous
    act(() => {
      result.current.selectPrevious();
    });

    expect(result.current.selectedIndex).toBe(0);

    // Can't go below 0
    act(() => {
      result.current.selectPrevious();
    });

    expect(result.current.selectedIndex).toBe(0);
  });

  it('navigates to next result', () => {
    vi.mocked(useEntryStore).mockImplementation((selector) => {
      const state = {
        search: {
          results: mockSearchResults,
          status: { status: 'success' as const },
        },
        entries: [],
        advancedSearch: mockAdvancedSearch,
        clearSearch: mockClearSearch,
        setCurrentEntryId: mockSetCurrentEntryId,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return selector(state as any);
    });

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.selectNext();
    });

    expect(result.current.selectedIndex).toBe(1);

    // Can't go beyond last result
    act(() => {
      result.current.selectNext();
    });

    expect(result.current.selectedIndex).toBe(1);
  });

  it('navigates to selected result and closes overlay', async () => {
    const { router } = await import('@/router');

    vi.mocked(useEntryStore).mockImplementation((selector) => {
      const state = {
        search: {
          results: mockSearchResults,
          status: { status: 'success' as const },
        },
        entries: [],
        advancedSearch: mockAdvancedSearch,
        clearSearch: mockClearSearch,
        setCurrentEntryId: mockSetCurrentEntryId,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return selector(state as any);
    });

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.open();
      result.current.selectNext();
    });

    expect(result.current.selectedIndex).toBe(1);

    act(() => {
      result.current.navigateToSelected();
    });

    expect(mockSetCurrentEntryId).toHaveBeenCalledWith('2');
    expect(router.navigate).toHaveBeenCalledWith({ to: '/' });
    expect(result.current.isOpen).toBe(false);
  });

  it('resets selected index when input changes', async () => {
    vi.useFakeTimers();

    vi.mocked(useEntryStore).mockImplementation((selector) => {
      const state = {
        search: {
          results: mockSearchResults,
          status: { status: 'success' as const },
        },
        entries: [],
        advancedSearch: mockAdvancedSearch,
        clearSearch: mockClearSearch,
        setCurrentEntryId: mockSetCurrentEntryId,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return selector(state as any);
    });

    const { result } = renderHook(() => useSearch());

    // Select second result
    act(() => {
      result.current.selectNext();
    });

    expect(result.current.selectedIndex).toBe(1);

    // Change input
    act(() => {
      result.current.handleInputChange('new query');
    });

    expect(result.current.selectedIndex).toBe(0);

    vi.useRealTimers();
  });

  it('resets selected index when filters change', () => {
    vi.mocked(useEntryStore).mockImplementation((selector) => {
      const state = {
        search: {
          results: mockSearchResults,
          status: { status: 'success' as const },
        },
        entries: [],
        advancedSearch: mockAdvancedSearch,
        clearSearch: mockClearSearch,
        setCurrentEntryId: mockSetCurrentEntryId,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return selector(state as any);
    });

    const { result } = renderHook(() => useSearch());

    // Select second result
    act(() => {
      result.current.selectNext();
    });

    expect(result.current.selectedIndex).toBe(1);

    // Change filters
    act(() => {
      result.current.handleFiltersChange({ tags: ['work'] });
    });

    expect(result.current.selectedIndex).toBe(0);
  });

  it('shows isEmpty state correctly', () => {
    vi.mocked(useEntryStore).mockImplementation((selector) => {
      const state = {
        search: {
          results: [],
          status: { status: 'success' as const },
        },
        entries: [],
        advancedSearch: mockAdvancedSearch,
        clearSearch: mockClearSearch,
        setCurrentEntryId: mockSetCurrentEntryId,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return selector(state as any);
    });

    const { result } = renderHook(() => useSearch());

    // Empty with no query
    expect(result.current.isEmpty).toBe(false);

    // Empty with query
    act(() => {
      result.current.handleInputChange('test');
    });

    expect(result.current.isEmpty).toBe(true);
  });
});
