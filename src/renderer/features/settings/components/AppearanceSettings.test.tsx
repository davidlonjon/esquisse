import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AppearanceSettings } from './AppearanceSettings';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => {
      if (key === 'settings.options.theme.system') return 'System';
      if (key === 'settings.options.theme.light') return 'Light';
      if (key === 'settings.options.theme.dark') return 'Dark';
      if (key === 'settings.options.language.en') return 'English';
      if (key === 'settings.options.language.fr') return 'Français';
      return defaultValue || key;
    },
  }),
}));

const mockChangeLanguage = vi.fn();
vi.mock('@lib/i18n', () => ({
  default: {
    changeLanguage: (...args: unknown[]) => mockChangeLanguage(...args),
  },
}));

const mockUpdateSettings = vi.fn();
vi.mock('@features/settings', () => ({
  useSettingsStore: (selector: (state: unknown) => unknown) => {
    const state = {
      theme: 'system',
      language: 'en',
      updateSettings: mockUpdateSettings,
    };
    return selector(state);
  },
}));

vi.mock('@ui', () => ({
  Button: ({
    children,
    onClick,
    variant,
    className,
  }: React.ComponentProps<'button'> & { variant?: string }) => (
    <button onClick={onClick} data-variant={variant} className={className}>
      {children}
    </button>
  ),
  Select: ({ children, onChange, value, id }: React.ComponentProps<'select'>) => (
    <select onChange={onChange} value={value} id={id}>
      {children}
    </select>
  ),
}));

describe('AppearanceSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render theme field label', () => {
      render(<AppearanceSettings />);

      expect(screen.getByText('settings.fields.theme')).toBeInTheDocument();
    });

    it('should render all theme option buttons', () => {
      render(<AppearanceSettings />);

      expect(screen.getByText('System')).toBeInTheDocument();
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
    });

    it('should render language field label', () => {
      render(<AppearanceSettings />);

      expect(screen.getByText('settings.fields.language')).toBeInTheDocument();
    });

    it('should render language select with all options', () => {
      render(<AppearanceSettings />);

      const select = screen.getByLabelText('settings.fields.language');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Français')).toBeInTheDocument();
    });
  });

  describe('Theme Selection', () => {
    it('should highlight active theme button', () => {
      render(<AppearanceSettings />);

      const systemButton = screen.getByText('System').closest('button');
      expect(systemButton).toHaveAttribute('data-variant', 'default');
    });

    it('should call updateSettings when theme button is clicked', async () => {
      const user = userEvent.setup();
      render(<AppearanceSettings />);

      const lightButton = screen.getByText('Light');
      await user.click(lightButton);

      expect(mockUpdateSettings).toHaveBeenCalledTimes(1);
      expect(mockUpdateSettings).toHaveBeenCalledWith({ theme: 'light' });
    });

    it('should call updateSettings with dark theme', async () => {
      const user = userEvent.setup();
      render(<AppearanceSettings />);

      const darkButton = screen.getByText('Dark');
      await user.click(darkButton);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ theme: 'dark' });
    });

    it('should call updateSettings with system theme', async () => {
      const user = userEvent.setup();
      render(<AppearanceSettings />);

      const systemButton = screen.getByText('System');
      await user.click(systemButton);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ theme: 'system' });
    });
  });

  describe('Language Selection', () => {
    it('should have correct default language selected', () => {
      render(<AppearanceSettings />);

      const select = screen.getByLabelText('settings.fields.language') as HTMLSelectElement;
      expect(select.value).toBe('en');
    });

    it('should call updateSettings when language is changed', async () => {
      const user = userEvent.setup();
      render(<AppearanceSettings />);

      const select = screen.getByLabelText('settings.fields.language');
      await user.selectOptions(select, 'fr');

      expect(mockUpdateSettings).toHaveBeenCalledWith({ language: 'fr' });
    });

    it('should call i18n.changeLanguage when language is changed', async () => {
      const user = userEvent.setup();
      render(<AppearanceSettings />);

      const select = screen.getByLabelText('settings.fields.language');
      await user.selectOptions(select, 'fr');

      expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
    });

    it('should call both updateSettings and changeLanguage in sequence', async () => {
      const user = userEvent.setup();
      render(<AppearanceSettings />);

      const select = screen.getByLabelText('settings.fields.language');
      await user.selectOptions(select, 'fr');

      expect(mockUpdateSettings).toHaveBeenCalled();
      expect(mockChangeLanguage).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible language select with id', () => {
      render(<AppearanceSettings />);

      const select = screen.getByLabelText('settings.fields.language');
      expect(select).toHaveAttribute('id', 'language-select');
    });

    it('should associate label with language select', () => {
      render(<AppearanceSettings />);

      const label = screen.getByText('settings.fields.language').closest('label');
      expect(label).toHaveAttribute('for', 'language-select');
    });
  });
});
