import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getShortcutCombo } from '@lib/shortcuts';

import { HUDButton } from './HUDButton';

interface HUDNavigationButtonsProps {
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  disabled?: boolean;
  canNavigatePrevious?: boolean;
  canNavigateNext?: boolean;
}

export function HUDNavigationButtons({
  onNavigatePrevious,
  onNavigateNext,
  disabled = false,
  canNavigatePrevious = true,
  canNavigateNext = true,
}: HUDNavigationButtonsProps) {
  const { t } = useTranslation();
  const previousShortcut = getShortcutCombo('previousEntry') ?? '⌘[';
  const nextShortcut = getShortcutCombo('nextEntry') ?? '⌘]';

  return (
    <div className="pointer-events-auto flex gap-1">
      <HUDButton
        onClick={onNavigatePrevious}
        disabled={disabled || !canNavigatePrevious}
        tooltip={t('hud.navigation.previous', 'Previous entry')}
        shortcut={previousShortcut}
        icon={ChevronLeft}
        variant="default"
        tooltipPosition="bottom-left"
      />
      <HUDButton
        onClick={onNavigateNext}
        disabled={disabled || !canNavigateNext}
        tooltip={t('hud.navigation.next', 'Next entry')}
        shortcut={nextShortcut}
        icon={ChevronRight}
        variant="default"
        tooltipPosition="bottom-left"
      />
    </div>
  );
}
