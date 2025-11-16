import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { Toggle } from './Toggle';

describe('Toggle', () => {
  describe('Rendering', () => {
    it('should render checkbox input', () => {
      render(<Toggle aria-label="Toggle option" />);
      const toggle = screen.getByRole('checkbox');
      expect(toggle).toBeInTheDocument();
    });

    it('should have type="checkbox"', () => {
      render(<Toggle data-testid="toggle" />);
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveAttribute('type', 'checkbox');
    });

    it('should forward ref to input element', () => {
      const ref = { current: null };
      render(<Toggle ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Variants', () => {
    it('should apply default variant classes', () => {
      render(<Toggle data-testid="toggle" />);
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveClass('toggle', 'toggle-primary');
    });

    it('should apply secondary variant', () => {
      render(<Toggle variant="secondary" data-testid="toggle" />);
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveClass('toggle-secondary');
    });

    it('should apply accent variant', () => {
      render(<Toggle variant="accent" data-testid="toggle" />);
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveClass('toggle-accent');
    });
  });

  describe('Sizes', () => {
    it('should apply default size (no additional class)', () => {
      render(<Toggle data-testid="toggle" />);
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveClass('toggle');
      expect(toggle).not.toHaveClass('toggle-lg', 'toggle-sm', 'toggle-xs');
    });

    it('should apply large size', () => {
      render(<Toggle size="lg" data-testid="toggle" />);
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveClass('toggle-lg');
    });

    it('should apply small size', () => {
      render(<Toggle size="sm" data-testid="toggle" />);
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveClass('toggle-sm');
    });

    it('should apply extra small size', () => {
      render(<Toggle size="xs" data-testid="toggle" />);
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveClass('toggle-xs');
    });
  });

  describe('Custom className', () => {
    it('should merge custom className with variant classes', () => {
      render(<Toggle className="custom-toggle" data-testid="toggle" />);
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveClass('toggle', 'toggle-primary', 'custom-toggle');
    });
  });

  describe('Checked state', () => {
    it('should be unchecked by default', () => {
      render(<Toggle aria-label="Toggle" />);
      const toggle = screen.getByRole('checkbox');
      expect(toggle).not.toBeChecked();
    });

    it('should handle checked prop', () => {
      render(<Toggle checked onChange={() => {}} aria-label="Toggle" />);
      const toggle = screen.getByRole('checkbox');
      expect(toggle).toBeChecked();
    });

    it('should handle defaultChecked prop', () => {
      render(<Toggle defaultChecked aria-label="Toggle" />);
      const toggle = screen.getByRole('checkbox');
      expect(toggle).toBeChecked();
    });
  });

  describe('HTML Attributes', () => {
    it('should handle disabled state', () => {
      render(<Toggle disabled aria-label="Toggle" />);
      const toggle = screen.getByRole('checkbox');
      expect(toggle).toBeDisabled();
    });

    it('should handle name attribute', () => {
      render(<Toggle name="notifications" data-testid="toggle" />);
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveAttribute('name', 'notifications');
    });

    it('should handle aria-label', () => {
      render(<Toggle aria-label="Enable feature" />);
      const toggle = screen.getByLabelText('Enable feature');
      expect(toggle).toBeInTheDocument();
    });

    it('should handle required attribute', () => {
      render(<Toggle required aria-label="Toggle" />);
      const toggle = screen.getByRole('checkbox');
      expect(toggle).toBeRequired();
    });
  });

  describe('Interactions', () => {
    it('should toggle checked state on click', async () => {
      const user = userEvent.setup();
      render(<Toggle aria-label="Toggle" />);
      const toggle = screen.getByRole('checkbox');

      expect(toggle).not.toBeChecked();

      await user.click(toggle);
      expect(toggle).toBeChecked();

      await user.click(toggle);
      expect(toggle).not.toBeChecked();
    });

    it('should call onChange handler when toggled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Toggle onChange={handleChange} aria-label="Toggle" />);
      const toggle = screen.getByRole('checkbox');

      await user.click(toggle);

      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should not toggle when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Toggle disabled onChange={handleChange} aria-label="Toggle" />);
      const toggle = screen.getByRole('checkbox');

      await user.click(toggle);

      expect(handleChange).not.toHaveBeenCalled();
      expect(toggle).not.toBeChecked();
    });

    it('should support keyboard interaction (Space)', async () => {
      const user = userEvent.setup();
      render(<Toggle aria-label="Toggle" />);
      const toggle = screen.getByRole('checkbox');

      toggle.focus();
      expect(toggle).not.toBeChecked();

      await user.keyboard(' ');
      expect(toggle).toBeChecked();
    });
  });

  describe('Controlled component', () => {
    it('should work as controlled component', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      const { rerender } = render(
        <Toggle checked={false} onChange={handleChange} aria-label="Toggle" />
      );
      const toggle = screen.getByRole('checkbox');

      expect(toggle).not.toBeChecked();

      await user.click(toggle);
      expect(handleChange).toHaveBeenCalled();

      // Simulate parent updating checked prop
      rerender(<Toggle checked={true} onChange={handleChange} aria-label="Toggle" />);
      expect(toggle).toBeChecked();
    });
  });

  describe('Combination of props', () => {
    it('should combine variant and size', () => {
      render(<Toggle variant="accent" size="lg" data-testid="toggle" />);
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveClass('toggle-accent', 'toggle-lg');
    });
  });
});
