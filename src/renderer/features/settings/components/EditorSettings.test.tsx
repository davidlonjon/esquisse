import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { EditorSettings } from './EditorSettings';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { size?: number }) => {
      if (key === 'settings.fields.fontSize' && options?.size) {
        return `Font size (${options.size}px)`;
      }
      return key;
    },
  }),
}));

const mockUpdateSettings = vi.fn();
vi.mock('@features/settings', () => ({
  useSettingsStore: (selector: (state: unknown) => unknown) => {
    const state = {
      fontSize: 16,
      updateSettings: mockUpdateSettings,
    };
    return selector(state);
  },
}));

vi.mock('@ui', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <div data-testid="badge" data-variant={variant}>
      {children}
    </div>
  ),
  Slider: ({
    value,
    onChange,
    id,
    min,
    max,
  }: React.ComponentProps<'input'> & { min?: number; max?: number }) => (
    <input
      type="range"
      value={value}
      onChange={onChange}
      id={id}
      min={min}
      max={max}
      data-testid="slider"
    />
  ),
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick} data-testid="reset-button">
      {children}
    </button>
  ),
}));

describe('EditorSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render font size field with current value', () => {
      render(<EditorSettings />);

      expect(screen.getByText('Font size (16px)')).toBeInTheDocument();
    });

    it('should render font size badge with current value', () => {
      render(<EditorSettings />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('16px');
      expect(badge).toHaveAttribute('data-variant', 'outline');
    });

    it('should render font size slider', () => {
      render(<EditorSettings />);

      const slider = screen.getByTestId('slider');
      expect(slider).toHaveAttribute('id', 'font-size');
      expect(slider).toHaveAttribute('min', '12');
      expect(slider).toHaveAttribute('max', '28');
    });

    it('should render min and max labels for font size', () => {
      render(<EditorSettings />);

      expect(screen.getByText('12px')).toBeInTheDocument();
      expect(screen.getByText('28px')).toBeInTheDocument();
    });
  });

  describe('Font Size Adjustment', () => {
    it('should call updateSettings when font size slider changes', () => {
      render(<EditorSettings />);

      const slider = screen.getByTestId('slider');
      fireEvent.change(slider, { target: { value: '20' } });

      expect(mockUpdateSettings).toHaveBeenCalled();
      expect(mockUpdateSettings).toHaveBeenCalledWith({ fontSize: 20 });
    });

    it('should handle minimum font size', () => {
      render(<EditorSettings />);

      const slider = screen.getByTestId('slider');
      fireEvent.change(slider, { target: { value: '12' } });

      expect(mockUpdateSettings).toHaveBeenCalledWith({ fontSize: 12 });
    });

    it('should handle maximum font size', () => {
      render(<EditorSettings />);

      const slider = screen.getByTestId('slider');
      fireEvent.change(slider, { target: { value: '28' } });

      expect(mockUpdateSettings).toHaveBeenCalledWith({ fontSize: 28 });
    });
  });

  describe('Reset Typography', () => {
    it('should reset font settings to defaults when reset button is clicked', () => {
      render(<EditorSettings />);

      const resetButton = screen.getByTestId('reset-button');
      fireEvent.click(resetButton);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ fontSize: 16, fontFamily: 'system-ui' });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible font size slider with id', () => {
      render(<EditorSettings />);

      const slider = screen.getByTestId('slider');
      expect(slider).toHaveAttribute('id', 'font-size');
    });
  });
});
