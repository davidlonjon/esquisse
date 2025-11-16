import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { EditorStatus } from './EditorStatus';

describe('EditorStatus', () => {
  describe('Loading State', () => {
    it('should render loading message when status is loading', () => {
      render(<EditorStatus status="loading" initializingLabel="Loading editor..." />);

      expect(screen.getByText('Loading editor...')).toBeInTheDocument();
    });

    it('should render initializing message when status is idle', () => {
      render(<EditorStatus status="idle" initializingLabel="Initializing..." />);

      expect(screen.getByText('Initializing...')).toBeInTheDocument();
    });

    it('should not render error UI when status is loading', () => {
      render(<EditorStatus status="loading" initializingLabel="Loading..." />);

      expect(screen.queryByText(/Unable to initialize/)).not.toBeInTheDocument();
    });

    it('should render with correct classes for loading state', () => {
      const { container } = render(
        <EditorStatus status="loading" initializingLabel="Loading..." />
      );

      const rootDiv = container.firstChild;
      expect(rootDiv).toHaveClass('flex', 'h-screen', 'w-screen');
    });
  });

  describe('Error State', () => {
    it('should render error message when status is error', () => {
      render(
        <EditorStatus
          status="error"
          initializingLabel="Loading..."
          errorMessage="Failed to load database"
        />
      );

      expect(screen.getByText('Failed to load database')).toBeInTheDocument();
    });

    it('should render default error message when errorMessage is not provided', () => {
      render(<EditorStatus status="error" initializingLabel="Loading..." />);

      expect(screen.getByText('Unable to initialize the editor.')).toBeInTheDocument();
    });

    it('should not render default error when errorMessage is provided', () => {
      render(
        <EditorStatus
          status="error"
          initializingLabel="Loading..."
          errorMessage="Custom error"
        />
      );

      expect(screen.queryByText('Unable to initialize the editor.')).not.toBeInTheDocument();
    });

    it('should render error UI with correct styling', () => {
      const { container } = render(
        <EditorStatus
          status="error"
          initializingLabel="Loading..."
          errorMessage="Error occurred"
        />
      );

      const errorDiv = container.querySelector('.border-destructive');
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv).toHaveClass('bg-destructive/10', 'text-destructive');
    });

    it('should not render initializing label when in error state', () => {
      render(
        <EditorStatus
          status="error"
          initializingLabel="Loading..."
          errorMessage="Error occurred"
        />
      );

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('Different Status Values', () => {
    it('should handle idle status', () => {
      render(<EditorStatus status="idle" initializingLabel="Idle state" />);

      expect(screen.getByText('Idle state')).toBeInTheDocument();
    });

    it('should handle loading status', () => {
      render(<EditorStatus status="loading" initializingLabel="Loading state" />);

      expect(screen.getByText('Loading state')).toBeInTheDocument();
    });

    it('should handle error status', () => {
      render(
        <EditorStatus status="error" initializingLabel="Error state" errorMessage="Error!" />
      );

      expect(screen.getByText('Error!')).toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    it('should render centered content for loading state', () => {
      const { container } = render(
        <EditorStatus status="loading" initializingLabel="Loading..." />
      );

      const rootDiv = container.firstChild;
      expect(rootDiv).toHaveClass('items-center', 'justify-center');
    });

    it('should render centered content for error state', () => {
      const { container } = render(
        <EditorStatus status="error" initializingLabel="Loading..." errorMessage="Error" />
      );

      const rootDiv = container.firstChild;
      expect(rootDiv).toHaveClass('items-center', 'justify-center');
    });

    it('should use full screen dimensions', () => {
      const { container } = render(
        <EditorStatus status="loading" initializingLabel="Loading..." />
      );

      const rootDiv = container.firstChild;
      expect(rootDiv).toHaveClass('h-screen', 'w-screen');
    });
  });
});
