import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { SearchFilter } from '@shared/types/search.types';

import { FilterBar } from './FilterBar';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      const translations: Record<string, string> = {
        'search.filters.tag': 'Tag',
        'search.filters.mood': 'Mood',
        'search.filters.moods.happy': 'Happy',
        'search.filters.moods.good': 'Good',
        'search.filters.moods.neutral': 'Neutral',
        'search.filters.moods.bad': 'Bad',
        'search.filters.moods.sad': 'Sad',
        'search.filters.states.favorite': 'Favorite',
        'search.filters.states.archived': 'Archived',
        'common.any': 'Any',
        'common.noTags': 'No tags available',
        'common.clearFilters': 'Clear filters',
        'common.selected': `${options?.count || 0} selected`,
      };
      return translations[key] || key;
    },
  }),
}));

describe('FilterBar', () => {
  const defaultProps = {
    filters: {} as SearchFilter,
    onFiltersChange: vi.fn(),
    availableTags: ['work', 'personal', 'ideas'],
  };

  it('renders all filter controls', () => {
    render(<FilterBar {...defaultProps} />);

    expect(screen.getByText('Tag:')).toBeInTheDocument();
    expect(screen.getByText('Mood:')).toBeInTheDocument();
    expect(screen.getByText('Favorite')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('displays "Any" when no tags are selected', () => {
    render(<FilterBar {...defaultProps} />);

    // Tags dropdown shows "Any" - check for the summary element
    const tagsSummary = screen.getAllByText('Any')[0]; // First "Any" is from tags
    expect(tagsSummary).toBeInTheDocument();
  });

  it('displays selected count when tags are selected', () => {
    const filters: SearchFilter = {
      tags: ['work', 'personal'],
    };

    render(<FilterBar {...defaultProps} filters={filters} />);

    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('calls onFiltersChange when tag is toggled', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();

    render(<FilterBar {...defaultProps} onFiltersChange={onFiltersChange} />);

    // Click on "work" tag checkbox (details is auto-expanded in tests)
    const workCheckbox = screen.getByRole('checkbox', { name: /work/i });
    await user.click(workCheckbox);

    expect(onFiltersChange).toHaveBeenCalledWith({
      tags: ['work'],
    });
  });

  it('removes tag when unchecked', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    const filters: SearchFilter = {
      tags: ['work', 'personal'],
    };

    render(<FilterBar {...defaultProps} filters={filters} onFiltersChange={onFiltersChange} />);

    // Uncheck "work" tag
    const workCheckbox = screen.getByRole('checkbox', { name: /work/i });
    await user.click(workCheckbox);

    expect(onFiltersChange).toHaveBeenCalledWith({
      tags: ['personal'],
    });
  });

  it('removes tags array when last tag is unchecked', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    const filters: SearchFilter = {
      tags: ['work'],
    };

    render(<FilterBar {...defaultProps} filters={filters} onFiltersChange={onFiltersChange} />);

    // Uncheck "work" tag
    const workCheckbox = screen.getByRole('checkbox', { name: /work/i });
    await user.click(workCheckbox);

    expect(onFiltersChange).toHaveBeenCalledWith({
      tags: undefined,
    });
  });

  it('displays "No tags available" when availableTags is empty', () => {
    render(<FilterBar {...defaultProps} availableTags={[]} />);

    // Check that "No tags available" text is in the document
    expect(screen.getByText('No tags available')).toBeInTheDocument();
  });

  it('calls onFiltersChange when mood is selected', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();

    render(<FilterBar {...defaultProps} onFiltersChange={onFiltersChange} />);

    const moodSelect = screen.getByRole('combobox');
    await user.selectOptions(moodSelect, '5');

    expect(onFiltersChange).toHaveBeenCalledWith({
      mood: 5,
    });
  });

  it('clears mood when "Any" is selected', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    const filters: SearchFilter = {
      mood: 3,
    };

    render(<FilterBar {...defaultProps} filters={filters} onFiltersChange={onFiltersChange} />);

    const moodSelect = screen.getByRole('combobox');
    await user.selectOptions(moodSelect, '');

    expect(onFiltersChange).toHaveBeenCalledWith({
      mood: undefined,
    });
  });

  it('toggles favorite filter', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();

    render(<FilterBar {...defaultProps} onFiltersChange={onFiltersChange} />);

    const favoriteCheckbox = screen.getByRole('checkbox', { name: /favorite/i });
    await user.click(favoriteCheckbox);

    expect(onFiltersChange).toHaveBeenCalledWith({
      isFavorite: true,
    });
  });

  it('untoggle favorite filter when clicked again', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    const filters: SearchFilter = {
      isFavorite: true,
    };

    render(<FilterBar {...defaultProps} filters={filters} onFiltersChange={onFiltersChange} />);

    const favoriteCheckbox = screen.getByRole('checkbox', { name: /favorite/i });
    await user.click(favoriteCheckbox);

    expect(onFiltersChange).toHaveBeenCalledWith({
      isFavorite: false,
    });
  });

  it('toggles archived filter', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();

    render(<FilterBar {...defaultProps} onFiltersChange={onFiltersChange} />);

    const archivedCheckbox = screen.getByRole('checkbox', { name: /archived/i });
    await user.click(archivedCheckbox);

    expect(onFiltersChange).toHaveBeenCalledWith({
      isArchived: true,
    });
  });

  it('shows clear filters button when filters are active', () => {
    const filters: SearchFilter = {
      tags: ['work'],
      mood: 5,
      isFavorite: true,
    };

    render(<FilterBar {...defaultProps} filters={filters} />);

    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });

  it('hides clear filters button when no filters are active', () => {
    render(<FilterBar {...defaultProps} filters={{}} />);

    expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    const filters: SearchFilter = {
      tags: ['work'],
      mood: 5,
      isFavorite: true,
      isArchived: true,
    };

    render(<FilterBar {...defaultProps} filters={filters} onFiltersChange={onFiltersChange} />);

    const clearButton = screen.getByRole('button', { name: /clear filters/i });
    await user.click(clearButton);

    expect(onFiltersChange).toHaveBeenCalledWith({});
  });

  it('preserves other filters when toggling one filter', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    const filters: SearchFilter = {
      tags: ['work'],
      mood: 5,
    };

    render(<FilterBar {...defaultProps} filters={filters} onFiltersChange={onFiltersChange} />);

    // Toggle favorite
    const favoriteCheckbox = screen.getByRole('checkbox', { name: /favorite/i });
    await user.click(favoriteCheckbox);

    expect(onFiltersChange).toHaveBeenCalledWith({
      tags: ['work'],
      mood: 5,
      isFavorite: true,
    });
  });
});
