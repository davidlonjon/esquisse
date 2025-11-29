import clsx from 'clsx';
import { Annoyed, Frown, Laugh, Meh, Smile } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { getShortcutBindings } from '@/config/shortcuts';
import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';
import { useHotkeysContext } from '@providers/hotkeys-provider';
import type { MoodValue } from '@shared/types';
import { MOOD_CONFIGS, MOOD_VALUES } from '@shared/types';
import { Tooltip } from '@ui';

const MOOD_ICONS: Record<string, LucideIcon> = {
  Frown,
  Annoyed,
  Meh,
  Smile,
  Laugh,
};

interface MoodPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  selectedIndex: number;
  currentMood: MoodValue | null;
  onSelectPrevious: () => void;
  onSelectNext: () => void;
  onSelectCurrent: () => void;
  onSelectByNumber: (num: number) => void;
  onClear: () => void;
  disabled?: boolean;
  shortcut?: string;
  onShowHud?: () => void;
}

export function MoodPicker({
  isOpen,
  onClose,
  onToggle,
  selectedIndex,
  currentMood,
  onSelectPrevious,
  onSelectNext,
  onSelectCurrent,
  onSelectByNumber,
  onClear,
  disabled = false,
  shortcut,
  onShowHud,
}: MoodPickerProps) {
  const { t } = useTranslation();
  const { openModal, closeModal } = useHotkeysContext();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hudKeepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get the icon for current mood or default to Meh
  const currentConfig = currentMood ? MOOD_CONFIGS.find((c) => c.value === currentMood) : null;
  const CurrentIcon = currentConfig ? MOOD_ICONS[currentConfig.icon] : Meh;
  const hasMood = currentMood !== null;

  // Register/unregister modal state for hotkey management
  useEffect(() => {
    if (isOpen) {
      openModal();
      return () => closeModal();
    }
  }, [isOpen, openModal, closeModal]);

  // Keep HUD visible while mood picker is open
  useEffect(() => {
    if (isOpen && onShowHud) {
      onShowHud();
      hudKeepAliveRef.current = setInterval(() => {
        onShowHud();
      }, 2000);
    } else {
      if (hudKeepAliveRef.current) {
        clearInterval(hudKeepAliveRef.current);
        hudKeepAliveRef.current = null;
      }
    }

    return () => {
      if (hudKeepAliveRef.current) {
        clearInterval(hudKeepAliveRef.current);
        hudKeepAliveRef.current = null;
      }
    };
  }, [isOpen, onShowHud]);

  // Global shortcut to open mood picker
  useGlobalHotkeys(
    getShortcutBindings('openMoodPicker'),
    (e) => {
      e.preventDefault();
      if (!disabled) {
        onToggle();
      }
    },
    { enabled: !disabled }
  );

  // Escape to close
  useGlobalHotkeys('escape', onClose, { enabled: isOpen }, false);

  // Arrow navigation
  useGlobalHotkeys(
    'arrowup',
    (e) => {
      e.preventDefault();
      onSelectPrevious();
    },
    { enabled: isOpen },
    false
  );

  useGlobalHotkeys(
    'arrowdown',
    (e) => {
      e.preventDefault();
      onSelectNext();
    },
    { enabled: isOpen },
    false
  );

  // Enter to select
  useGlobalHotkeys(
    'enter',
    (e) => {
      e.preventDefault();
      onSelectCurrent();
    },
    { enabled: isOpen },
    false
  );

  // Number keys 1-5 for quick selection
  useGlobalHotkeys('1', () => onSelectByNumber(1), { enabled: isOpen }, false);
  useGlobalHotkeys('2', () => onSelectByNumber(2), { enabled: isOpen }, false);
  useGlobalHotkeys('3', () => onSelectByNumber(3), { enabled: isOpen }, false);
  useGlobalHotkeys('4', () => onSelectByNumber(4), { enabled: isOpen }, false);
  useGlobalHotkeys('5', () => onSelectByNumber(5), { enabled: isOpen }, false);

  // Backspace/Delete to clear
  useGlobalHotkeys(
    ['backspace', 'delete'],
    (e) => {
      e.preventDefault();
      onClear();
    },
    { enabled: isOpen && hasMood },
    false
  );

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const button = (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => !disabled && onToggle()}
      disabled={disabled}
      className={clsx(
        'flex items-center justify-center rounded-full px-2 py-1 transition',
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : hasMood && currentConfig
            ? `${currentConfig.color} ${currentConfig.bgColor} hover:opacity-80`
            : 'text-base-content/40 hover:bg-base-200'
      )}
      aria-label={t('mood.button')}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
    >
      <CurrentIcon className="h-4 w-4" />
    </button>
  );

  return (
    <div className="relative">
      {disabled ? (
        button
      ) : (
        <Tooltip content={t('mood.button')} shortcut={shortcut} position="bottom">
          {button}
        </Tooltip>
      )}

      {isOpen && (
        <div
          ref={dropdownRef}
          role="listbox"
          aria-label={t('mood.pickerLabel')}
          className="absolute top-full right-0 mt-2 z-50 bg-base-100 rounded-lg shadow-lg border border-base-300 py-1 min-w-[140px]"
        >
          {MOOD_CONFIGS.map((config, index) => {
            const Icon = MOOD_ICONS[config.icon];
            const isSelected = index === selectedIndex;
            const isCurrent = config.value === currentMood;

            return (
              <button
                key={config.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelectByNumber(config.value)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                  isSelected && config.bgColor,
                  !isSelected && 'hover:bg-base-200'
                )}
              >
                <Icon className={clsx('h-5 w-5', config.color)} />
                <span className={clsx('text-sm', isCurrent && `${config.color} font-medium`)}>
                  {t(
                    config.labelKey as
                      | 'mood.awful'
                      | 'mood.bad'
                      | 'mood.neutral'
                      | 'mood.good'
                      | 'mood.great'
                  )}
                </span>
                <span className="ml-auto text-xs text-base-content/40">{config.value}</span>
              </button>
            );
          })}

          {hasMood && (
            <>
              <div className="border-t border-base-300 my-1" />
              <button
                type="button"
                onClick={onClear}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors text-base-content/60',
                  selectedIndex === MOOD_VALUES.length ? 'bg-base-200' : 'hover:bg-base-200'
                )}
              >
                <span className="text-sm">{t('mood.clear')}</span>
                <span className="ml-auto text-xs text-base-content/40">⌫</span>
              </button>
            </>
          )}

          <div className="border-t border-base-300 mt-1 pt-1 px-3 pb-1">
            <p className="text-xs text-base-content/40">↑↓ {t('mood.navigate')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
