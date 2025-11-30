import clsx from 'clsx';
import { enUS, fr } from 'date-fns/locale';
import { Hash, Tag, X } from 'lucide-react';
import { memo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';
import type { TagWithCount } from '@hooks/useTagsOverlay';
import { useHotkeysContext } from '@providers/hotkeys-provider';
import type { Entry } from '@shared/types';
import { EntryCard } from '@ui';

interface TagsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  tagsWithCounts: TagWithCount[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearSelectedTags: () => void;
  filteredEntries: Entry[];
  selectedEntryIndex: number;
  focusedTagIndex: number;
  focusArea: 'tags' | 'entries';
  onFocusPreviousTag: () => void;
  onFocusNextTag: () => void;
  onSelectFocusedTag: () => void;
  onSelectPreviousEntry: () => void;
  onSelectNextEntry: () => void;
  onNavigateToSelectedEntry: () => void;
  onSwitchFocusToEntries: () => void;
  onSwitchFocusToTags: () => void;
  onToggleFavorite: (entryId: string) => void;
  onEntryClick: (entryId: string) => void;
  hasNoTags: boolean;
  hasNoEntries: boolean;
}

const TagItem = memo(
  ({
    tagWithCount,
    isSelected,
    isFocused,
    onClick,
  }: {
    tagWithCount: TagWithCount;
    isSelected: boolean;
    isFocused: boolean;
    onClick: () => void;
  }) => {
    const itemRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      if (isFocused && itemRef.current) {
        itemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, [isFocused]);

    return (
      <button
        ref={itemRef}
        onClick={onClick}
        className={clsx(
          'flex w-full items-center justify-between px-4 py-3 rounded-lg text-sm transition-colors',
          isSelected && 'bg-primary/10 text-primary',
          isFocused && !isSelected && 'ring-1 ring-primary/50',
          !isSelected && !isFocused && 'hover:bg-base-200 text-base-content/70'
        )}
      >
        <span className="flex items-center gap-2">
          <Hash className="h-3.5 w-3.5" />
          {tagWithCount.tag}
        </span>
        <span className="text-xs text-base-content/50">{tagWithCount.count}</span>
      </button>
    );
  }
);

TagItem.displayName = 'TagItem';

export function TagsOverlay({
  isOpen,
  onClose,
  tagsWithCounts,
  selectedTags,
  onToggleTag,
  onClearSelectedTags,
  filteredEntries,
  selectedEntryIndex,
  focusedTagIndex,
  focusArea,
  onFocusPreviousTag,
  onFocusNextTag,
  onSelectFocusedTag,
  onSelectPreviousEntry,
  onSelectNextEntry,
  onNavigateToSelectedEntry,
  onSwitchFocusToEntries,
  onSwitchFocusToTags,
  onToggleFavorite,
  onEntryClick,
  hasNoTags,
  hasNoEntries,
}: TagsOverlayProps) {
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

  // Escape to close
  useGlobalHotkeys('escape', onClose, { enabled: isOpen }, false);

  // Tab to switch focus between panels
  useGlobalHotkeys(
    'tab',
    (e) => {
      e.preventDefault();
      if (focusArea === 'tags' && filteredEntries.length > 0) {
        onSwitchFocusToEntries();
      } else {
        onSwitchFocusToTags();
      }
    },
    { enabled: isOpen },
    false
  );

  // Arrow navigation for tags (when in tags panel)
  useGlobalHotkeys(
    'arrowup',
    (e) => {
      e.preventDefault();
      if (focusArea === 'tags') {
        onFocusPreviousTag();
      } else {
        onSelectPreviousEntry();
      }
    },
    { enabled: isOpen },
    false
  );

  useGlobalHotkeys(
    'arrowdown',
    (e) => {
      e.preventDefault();
      if (focusArea === 'tags') {
        onFocusNextTag();
      } else {
        onSelectNextEntry();
      }
    },
    { enabled: isOpen },
    false
  );

  // Space to toggle tag (when in tags panel)
  useGlobalHotkeys(
    'space',
    (e) => {
      e.preventDefault();
      if (focusArea === 'tags') {
        onSelectFocusedTag();
      }
    },
    { enabled: isOpen && focusArea === 'tags' },
    false
  );

  // Enter to navigate to entry (when in entries panel) or toggle tag (in tags panel)
  useGlobalHotkeys(
    'enter',
    (e) => {
      e.preventDefault();
      if (focusArea === 'entries') {
        onNavigateToSelectedEntry();
      } else {
        onSelectFocusedTag();
      }
    },
    { enabled: isOpen },
    false
  );

  // c to clear selected tags
  useGlobalHotkeys(
    'c',
    (e) => {
      e.preventDefault();
      onClearSelectedTags();
    },
    { enabled: isOpen && selectedTags.length > 0 },
    false
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex bg-background/98 backdrop-blur-md">
      {/* Left sidebar - Tags */}
      <div className="w-64 flex-shrink-0 border-r border-base-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-base-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-base-content">
                {t('tagsOverlay.title', 'Tags')}
              </h2>
            </div>
            {selectedTags.length > 0 && (
              <button
                onClick={onClearSelectedTags}
                className="text-xs text-base-content/50 hover:text-base-content transition-colors"
              >
                {t('tagsOverlay.clearAll', 'Clear')}
              </button>
            )}
          </div>
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-xs rounded-full"
                >
                  #{tag}
                  <button onClick={() => onToggleTag(tag)} className="hover:text-primary/70">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {hasNoTags ? (
            <div className="text-center py-8">
              <Hash className="h-8 w-8 mx-auto mb-2 text-base-content/20" />
              <p className="text-sm text-base-content/50">
                {t('tagsOverlay.noTags', 'No tags yet')}
              </p>
              <p className="text-xs text-base-content/40 mt-1">
                {t('tagsOverlay.noTagsHint', 'Add #tags to your entries')}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {tagsWithCounts.map((tagWithCount, index) => (
                <TagItem
                  key={tagWithCount.tag}
                  tagWithCount={tagWithCount}
                  isSelected={selectedTags.includes(tagWithCount.tag)}
                  isFocused={focusArea === 'tags' && index === focusedTagIndex}
                  onClick={() => onToggleTag(tagWithCount.tag)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main content - Entry cards */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-base-content">
              {selectedTags.length === 0
                ? t('tagsOverlay.selectTags', 'Select tags to filter')
                : t('tagsOverlay.entriesCount', '{{count}} entry', {
                    count: filteredEntries.length,
                  })}
            </h1>
            {selectedTags.length > 0 && filteredEntries.length !== 1 && (
              <span className="text-sm text-base-content/50">
                {t('tagsOverlay.entriesCount_other', '{{count}} entries', {
                  count: filteredEntries.length,
                })}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-base-200 transition-colors"
            aria-label={t('common.actions.close')}
          >
            <X className="h-5 w-5 text-base-content/70" />
          </button>
        </div>

        {/* Entries grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTags.length === 0 ? (
            <div className="text-center py-16">
              <Tag className="h-12 w-12 mx-auto mb-4 text-base-content/20" />
              <p className="text-base-content/60 mb-2">
                {t('tagsOverlay.emptyState', 'Select tags from the sidebar')}
              </p>
              <p className="text-sm text-base-content/40">
                {t('tagsOverlay.emptyStateHint', 'Use ↑↓ to navigate, Space or Enter to select')}
              </p>
            </div>
          ) : hasNoEntries ? (
            <div className="text-center py-16">
              <Hash className="h-12 w-12 mx-auto mb-4 text-base-content/20" />
              <p className="text-base-content/60 mb-2">
                {t('tagsOverlay.noEntries', 'No entries match these tags')}
              </p>
              <p className="text-sm text-base-content/40">
                {t('tagsOverlay.noEntriesHint', 'Try selecting fewer tags')}
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {filteredEntries.map((entry, index) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  isSelected={focusArea === 'entries' && index === selectedEntryIndex}
                  locale={locale}
                  emptyLabel={t('common.emptyEntry')}
                  onToggleFavorite={onToggleFavorite}
                  onClick={onEntryClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Keyboard hints */}
        <div className="px-6 py-3 border-t border-base-200 text-center text-xs text-base-content/40">
          {t(
            'tagsOverlay.keyboardHints',
            '↑↓ navigate · Space/Enter select · Tab switch panel · c clear · Esc close'
          )}
        </div>
      </div>
    </div>
  );
}
