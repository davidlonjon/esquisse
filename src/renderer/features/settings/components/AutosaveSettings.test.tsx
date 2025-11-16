import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AutosaveSettings } from './AutosaveSettings';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { seconds?: number }) => {
      if (key === 'settings.fields.autoSaveInterval' && options?.seconds) {
        return `Autosave interval (${options.seconds}s)`;
      }
      return key;
    },
  }),
}));

const mockUpdateSettings = vi.fn();
vi.mock('@features/settings', () => ({
  useSettingsStore: (selector: (state: unknown) => unknown) => {
    const state = {
      autoSave: true,
      autoSaveInterval: 30000, // 30 seconds in milliseconds
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
  Toggle: ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <input type="checkbox" checked={checked} onChange={onChange} data-testid="toggle" />
  ),
}));

describe('AutosaveSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render section header with icon and title', () => {
      render(<AutosaveSettings />);

      const autosaveTexts = screen.getAllByText('settings.sections.autosave');
      expect(autosaveTexts.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('settings.description')).toBeInTheDocument();
    });

    it('should render autosave field label', () => {
      render(<AutosaveSettings />);

      expect(screen.getByText('settings.fields.autoSave')).toBeInTheDocument();
    });

    it('should render autosave toggle', () => {
      render(<AutosaveSettings />);

      const toggle = screen.getByTestId('toggle');
      expect(toggle).toBeInTheDocument();
      expect(toggle).toBeChecked();
    });

    it('should render autosave interval field with current value in seconds', () => {
      render(<AutosaveSettings />);

      expect(screen.getByText('Autosave interval (30s)')).toBeInTheDocument();
    });

    it('should render autosave interval badge with seconds', () => {
      render(<AutosaveSettings />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('30s');
      expect(badge).toHaveAttribute('data-variant', 'outline');
    });

    it('should render autosave interval slider', () => {
      render(<AutosaveSettings />);

      const slider = screen.getByTestId('slider');
      expect(slider).toHaveAttribute('id', 'autosave-interval');
      expect(slider).toHaveAttribute('min', '5');
      expect(slider).toHaveAttribute('max', '120');
    });

    it('should render min and max labels for interval', () => {
      render(<AutosaveSettings />);

      expect(screen.getByText('5s')).toBeInTheDocument();
      expect(screen.getByText('120s')).toBeInTheDocument();
    });
  });

  describe('Autosave Toggle', () => {
    it('should call updateSettings when toggle is clicked to disable', async () => {
      const user = userEvent.setup();
      render(<AutosaveSettings />);

      const toggle = screen.getByTestId('toggle');
      await user.click(toggle);

      expect(mockUpdateSettings).toHaveBeenCalledTimes(1);
      expect(mockUpdateSettings).toHaveBeenCalledWith({ autoSave: false });
    });

    it('should toggle autosave state', async () => {
      const user = userEvent.setup();
      render(<AutosaveSettings />);

      const toggle = screen.getByTestId('toggle');
      expect(toggle).toBeChecked();

      await user.click(toggle);
      expect(mockUpdateSettings).toHaveBeenCalledWith({ autoSave: false });
    });
  });

  describe('Autosave Interval Adjustment', () => {
    it('should call updateSettings when interval slider changes', () => {
      render(<AutosaveSettings />);

      const slider = screen.getByTestId('slider');
      fireEvent.change(slider, { target: { value: '60' } });

      expect(mockUpdateSettings).toHaveBeenCalled();
      // Should convert seconds to milliseconds
      expect(mockUpdateSettings).toHaveBeenCalledWith({ autoSaveInterval: 60000 });
    });

    it('should handle minimum interval (5 seconds)', () => {
      render(<AutosaveSettings />);

      const slider = screen.getByTestId('slider');
      fireEvent.change(slider, { target: { value: '5' } });

      expect(mockUpdateSettings).toHaveBeenCalledWith({ autoSaveInterval: 5000 });
    });

    it('should handle maximum interval (120 seconds)', () => {
      render(<AutosaveSettings />);

      const slider = screen.getByTestId('slider');
      fireEvent.change(slider, { target: { value: '120' } });

      expect(mockUpdateSettings).toHaveBeenCalledWith({ autoSaveInterval: 120000 });
    });

    it('should convert seconds to milliseconds correctly', () => {
      render(<AutosaveSettings />);

      const slider = screen.getByTestId('slider');
      fireEvent.change(slider, { target: { value: '45' } });

      expect(mockUpdateSettings).toHaveBeenCalledWith({ autoSaveInterval: 45000 });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible autosave interval slider with id', () => {
      render(<AutosaveSettings />);

      const slider = screen.getByTestId('slider');
      expect(slider).toHaveAttribute('id', 'autosave-interval');
    });
  });
});
