import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  describe('Rendering', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('should render as button element by default', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should forward ref to button element', () => {
      const ref = { current: null };
      render(<Button ref={ref}>Test</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Variants', () => {
    it('should apply default variant classes', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn', 'btn-primary', 'btn-md');
    });

    it('should apply destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-error');
    });

    it('should apply outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-outline');
    });

    it('should apply secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-secondary');
    });

    it('should apply ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-ghost');
    });

    it('should apply link variant', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-link');
    });
  });

  describe('Sizes', () => {
    it('should apply default size', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-md');
    });

    it('should apply small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-sm');
    });

    it('should apply large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-lg');
    });

    it('should apply extra small size', () => {
      render(<Button size="xs">Tiny</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-xs');
    });
  });

  describe('Shapes', () => {
    it('should apply default shape (no additional class)', () => {
      render(<Button>Default Shape</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('btn-circle', 'btn-square');
    });

    it('should apply circle shape', () => {
      render(<Button shape="circle">○</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-circle');
    });

    it('should apply square shape', () => {
      render(<Button shape="square">□</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-square');
    });
  });

  describe('Custom className', () => {
    it('should merge custom className with variants', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn', 'btn-primary', 'custom-class');
    });
  });

  describe('HTML Attributes', () => {
    it('should handle disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should handle type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should handle aria-label', () => {
      render(<Button aria-label="Close dialog">×</Button>);
      const button = screen.getByRole('button', { name: 'Close dialog' });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClick handler', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByRole('button');

      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );
      const button = screen.getByRole('button');

      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Combination of variants', () => {
    it('should apply multiple variants together', () => {
      render(
        <Button variant="outline" size="lg" shape="circle">
          Large Outline Circle
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-outline', 'btn-lg', 'btn-circle');
    });
  });
});
