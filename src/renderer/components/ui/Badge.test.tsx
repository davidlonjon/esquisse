import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Badge } from './Badge';

describe('Badge', () => {
  describe('Rendering', () => {
    it('should render badge with text', () => {
      render(<Badge>New</Badge>);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should render as div element', () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText('Test');
      expect(badge.tagName).toBe('DIV');
    });

    it('should render children content', () => {
      render(
        <Badge>
          <span>Custom content</span>
        </Badge>
      );
      expect(screen.getByText('Custom content')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should apply default variant classes', () => {
      render(<Badge>Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('badge', 'badge-neutral');
    });

    it('should apply primary variant', () => {
      render(<Badge variant="primary">Primary</Badge>);
      const badge = screen.getByText('Primary');
      expect(badge).toHaveClass('badge-primary');
    });

    it('should apply secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      const badge = screen.getByText('Secondary');
      expect(badge).toHaveClass('badge-secondary');
    });

    it('should apply accent variant', () => {
      render(<Badge variant="accent">Accent</Badge>);
      const badge = screen.getByText('Accent');
      expect(badge).toHaveClass('badge-accent');
    });

    it('should apply ghost variant', () => {
      render(<Badge variant="ghost">Ghost</Badge>);
      const badge = screen.getByText('Ghost');
      expect(badge).toHaveClass('badge-ghost');
    });

    it('should apply outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText('Outline');
      expect(badge).toHaveClass('badge-outline');
    });
  });

  describe('Custom className', () => {
    it('should merge custom className with variant classes', () => {
      render(<Badge className="custom-badge">Custom</Badge>);
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('badge', 'badge-neutral', 'custom-badge');
    });

    it('should override variant classes with custom className', () => {
      render(
        <Badge variant="primary" className="custom-color">
          Override
        </Badge>
      );
      const badge = screen.getByText('Override');
      expect(badge).toHaveClass('badge-primary', 'custom-color');
    });
  });

  describe('HTML Attributes', () => {
    it('should apply data attributes', () => {
      render(<Badge data-testid="status-badge">Status</Badge>);
      const badge = screen.getByTestId('status-badge');
      expect(badge).toBeInTheDocument();
    });

    it('should apply aria-label', () => {
      render(<Badge aria-label="Status indicator">3</Badge>);
      const badge = screen.getByLabelText('Status indicator');
      expect(badge).toBeInTheDocument();
    });

    it('should apply id attribute', () => {
      render(<Badge id="notification-badge">5</Badge>);
      const badge = screen.getByText('5');
      expect(badge).toHaveAttribute('id', 'notification-badge');
    });
  });

  describe('Content types', () => {
    it('should render numeric content', () => {
      render(<Badge>42</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render empty badge', () => {
      const { container } = render(<Badge />);
      const badge = container.querySelector('.badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toBeEmptyDOMElement();
    });

    it('should render badge with icon', () => {
      render(
        <Badge>
          <svg data-testid="icon" />
        </Badge>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });
});
