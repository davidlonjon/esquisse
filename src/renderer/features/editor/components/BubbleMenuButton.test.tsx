import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bold } from 'lucide-react';
import { describe, it, expect, vi } from 'vitest';

import { BubbleMenuButton } from './BubbleMenuButton';

describe('BubbleMenuButton', () => {
  it('renders a button with the provided aria label', () => {
    render(<BubbleMenuButton icon={Bold} onClick={vi.fn()} aria-label="Bold" />);

    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
  });

  it('calls onClick when activated', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<BubbleMenuButton icon={Bold} onClick={handleClick} aria-label="Bold" />);

    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies active styling and aria-pressed', () => {
    render(<BubbleMenuButton icon={Bold} onClick={vi.fn()} isActive aria-label="Bold" />);

    const button = screen.getByRole('button', { name: 'Bold' });
    expect(button).toHaveClass('is-active');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('respects disabled state', () => {
    render(<BubbleMenuButton icon={Bold} onClick={vi.fn()} disabled aria-label="Bold" />);

    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled();
  });

  it('renders tooltip when provided', () => {
    render(
      <BubbleMenuButton
        icon={Bold}
        onClick={vi.fn()}
        tooltip="Toggle bold"
        shortcut="⌘B"
        aria-label="Bold"
      />
    );

    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
  });
});
