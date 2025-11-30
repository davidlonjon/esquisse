import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { SearchFilter } from '@shared/types/search.types';

interface FilterBarProps {
  filters: SearchFilter;
  onFiltersChange: (filters: SearchFilter) => void;
  availableTags: string[];
}

export function FilterBar({ filters, onFiltersChange, availableTags }: FilterBarProps) {
  const { t } = useTranslation();

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];

    onFiltersChange({ ...filters, tags: newTags.length > 0 ? newTags : undefined });
  };

  const handleMoodChange = (mood: string) => {
    const moodValue = mood === '' ? undefined : (Number(mood) as 1 | 2 | 3 | 4 | 5);
    onFiltersChange({ ...filters, mood: moodValue });
  };

  const handleFavoriteToggle = () => {
    onFiltersChange({ ...filters, isFavorite: !filters.isFavorite });
  };

  const handleArchivedToggle = () => {
    onFiltersChange({ ...filters, isArchived: !filters.isArchived });
  };

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters =
    (filters.tags && filters.tags.length > 0) ||
    filters.mood !== undefined ||
    filters.isFavorite ||
    filters.isArchived;

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-base-200 rounded-lg">
      {/* Tags dropdown */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-base-content/70">
          {t('search.filters.tag')}:
        </label>
        <details className="dropdown">
          <summary className="btn btn-xs btn-ghost">
            {filters.tags && filters.tags.length > 0
              ? t('common.selected', { count: filters.tags.length })
              : t('common.any')}
          </summary>
          <ul className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow max-h-60 overflow-y-auto">
            {availableTags.length === 0 ? (
              <li className="text-xs text-base-content/40 px-2 py-1">{t('common.noTags')}</li>
            ) : (
              availableTags.map((tag) => (
                <li key={tag}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs"
                      checked={filters.tags?.includes(tag) || false}
                      onChange={() => handleTagToggle(tag)}
                    />
                    <span className="text-sm">{tag}</span>
                  </label>
                </li>
              ))
            )}
          </ul>
        </details>
      </div>

      {/* Mood dropdown */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-base-content/70">
          {t('search.filters.mood')}:
        </label>
        <select
          className="select select-xs select-ghost"
          value={filters.mood || ''}
          onChange={(e) => handleMoodChange(e.target.value)}
        >
          <option value="">{t('common.any')}</option>
          <option value="5">{t('search.filters.moods.happy')}</option>
          <option value="4">{t('search.filters.moods.good')}</option>
          <option value="3">{t('search.filters.moods.neutral')}</option>
          <option value="2">{t('search.filters.moods.bad')}</option>
          <option value="1">{t('search.filters.moods.sad')}</option>
        </select>
      </div>

      {/* Favorite checkbox */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="checkbox checkbox-xs"
          checked={filters.isFavorite || false}
          onChange={handleFavoriteToggle}
        />
        <span className="text-xs font-medium text-base-content/70">
          {t('search.filters.states.favorite')}
        </span>
      </label>

      {/* Archived checkbox */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="checkbox checkbox-xs"
          checked={filters.isArchived || false}
          onChange={handleArchivedToggle}
        />
        <span className="text-xs font-medium text-base-content/70">
          {t('search.filters.states.archived')}
        </span>
      </label>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <button
          onClick={handleClearFilters}
          className="btn btn-xs btn-ghost gap-1 ml-auto"
          aria-label={t('common.clearFilters')}
        >
          <X className="h-3 w-3" />
          {t('common.clearFilters')}
        </button>
      )}
    </div>
  );
}
