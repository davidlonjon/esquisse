import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { EditorHud } from './EditorHud';

// Mock OverlayHUD
vi.mock('@layout/OverlayHUD', () => ({
  OverlayHUD: ({
    showTop,
    showBottom,
    dateLabel,
    wordCountLabel,
    sessionLabel,
    snapshotLabel,
    disabled,
  }: {
    showTop: boolean;
    showBottom: boolean;
    dateLabel: string;
    wordCountLabel: string;
    sessionLabel: string;
    snapshotLabel: string;
    disabled: boolean;
  }) => (
    <div data-testid="overlay-hud">
      <div data-testid="show-top">{String(showTop)}</div>
      <div data-testid="show-bottom">{String(showBottom)}</div>
      <div data-testid="date-label">{dateLabel}</div>
      <div data-testid="word-count-label">{wordCountLabel}</div>
      <div data-testid="session-label">{sessionLabel}</div>
      <div data-testid="snapshot-label">{snapshotLabel}</div>
      <div data-testid="disabled">{String(disabled)}</div>
    </div>
  ),
}));

describe('EditorHud', () => {
  const defaultProps = {
    isVisible: true,
    isReadOnly: false,
    dateLabel: 'Monday, Jan 1',
    wordCountLabel: '150 words',
    sessionLabel: '5min',
    snapshotLabel: 'Saved',
    lastUpdatedLabel: 'Last updated Jan 1',
    disabled: false,
    isFavorite: false,
    onToggleFavorite: vi.fn(),
  };

  describe('Rendering', () => {
    it('should render OverlayHUD', () => {
      render(<EditorHud {...defaultProps} />);

      expect(screen.getByTestId('overlay-hud')).toBeInTheDocument();
    });

    it('should pass isVisible to both showTop and showBottom', () => {
      render(<EditorHud {...defaultProps} isVisible={true} />);

      expect(screen.getByTestId('show-top')).toHaveTextContent('true');
      expect(screen.getByTestId('show-bottom')).toHaveTextContent('true');
    });

    it('should hide HUD when isVisible is false', () => {
      render(<EditorHud {...defaultProps} isVisible={false} />);

      expect(screen.getByTestId('show-top')).toHaveTextContent('false');
      expect(screen.getByTestId('show-bottom')).toHaveTextContent('false');
    });
  });

  describe('Label Props', () => {
    it('should pass dateLabel to OverlayHUD', () => {
      render(<EditorHud {...defaultProps} dateLabel="Tuesday, Jan 2" />);

      expect(screen.getByTestId('date-label')).toHaveTextContent('Tuesday, Jan 2');
    });

    it('should pass wordCountLabel to OverlayHUD', () => {
      render(<EditorHud {...defaultProps} wordCountLabel="200 words" />);

      expect(screen.getByTestId('word-count-label')).toHaveTextContent('200 words');
    });

    it('should pass sessionLabel to OverlayHUD', () => {
      render(<EditorHud {...defaultProps} sessionLabel="10min" />);

      expect(screen.getByTestId('session-label')).toHaveTextContent('10min');
    });

    it('should pass snapshotLabel to OverlayHUD', () => {
      render(<EditorHud {...defaultProps} snapshotLabel="Saving..." />);

      expect(screen.getByTestId('snapshot-label')).toHaveTextContent('Saving...');
    });

    it('should pass all labels correctly', () => {
      render(<EditorHud {...defaultProps} />);

      expect(screen.getByTestId('date-label')).toHaveTextContent('Monday, Jan 1');
      expect(screen.getByTestId('word-count-label')).toHaveTextContent('150 words');
      expect(screen.getByTestId('session-label')).toHaveTextContent('5min');
      expect(screen.getByTestId('snapshot-label')).toHaveTextContent('Saved');
    });
  });

  describe('Disabled State', () => {
    it('should pass disabled prop to OverlayHUD', () => {
      render(<EditorHud {...defaultProps} disabled={true} />);

      expect(screen.getByTestId('disabled')).toHaveTextContent('true');
    });

    it('should pass enabled state to OverlayHUD', () => {
      render(<EditorHud {...defaultProps} disabled={false} />);

      expect(screen.getByTestId('disabled')).toHaveTextContent('false');
    });
  });
});
