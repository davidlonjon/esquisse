import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TimelineFeed } from './TimelineFeed';

// Mock hooks and stores
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback || key }),
}));

// Mock the store with default values
const mockLoadEntries = vi.fn();
vi.mock('@features/entries/entries.store', () => ({
  useEntryStore: (selector: (state: unknown) => unknown) => {
    const state = {
      entries: [],
      loadEntries: mockLoadEntries,
    };
    return selector(state);
  },
}));

describe('TimelineFeed', () => {
  it('renders empty state when no entries', () => {
    render(<TimelineFeed />);

    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('No entries found. Start writing!')).toBeInTheDocument();
    expect(mockLoadEntries).toHaveBeenCalled();
  });
});
