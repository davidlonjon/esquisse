import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { EditorErrorToast } from './EditorErrorToast';

describe('EditorErrorToast', () => {
  describe('Rendering', () => {
    it('should render error message', () => {
      render(<EditorErrorToast message="Failed to save entry" />);

      expect(screen.getByText('Failed to save entry')).toBeInTheDocument();
    });

    it('should render with correct styling classes', () => {
      const { container } = render(<EditorErrorToast message="Error message" />);

      const toast = container.firstChild;
      expect(toast).toHaveClass('fixed', 'right-4', 'top-4');
      expect(toast).toHaveClass('border-destructive', 'bg-destructive/10', 'text-destructive');
    });

    it('should render at fixed position top-right', () => {
      const { container } = render(<EditorErrorToast message="Error" />);

      const toast = container.firstChild;
      expect(toast).toHaveClass('right-4', 'top-4');
    });
  });

  describe('Dismiss Button', () => {
    it('should render dismiss button when onDismiss is provided', () => {
      render(<EditorErrorToast message="Error" onDismiss={vi.fn()} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss error/i });
      expect(dismissButton).toBeInTheDocument();
    });

    it('should not render dismiss button when onDismiss is not provided', () => {
      render(<EditorErrorToast message="Error" />);

      expect(screen.queryByRole('button', { name: /dismiss error/i })).not.toBeInTheDocument();
    });

    it('should call onDismiss when dismiss button is clicked', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();

      render(<EditorErrorToast message="Error" onDismiss={onDismiss} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss error/i });
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should have accessible label for dismiss button', () => {
      render(<EditorErrorToast message="Error" onDismiss={vi.fn()} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss error/i });
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss error');
    });

    it('should render × character in dismiss button', () => {
      render(<EditorErrorToast message="Error" onDismiss={vi.fn()} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss error/i });
      expect(dismissButton).toHaveTextContent('×');
    });
  });

  describe('Message Content', () => {
    it('should render short error message', () => {
      render(<EditorErrorToast message="Error" />);

      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should render long error message', () => {
      const longMessage =
        'Failed to save the entry to the database. Please check your connection and try again.';
      render(<EditorErrorToast message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should render message in a paragraph', () => {
      render(<EditorErrorToast message="Error message" />);

      const messageParagraph = screen.getByText('Error message');
      expect(messageParagraph.tagName).toBe('P');
    });
  });

  describe('Layout and Structure', () => {
    it('should use flex layout for message and button', () => {
      const { container } = render(<EditorErrorToast message="Error" onDismiss={vi.fn()} />);

      const flexDiv = container.querySelector('.flex');
      expect(flexDiv).toBeInTheDocument();
      expect(flexDiv).toHaveClass('items-start', 'gap-2');
    });

    it('should constrain max width', () => {
      const { container } = render(<EditorErrorToast message="Error" />);

      const toast = container.firstChild;
      expect(toast).toHaveClass('max-w-sm');
    });

    it('should have rounded corners', () => {
      const { container } = render(<EditorErrorToast message="Error" />);

      const toast = container.firstChild;
      expect(toast).toHaveClass('rounded-lg');
    });
  });
});
