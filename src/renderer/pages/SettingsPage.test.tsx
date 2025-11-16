import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SettingsPage } from './SettingsPage';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

const mockLoadSettings = vi.fn();
vi.mock('@features/settings', () => ({
  useSettingsStore: (selector: (state: unknown) => unknown) => {
    const state = {
      loadSettings: mockLoadSettings,
      progress: {
        load: {
          status: 'idle',
          error: null,
        },
      },
    };
    return selector(state);
  },
}));

const mockUseGlobalHotkeys = vi.fn();
vi.mock('@hooks/useGlobalHotkeys', () => ({
  useGlobalHotkeys: (...args: unknown[]) => mockUseGlobalHotkeys(...args),
}));

vi.mock('@features/settings/components', () => ({
  SettingsSidebar: ({
    activeSection,
    onSectionClick,
    onBack,
  }: {
    activeSection: string;
    onSectionClick: (id: string) => void;
    onBack: () => void;
  }) => (
    <div data-testid="settings-sidebar">
      <div>Active: {activeSection}</div>
      <button onClick={onBack}>Back</button>
      <button onClick={() => onSectionClick('appearance')}>Appearance</button>
      <button onClick={() => onSectionClick('editor')}>Editor</button>
      <button onClick={() => onSectionClick('autosave')}>Autosave</button>
    </div>
  ),
  AppearanceSettings: () => <div data-testid="appearance-settings">Appearance Settings</div>,
  EditorSettings: () => <div data-testid="editor-settings">Editor Settings</div>,
  AutosaveSettings: () => <div data-testid="autosave-settings">Autosave Settings</div>,
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render SettingsSidebar', () => {
      render(<SettingsPage />);

      expect(screen.getByTestId('settings-sidebar')).toBeInTheDocument();
    });

    it('should render AppearanceSettings by default', () => {
      render(<SettingsPage />);

      expect(screen.getByTestId('appearance-settings')).toBeInTheDocument();
      expect(screen.queryByTestId('editor-settings')).not.toBeInTheDocument();
      expect(screen.queryByTestId('autosave-settings')).not.toBeInTheDocument();
    });

    it('should call loadSettings on mount', () => {
      render(<SettingsPage />);

      expect(mockLoadSettings).toHaveBeenCalledTimes(1);
    });

    it('should show appearance as active section initially', () => {
      render(<SettingsPage />);

      expect(screen.getByText('Active: appearance')).toBeInTheDocument();
    });
  });

  describe('Section Navigation', () => {
    it('should switch to editor section when clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      await user.click(screen.getByText('Editor'));

      expect(screen.getByTestId('editor-settings')).toBeInTheDocument();
      expect(screen.queryByTestId('appearance-settings')).not.toBeInTheDocument();
      expect(screen.getByText('Active: editor')).toBeInTheDocument();
    });

    it('should switch to autosave section when clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      await user.click(screen.getByText('Autosave'));

      expect(screen.getByTestId('autosave-settings')).toBeInTheDocument();
      expect(screen.queryByTestId('appearance-settings')).not.toBeInTheDocument();
      expect(screen.getByText('Active: autosave')).toBeInTheDocument();
    });

    it('should switch between sections multiple times', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      await user.click(screen.getByText('Editor'));
      expect(screen.getByTestId('editor-settings')).toBeInTheDocument();

      await user.click(screen.getByText('Autosave'));
      expect(screen.getByTestId('autosave-settings')).toBeInTheDocument();

      await user.click(screen.getByText('Appearance'));
      expect(screen.getByTestId('appearance-settings')).toBeInTheDocument();
    });
  });

  describe('Close Settings', () => {
    it('should navigate back when back button is clicked', async () => {
      const user = userEvent.setup();
      // Mock window.history.length to be > 1
      Object.defineProperty(window.history, 'length', {
        writable: true,
        configurable: true,
        value: 2,
      });
      const mockBack = vi.fn();
      Object.defineProperty(window.history, 'back', {
        writable: true,
        configurable: true,
        value: mockBack,
      });

      render(<SettingsPage />);

      await user.click(screen.getByText('Back'));

      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('should navigate to root when history is empty', async () => {
      const user = userEvent.setup();
      // Mock window.history.length to be 1
      Object.defineProperty(window.history, 'length', {
        writable: true,
        configurable: true,
        value: 1,
      });

      render(<SettingsPage />);

      await user.click(screen.getByText('Back'));

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
    });
  });

  describe('Global Hotkeys', () => {
    it('should register escape hotkey', () => {
      render(<SettingsPage />);

      expect(mockUseGlobalHotkeys).toHaveBeenCalledWith(
        'escape',
        expect.any(Function),
        { preventDefault: true }
      );
    });

    it('should register mod+comma hotkey', () => {
      render(<SettingsPage />);

      expect(mockUseGlobalHotkeys).toHaveBeenCalledWith(
        'mod+comma',
        expect.any(Function),
        { preventDefault: true }
      );
    });
  });

  describe('Layout and Structure', () => {
    it('should render with correct root structure', () => {
      const { container } = render(<SettingsPage />);

      const root = container.firstChild;
      expect(root).toHaveClass('flex', 'min-h-screen', 'w-screen');
    });

    it('should render sidebar and content area together', () => {
      render(<SettingsPage />);

      expect(screen.getByTestId('settings-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('appearance-settings')).toBeInTheDocument();
    });
  });
});
