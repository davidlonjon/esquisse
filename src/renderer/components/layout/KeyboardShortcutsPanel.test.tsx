import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { KeyboardShortcutsPanel, type ShortcutItem } from './KeyboardShortcutsPanel';

// Mock UI components
vi.mock('@ui', () => ({
  Badge: ({ children, ...props }: { children: React.ReactNode }) => (
    <span data-testid="badge" {...props}>
      {children}
    </span>
  ),
  Button: ({ children, onClick, ...props }: { children: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Modal: ({
    children,
    isOpen,
  }: {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="modal" role="dialog">
        {children}
      </div>
    ) : null,
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  X: () => <span>×</span>,
}));

describe('KeyboardShortcutsPanel', () => {
  const mockShortcuts: ShortcutItem[] = [
    { combo: '⌘S', label: 'Save', description: 'Save your work' },
    { combo: '⌘P', label: 'Print', description: 'Print document' },
    { combo: '⌘Z', label: 'Undo' },
  ];

  const defaultProps = {
    shortcuts: mockShortcuts,
    onClose: vi.fn(),
    title: 'Keyboard Shortcuts',
    description: 'Available shortcuts',
    closeLabel: 'Close',
  };

  describe('Rendering', () => {
    it('should render modal with shortcuts', () => {
      render(<KeyboardShortcutsPanel {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Available shortcuts')).toBeInTheDocument();
    });

    it('should render all shortcuts', () => {
      render(<KeyboardShortcutsPanel {...defaultProps} />);

      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Print')).toBeInTheDocument();
      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should render shortcut combos', () => {
      render(<KeyboardShortcutsPanel {...defaultProps} />);

      expect(screen.getByText('⌘S')).toBeInTheDocument();
      expect(screen.getByText('⌘P')).toBeInTheDocument();
      expect(screen.getByText('⌘Z')).toBeInTheDocument();
    });

    it('should render shortcut descriptions when provided', () => {
      render(<KeyboardShortcutsPanel {...defaultProps} />);

      expect(screen.getByText('Save your work')).toBeInTheDocument();
      expect(screen.getByText('Print document')).toBeInTheDocument();
    });

    it('should not render description for shortcuts without one', () => {
      render(<KeyboardShortcutsPanel {...defaultProps} />);

      // Undo shortcut has no description
      const undoContainer = screen.getByText('Undo').closest('div');
      expect(undoContainer).toBeInTheDocument();
      // Should not have a second p tag for description
      expect(undoContainer?.querySelectorAll('p')).toHaveLength(1);
    });

    it('should render close button', () => {
      render(<KeyboardShortcutsPanel {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<KeyboardShortcutsPanel {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Empty shortcuts', () => {
    it('should render with no shortcuts', () => {
      render(<KeyboardShortcutsPanel {...defaultProps} shortcuts={[]} />);

      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      expect(screen.queryByText('⌘S')).not.toBeInTheDocument();
    });
  });

  describe('Multiple shortcuts', () => {
    it('should render many shortcuts', () => {
      const manyShortcuts: ShortcutItem[] = Array.from({ length: 10 }, (_, i) => ({
        combo: `⌘${i}`,
        label: `Action ${i}`,
        description: `Description ${i}`,
      }));

      render(<KeyboardShortcutsPanel {...defaultProps} shortcuts={manyShortcuts} />);

      manyShortcuts.forEach((shortcut) => {
        expect(screen.getByText(shortcut.label)).toBeInTheDocument();
        expect(screen.getByText(shortcut.combo)).toBeInTheDocument();
      });
    });
  });

  describe('Props variations', () => {
    it('should use custom title', () => {
      render(<KeyboardShortcutsPanel {...defaultProps} title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should use custom description', () => {
      render(<KeyboardShortcutsPanel {...defaultProps} description="Custom description text" />);

      expect(screen.getByText('Custom description text')).toBeInTheDocument();
    });

    it('should use custom close label', () => {
      render(<KeyboardShortcutsPanel {...defaultProps} closeLabel="Dismiss" />);

      expect(screen.getByLabelText('Dismiss')).toBeInTheDocument();
    });
  });

  describe('Badge rendering', () => {
    it('should render each shortcut combo as a badge', () => {
      render(<KeyboardShortcutsPanel {...defaultProps} />);

      const badges = screen.getAllByTestId('badge');
      expect(badges).toHaveLength(mockShortcuts.length);
    });
  });
});
