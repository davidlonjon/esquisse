import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'hud.keyboard.title': 'Keyboard Shortcuts',
        'hud.keyboard.searchPlaceholder': 'Search shortcuts',
        'hud.keyboard.categories.navigation': 'Navigation',
        'hud.keyboard.categories.ui': 'Interface',
        'hud.keyboard.categories.editor': 'Editor',
        'hud.keyboard.categories.modal': 'Dialogs',
        'entry.archived.empty': 'No shortcuts found',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('@ui', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="badge">{children}</span>
  ),
  Button: ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick}>{children}</button>
  ),
  Drawer: ({
    children,
    isOpen,
    onClose,
    title,
  }: {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    title: string;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <button onClick={onClose} aria-label="Close">
          Close
        </button>
        {children}
      </div>
    ) : null,
  Input: ({
    value,
    onChange,
    placeholder,
    autoFocus,
    className,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    autoFocus?: boolean;
    className?: string;
  }) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={className}
      data-testid="search-input"
    />
  ),
  ShortcutKeys: ({ combo }: { combo: string }) => <span data-testid="shortcut-keys">{combo}</span>,
}));

vi.mock('lucide-react', () => ({
  Search: () => <svg data-testid="search-icon" />,
}));

vi.mock('@config/shortcuts', () => ({
  SHORTCUTS: [
    {
      id: 'previousEntry',
      category: 'navigation',
    },
    {
      id: 'toggleHudPin',
      category: 'ui',
    },
  ],
}));

vi.mock('@lib/shortcuts', () => ({
  getShortcutDisplayInfo: (id: string) => {
    if (id === 'previousEntry') {
      return {
        label: 'Previous Entry',
        description: 'Go to previous',
        combo: '⌘[',
      };
    }
    if (id === 'toggleHudPin') {
      return {
        label: 'Toggle HUD',
        description: 'Toggle visibility',
        combo: '⌘.',
      };
    }
    return null;
  },
}));

describe('KeyboardShortcutsPanel', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the panel with title', () => {
    render(<KeyboardShortcutsPanel onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: 'Keyboard Shortcuts' })).toBeInTheDocument();
  });

  it('should render search input', () => {
    render(<KeyboardShortcutsPanel onClose={onClose} />);
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search shortcuts')).toBeInTheDocument();
  });

  it('should render categories', () => {
    render(<KeyboardShortcutsPanel onClose={onClose} />);
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Interface')).toBeInTheDocument();
  });

  it('should render shortcuts', () => {
    render(<KeyboardShortcutsPanel onClose={onClose} />);
    expect(screen.getByText('Previous Entry')).toBeInTheDocument();
    expect(screen.getByText('⌘[')).toBeInTheDocument();
    expect(screen.getByText('Toggle HUD')).toBeInTheDocument();
    expect(screen.getByText('⌘.')).toBeInTheDocument();
  });

  it('should filter shortcuts based on search', async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsPanel onClose={onClose} />);

    const input = screen.getByTestId('search-input');
    await user.type(input, 'Previous');

    expect(screen.getByText('Previous Entry')).toBeInTheDocument();
    expect(screen.queryByText('Toggle HUD')).not.toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.queryByText('Interface')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsPanel onClose={onClose} />);

    await user.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
