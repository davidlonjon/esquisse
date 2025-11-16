import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { EditorPage } from './EditorPage';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockController = {
  status: 'success' as const,
  initializingLabel: '',
  initializationMessage: '',
  hud: {
    isVisible: true,
    dateLabel: 'Monday, Jan 1',
    wordCountLabel: '150 words',
    sessionLabel: '5min',
    snapshotLabel: 'Saved',
  },
  content: '<p>Test content</p>',
  handleContentChange: vi.fn(),
  handleManualSave: vi.fn(),
  placeholder: 'Start writing...',
  apiError: null,
  clearApiError: vi.fn(),
};

vi.mock('@hooks/useEditorController', () => ({
  useEditorController: () => mockController,
}));

vi.mock('@features/editor', () => ({
  Editor: ({ content, onChange, placeholder }: { content: string; onChange: () => void; placeholder: string }) => (
    <div data-testid="editor" data-content={content} data-placeholder={placeholder} onClick={onChange}>
      Editor Component
    </div>
  ),
}));

vi.mock('@features/editor/components', () => ({
  EditorHud: ({ dateLabel, wordCountLabel }: { dateLabel: string; wordCountLabel: string }) => (
    <div data-testid="editor-hud">
      {dateLabel} - {wordCountLabel}
    </div>
  ),
  EditorStatus: ({ status }: { status: string }) => <div data-testid="editor-status">{status}</div>,
  EditorErrorToast: ({ message }: { message: string }) => (
    <div data-testid="editor-error-toast">{message}</div>
  ),
}));

describe('EditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.api
    Object.defineProperty(window, 'api', {
      writable: true,
      configurable: true,
      value: {},
    });
  });

  describe('API Availability Check', () => {
    it('should render error message when window.api is not available', () => {
      Object.defineProperty(window, 'api', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      render(<EditorPage />);

      expect(screen.getByText('app.errors.apiUnavailableTitle')).toBeInTheDocument();
      expect(screen.getByText('app.errors.apiUnavailableMessage')).toBeInTheDocument();
    });

    it('should not render editor when API is unavailable', () => {
      Object.defineProperty(window, 'api', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      render(<EditorPage />);

      expect(screen.queryByTestId('editor')).not.toBeInTheDocument();
    });
  });

  describe('Initialization States', () => {
    it('should render EditorStatus when controller status is not success', () => {
      mockController.status = 'loading';
      mockController.initializingLabel = 'Loading...';

      render(<EditorPage />);

      expect(screen.getByTestId('editor-status')).toBeInTheDocument();
      expect(screen.getByText('loading')).toBeInTheDocument();
    });

    it('should not render editor during loading', () => {
      mockController.status = 'loading';

      render(<EditorPage />);

      expect(screen.queryByTestId('editor')).not.toBeInTheDocument();
    });

    it('should render EditorStatus when controller status is error', () => {
      mockController.status = 'error';
      mockController.initializationMessage = 'Failed to load';

      render(<EditorPage />);

      expect(screen.getByTestId('editor-status')).toBeInTheDocument();
    });
  });

  describe('Successful Initialization', () => {
    beforeEach(() => {
      mockController.status = 'success';
      mockController.apiError = null;
    });

    it('should render EditorHud when status is success', () => {
      render(<EditorPage />);

      expect(screen.getByTestId('editor-hud')).toBeInTheDocument();
      expect(screen.getByText(/Monday, Jan 1/)).toBeInTheDocument();
      expect(screen.getByText(/150 words/)).toBeInTheDocument();
    });

    it('should render Editor component when status is success', () => {
      render(<EditorPage />);

      expect(screen.getByTestId('editor')).toBeInTheDocument();
      expect(screen.getByText('Editor Component')).toBeInTheDocument();
    });

    it('should pass content to Editor', () => {
      mockController.content = '<p>My journal entry</p>';

      render(<EditorPage />);

      const editor = screen.getByTestId('editor');
      expect(editor).toHaveAttribute('data-content', '<p>My journal entry</p>');
    });

    it('should pass placeholder to Editor', () => {
      mockController.placeholder = 'Write your thoughts...';

      render(<EditorPage />);

      const editor = screen.getByTestId('editor');
      expect(editor).toHaveAttribute('data-placeholder', 'Write your thoughts...');
    });

    it('should not render EditorErrorToast when there is no API error', () => {
      mockController.apiError = null;

      render(<EditorPage />);

      expect(screen.queryByTestId('editor-error-toast')).not.toBeInTheDocument();
    });

    it('should render EditorErrorToast when there is an API error', () => {
      mockController.apiError = 'Failed to save entry';

      render(<EditorPage />);

      expect(screen.getByTestId('editor-error-toast')).toBeInTheDocument();
      expect(screen.getByText('Failed to save entry')).toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    beforeEach(() => {
      mockController.status = 'success';
    });

    it('should render with correct root structure', () => {
      const { container } = render(<EditorPage />);

      const root = container.firstChild;
      expect(root).toHaveClass('relative', 'h-screen', 'w-screen');
    });

    it('should render HUD and Editor together', () => {
      render(<EditorPage />);

      expect(screen.getByTestId('editor-hud')).toBeInTheDocument();
      expect(screen.getByTestId('editor')).toBeInTheDocument();
    });
  });
});
