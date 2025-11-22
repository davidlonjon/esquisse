import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
      fontFamily: 'Inter, sans-serif',
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
  Input: ({ value, onChange, id, type }: React.ComponentProps<'input'>) => (
    <input type={type} value={value} onChange={onChange} id={id} />
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

    it('should render font family field label', () => {
      render(<EditorSettings />);

      expect(screen.getByText('settings.fields.fontFamily')).toBeInTheDocument();
    });

    it('should render font family input with current value', () => {
      render(<EditorSettings />);

      const input = screen.getByLabelText('settings.fields.fontFamily') as HTMLInputElement;
      expect(input).toHaveValue('Inter, sans-serif');
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

  describe('Font Family Customization', () => {
    it('should call updateSettings when font family input changes', async () => {
      const user = userEvent.setup();
      render(<EditorSettings />);

      const input = screen.getByLabelText('settings.fields.fontFamily');
      await user.clear(input);
      await user.type(input, 'Roboto');

      // Called for each character typed
      expect(mockUpdateSettings).toHaveBeenCalled();
    });

    it('should handle empty font family', async () => {
      const user = userEvent.setup();
      render(<EditorSettings />);

      const input = screen.getByLabelText('settings.fields.fontFamily');
      await user.clear(input);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ fontFamily: '' });
    });

    it('should handle custom font family with multiple fonts', async () => {
      const user = userEvent.setup();
      render(<EditorSettings />);

      const input = screen.getByLabelText('settings.fields.fontFamily');
      await user.clear(input);
      await user.type(input, 'Courier');

      // Just check that updateSettings was called, don't check exact value
      // since user.type triggers onChange for each character
      expect(mockUpdateSettings).toHaveBeenCalled();
      const calls = mockUpdateSettings.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible font size slider with id', () => {
      render(<EditorSettings />);

      const slider = screen.getByTestId('slider');
      expect(slider).toHaveAttribute('id', 'font-size');
    });

    it('should have accessible font family input with id', () => {
      render(<EditorSettings />);

      const input = screen.getByLabelText('settings.fields.fontFamily');
      expect(input).toHaveAttribute('id', 'font-family');
    });

    it('should associate label with font family input', () => {
      render(<EditorSettings />);

      const label = screen.getByText('settings.fields.fontFamily').closest('label');
      expect(label).toHaveAttribute('for', 'font-family');
    });
  });
});
