import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { OverlayHUD } from './OverlayHUD';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'hud.keyboard.button': 'Shortcuts',
        'hud.keyboard.title': 'Keyboard Shortcuts',
        'hud.keyboard.subtitle': 'Available shortcuts',
        'hud.keyboard.close': 'Close',
        'hud.session': 'Session',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('@hooks/useKeyboardShortcutsPanel', () => ({
  useKeyboardShortcutsPanel: vi.fn(() => ({
    isShortcutsOpen: false,
    openShortcuts: vi.fn(),
    closeShortcuts: vi.fn(),
    toggleShortcuts: vi.fn(),
  })),
}));

vi.mock('@layout/KeyboardShortcutsPanel', () => ({
  KeyboardShortcutsPanel: () => <div data-testid="shortcuts-panel">Shortcuts Panel</div>,
}));

vi.mock('@lib/shortcuts', () => ({
  getShortcutCombo: () => '⌘/',
}));

describe('OverlayHUD', () => {
  const defaultProps = {
    showTop: true,
    showBottom: true,
    dateLabel: 'January 1, 2024',
    wordCountLabel: '250 words',
    sessionLabel: '15m 30s',
    snapshotLabel: 'Last saved: 2 min ago',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render top HUD when showTop is true', () => {
      render(<OverlayHUD {...defaultProps} />);

      expect(screen.getByText('January 1, 2024')).toBeInTheDocument();
      expect(screen.getByText('250 words')).toBeInTheDocument();
    });

    it('should render bottom HUD when showBottom is true', () => {
      render(<OverlayHUD {...defaultProps} />);

      expect(screen.getByText(/Session · 15m 30s/)).toBeInTheDocument();
      expect(screen.getByText('Last saved: 2 min ago')).toBeInTheDocument();
    });

    it('should render shortcuts button', () => {
      render(<OverlayHUD {...defaultProps} />);

      expect(screen.getByText('Shortcuts')).toBeInTheDocument();
      expect(screen.getByText('⌘')).toBeInTheDocument();
      expect(screen.getByText('/')).toBeInTheDocument();
    });

    it('should render session indicator with green dot', () => {
      const { container } = render(<OverlayHUD {...defaultProps} />);

      const greenDot = container.querySelector('.bg-emerald-400');
      expect(greenDot).toBeInTheDocument();
    });
  });

  describe('Visibility control', () => {
    it('should hide top HUD when showTop is false', () => {
      const { container } = render(<OverlayHUD {...defaultProps} showTop={false} />);

      const topHud = container.querySelector('.top-6');
      expect(topHud).toHaveClass('opacity-0');
    });

    it('should hide bottom HUD when showBottom is false', () => {
      const { container } = render(<OverlayHUD {...defaultProps} showBottom={false} />);

      const bottomHud = container.querySelector('.bottom-6');
      expect(bottomHud).toHaveClass('opacity-0');
    });

    it('should show both HUDs when both flags are true', () => {
      const { container } = render(<OverlayHUD {...defaultProps} />);

      const topHud = container.querySelector('.top-6');
      const bottomHud = container.querySelector('.bottom-6');

      expect(topHud).toHaveClass('opacity-100');
      expect(bottomHud).toHaveClass('opacity-100');
    });
  });

  describe('Disabled state', () => {
    it('should disable shortcuts button when disabled prop is true', () => {
      render(<OverlayHUD {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button', { name: /Shortcuts/ });
      expect(button).toBeDisabled();
    });

    it('should not disable shortcuts button when disabled prop is false', () => {
      render(<OverlayHUD {...defaultProps} disabled={false} />);

      const button = screen.getByRole('button', { name: /Shortcuts/ });
      expect(button).not.toBeDisabled();
    });

    it('should apply opacity-40 class when disabled', () => {
      render(<OverlayHUD {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button', { name: /Shortcuts/ });
      expect(button).toHaveClass('opacity-40');
    });
  });

  describe('Label updates', () => {
    it('should update date label', () => {
      const { rerender } = render(<OverlayHUD {...defaultProps} />);

      expect(screen.getByText('January 1, 2024')).toBeInTheDocument();

      rerender(<OverlayHUD {...defaultProps} dateLabel="February 1, 2024" />);

      expect(screen.getByText('February 1, 2024')).toBeInTheDocument();
      expect(screen.queryByText('January 1, 2024')).not.toBeInTheDocument();
    });

    it('should update word count label', () => {
      const { rerender } = render(<OverlayHUD {...defaultProps} />);

      expect(screen.getByText('250 words')).toBeInTheDocument();

      rerender(<OverlayHUD {...defaultProps} wordCountLabel="500 words" />);

      expect(screen.getByText('500 words')).toBeInTheDocument();
    });

    it('should update session label', () => {
      const { rerender } = render(<OverlayHUD {...defaultProps} />);

      expect(screen.getByText(/15m 30s/)).toBeInTheDocument();

      rerender(<OverlayHUD {...defaultProps} sessionLabel="30m 45s" />);

      expect(screen.getByText(/30m 45s/)).toBeInTheDocument();
    });

    it('should update snapshot label', () => {
      const { rerender } = render(<OverlayHUD {...defaultProps} />);

      expect(screen.getByText('Last saved: 2 min ago')).toBeInTheDocument();

      rerender(<OverlayHUD {...defaultProps} snapshotLabel="Last saved: just now" />);

      expect(screen.getByText('Last saved: just now')).toBeInTheDocument();
    });
  });

  describe('Shortcuts button interaction', () => {
    it('should call openShortcuts when button is clicked and not disabled', async () => {
      const user = userEvent.setup();
      const mockOpenShortcuts = vi.fn();

      const { useKeyboardShortcutsPanel } = await import('@hooks/useKeyboardShortcutsPanel');
      vi.mocked(useKeyboardShortcutsPanel).mockReturnValue({
        isShortcutsOpen: false,
        openShortcuts: mockOpenShortcuts,
        closeShortcuts: vi.fn(),
        toggleShortcuts: vi.fn(),
      });

      render(<OverlayHUD {...defaultProps} disabled={false} />);

      const button = screen.getByRole('button', { name: /Shortcuts/ });
      await user.click(button);

      expect(mockOpenShortcuts).toHaveBeenCalledTimes(1);
    });

    it('should not call openShortcuts when disabled', async () => {
      const user = userEvent.setup();
      const mockOpenShortcuts = vi.fn();

      const { useKeyboardShortcutsPanel } = await import('@hooks/useKeyboardShortcutsPanel');
      vi.mocked(useKeyboardShortcutsPanel).mockReturnValue({
        isShortcutsOpen: false,
        openShortcuts: mockOpenShortcuts,
        closeShortcuts: vi.fn(),
        toggleShortcuts: vi.fn(),
      });

      render(<OverlayHUD {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button', { name: /Shortcuts/ });
      await user.click(button);

      // Button is disabled, so onClick won't fire
      expect(mockOpenShortcuts).not.toHaveBeenCalled();
    });
  });

  describe('CSS transitions', () => {
    it('should apply transition classes to top HUD', () => {
      const { container } = render(<OverlayHUD {...defaultProps} />);

      const topHud = container.querySelector('.top-6');
      expect(topHud).toHaveClass('transition-all', 'duration-300', 'ease-out');
    });

    it('should apply transition classes to bottom HUD', () => {
      const { container } = render(<OverlayHUD {...defaultProps} />);

      const bottomHud = container.querySelector('.bottom-6');
      expect(bottomHud).toHaveClass('transition-all', 'duration-300', 'ease-out');
    });

    it('should apply translate-y transform when hidden', () => {
      const { container } = render(<OverlayHUD {...defaultProps} showTop={false} />);

      const topHud = container.querySelector('.top-6');
      expect(topHud).toHaveClass('-translate-y-4');
    });
  });

  describe('HUDPill styling', () => {
    it('should apply backdrop blur to pills', () => {
      const { container } = render(<OverlayHUD {...defaultProps} />);

      const pills = container.querySelectorAll('.backdrop-blur-sm');
      expect(pills.length).toBeGreaterThan(0);
    });

    it('should apply rounded-full to pills', () => {
      render(<OverlayHUD {...defaultProps} />);

      const dateLabel = screen.getByText('January 1, 2024').closest('div');
      expect(dateLabel).toHaveClass('rounded-full');
    });
  });
});
