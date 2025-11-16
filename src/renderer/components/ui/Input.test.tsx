import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { Input } from './Input';

describe('Input', () => {
  describe('Rendering', () => {
    it('should render input element', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text..." />);
      expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
    });

    it('should forward ref to input element', () => {
      const ref = { current: null };
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Variants', () => {
    it('should apply default variant classes', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('input', 'input-bordered', 'input-md');
    });

    it('should apply ghost variant', () => {
      render(<Input variant="ghost" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('input-ghost');
    });
  });

  describe('Sizes', () => {
    it('should apply default size', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('input-md');
    });

    it('should apply large size', () => {
      render(<Input size="lg" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('input-lg');
    });

    it('should apply small size', () => {
      render(<Input size="sm" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('input-sm');
    });

    it('should apply extra small size', () => {
      render(<Input size="xs" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('input-xs');
    });
  });

  describe('Custom className', () => {
    it('should merge custom className with variant classes', () => {
      render(<Input className="custom-input" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('input', 'input-bordered', 'custom-input');
    });
  });

  describe('Input types', () => {
    it('should default to text type when no type specified', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input') as HTMLInputElement;
      // Input type defaults to 'text' even without explicit attribute
      expect(input.type).toBe('text');
    });

    it('should support email type', () => {
      render(<Input type="email" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should support password type', () => {
      render(<Input type="password" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should support number type', () => {
      render(<Input type="number" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('HTML Attributes', () => {
    it('should handle disabled state', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should handle readOnly state', () => {
      render(<Input readOnly />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
    });

    it('should handle required attribute', () => {
      render(<Input required />);
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });

    it('should handle maxLength attribute', () => {
      render(<Input maxLength={10} data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('maxLength', '10');
    });

    it('should handle name attribute', () => {
      render(<Input name="username" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('name', 'username');
    });

    it('should handle value attribute', () => {
      render(<Input value="test value" onChange={() => {}} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('test value');
    });

    it('should handle defaultValue attribute', () => {
      render(<Input defaultValue="default text" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('default text');
    });
  });

  describe('Interactions', () => {
    it('should call onChange handler when typing', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'Hello');

      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('Hello');
    });

    it('should call onFocus handler', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();

      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');

      await user.click(input);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onBlur handler', async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();

      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      await user.tab();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Input onChange={handleChange} disabled />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'text');

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Combination of props', () => {
    it('should combine variant and size', () => {
      render(<Input variant="ghost" size="lg" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('input-ghost', 'input-lg');
    });
  });
});
