import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TimelineFeed } from './TimelineFeed';

// Mock hooks and stores
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback || key }),
}));

// Mock useGlobalHotkeys
vi.mock('@hooks/useGlobalHotkeys', () => ({
  useGlobalHotkeys: vi.fn(),
}));

// Mock router
vi.mock('@/router', () => ({
  router: {
    navigate: vi.fn(),
  },
}));

// Mock components
vi.mock('@components/dialogs', () => ({
  DeleteEntryDialog: () => <div data-testid="delete-dialog" />,
}));

// Mock the store with default values
const mockLoadEntries = vi.fn();
const mockToggleFavorite = vi.fn();
const mockSetCurrentEntryId = vi.fn();

vi.mock('@features/entries/entries.store', () => ({
  useEntryStore: (selector?: (state: unknown) => unknown) => {
    const state = {
      entries: [],
      loadEntries: mockLoadEntries,
      toggleFavorite: mockToggleFavorite,
      setCurrentEntryId: mockSetCurrentEntryId,
      deleteEntry: vi.fn(),
      archiveEntry: vi.fn(),
    };
    return selector ? selector(state) : state;
  },
}));

describe('TimelineFeed', () => {
  it('renders empty state when no entries', () => {
    render(<TimelineFeed filter="all" />);

    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('No entries found. Start writing!')).toBeInTheDocument();
    expect(mockLoadEntries).toHaveBeenCalled();
  });
});
