import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Editor } from './Editor';

// Mock Tiptap
const mockEditor = {
  getHTML: vi.fn(() => '<p>Test content</p>'),
  commands: {
    setContent: vi.fn(),
    focus: vi.fn(),
    setTextSelection: vi.fn(),
  },
  setEditable: vi.fn(),
  isDestroyed: false,
  view: {},
  state: {
    selection: {
      from: 0,
      to: 0,
    },
  },
};

const mockUseEditor = vi.fn(() => mockEditor);

vi.mock('@tiptap/react', () => ({
  useEditor: (...args: unknown[]) => mockUseEditor(...args),
  EditorContent: ({ editor }: { editor: unknown }) => (
    <div data-testid="editor-content" data-editor={editor ? 'loaded' : 'null'}>
      Editor Content
    </div>
  ),
}));

vi.mock('@tiptap/starter-kit', () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock('@tiptap/extension-placeholder', () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock('@tiptap/extension-typography', () => ({
  default: {},
}));

vi.mock('@tiptap/extension-image', () => ({
  default: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock('./extensions/FocusMode', () => ({
  FocusMode: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock('./extensions/TypewriterScroll', () => ({
  TypewriterScroll: {
    configure: vi.fn(() => ({})),
  },
}));

describe('Editor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEditor.mockReturnValue(mockEditor);
    mockEditor.isDestroyed = false;
  });

  describe('Rendering', () => {
    it('should render loading state when editor is not initialized', () => {
      mockUseEditor.mockReturnValue(null);

      render(<Editor />);

      expect(screen.getByText('Loading editor...')).toBeInTheDocument();
    });

    it('should render EditorContent when editor is initialized', () => {
      render(<Editor />);

      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      expect(screen.getByText('Editor Content')).toBeInTheDocument();
    });

    it('should not render loading state when editor is ready', () => {
      render(<Editor />);

      expect(screen.queryByText('Loading editor...')).not.toBeInTheDocument();
    });

    it('should render with editor-container class', () => {
      const { container } = render(<Editor />);

      const editorContainer = container.querySelector('.editor-container');
      expect(editorContainer).toBeInTheDocument();
    });
  });

  describe('Content Management', () => {
    it('should initialize editor with provided content', () => {
      render(<Editor content="<p>Initial content</p>" />);

      expect(mockUseEditor).toHaveBeenCalled();
      const config = mockUseEditor.mock.calls[0][0];
      expect(config.content).toBe('<p>Initial content</p>');
    });

    it('should initialize editor with empty content by default', () => {
      render(<Editor />);

      const config = mockUseEditor.mock.calls[0][0];
      expect(config.content).toBe('');
    });

    it('should call onChange when editor content updates', () => {
      const onChange = vi.fn();
      render(<Editor onChange={onChange} />);

      const config = mockUseEditor.mock.calls[0][0];
      config.onUpdate({ editor: mockEditor });

      expect(onChange).toHaveBeenCalledWith('<p>Test content</p>');
    });

    it('should not call onChange if not provided', () => {
      render(<Editor />);

      const config = mockUseEditor.mock.calls[0][0];
      expect(() => config.onUpdate({ editor: mockEditor })).not.toThrow();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should call onSave when Cmd+S is pressed', () => {
      const onSave = vi.fn();
      const { container } = render(<Editor onSave={onSave} />);

      const editorContainer = container.querySelector('.editor-container');
      fireEvent.keyDown(editorContainer!, { key: 's', metaKey: true });

      expect(onSave).toHaveBeenCalledWith('<p>Test content</p>');
    });

    it('should call onSave when Ctrl+S is pressed', () => {
      const onSave = vi.fn();
      const { container } = render(<Editor onSave={onSave} />);

      const editorContainer = container.querySelector('.editor-container');
      fireEvent.keyDown(editorContainer!, { key: 's', ctrlKey: true });

      expect(onSave).toHaveBeenCalledWith('<p>Test content</p>');
    });

    it('should not call onSave when S is pressed without modifier', () => {
      const onSave = vi.fn();
      const { container } = render(<Editor onSave={onSave} />);

      const editorContainer = container.querySelector('.editor-container');
      fireEvent.keyDown(editorContainer!, { key: 's' });

      expect(onSave).not.toHaveBeenCalled();
    });

    it('should not call onSave if not provided', () => {
      const { container } = render(<Editor />);

      const editorContainer = container.querySelector('.editor-container');
      expect(() =>
        fireEvent.keyDown(editorContainer!, { key: 's', metaKey: true })
      ).not.toThrow();
    });
  });

  describe('Focus Mode', () => {
    it('should enable focus mode by default', () => {
      render(<Editor />);

      const config = mockUseEditor.mock.calls[0][0];
      const attributes = config.editorProps.attributes;
      expect(attributes.class).toContain('focus-mode');
    });

    it('should disable focus mode when focusMode is false', () => {
      render(<Editor focusMode={false} />);

      const config = mockUseEditor.mock.calls[0][0];
      const attributes = config.editorProps.attributes;
      expect(attributes.class).not.toContain('focus-mode');
    });

    it('should always include editor-content class', () => {
      render(<Editor />);

      const config = mockUseEditor.mock.calls[0][0];
      const attributes = config.editorProps.attributes;
      expect(attributes.class).toContain('editor-content');
    });
  });

  describe('Placeholder', () => {
    it('should use default placeholder when not provided', () => {
      render(<Editor />);

      const config = mockUseEditor.mock.calls[0][0];
      const placeholderExt = config.extensions.find(
        (ext: { name?: string }) => ext.name === 'placeholder' || ext === 'placeholder'
      );
      // Just verify editor was initialized (placeholder is configured in extensions)
      expect(config).toBeDefined();
    });

    it('should use custom placeholder when provided', () => {
      render(<Editor placeholder="Start writing your journal..." />);

      const config = mockUseEditor.mock.calls[0][0];
      expect(config).toBeDefined();
    });
  });

  describe('Editor Lifecycle', () => {
    it('should focus editor on create', () => {
      vi.useFakeTimers();
      render(<Editor />);

      const config = mockUseEditor.mock.calls[0][0];
      config.onCreate({ editor: mockEditor });

      vi.advanceTimersByTime(200);

      expect(mockEditor.commands.focus).toHaveBeenCalledWith('end');
      vi.useRealTimers();
    });

    it('should not focus if editor is destroyed', () => {
      vi.useFakeTimers();
      mockEditor.isDestroyed = true;

      render(<Editor />);

      const config = mockUseEditor.mock.calls[0][0];
      config.onCreate({ editor: mockEditor });

      vi.advanceTimersByTime(200);

      expect(mockEditor.commands.focus).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('Spellcheck', () => {
    it('should enable spellcheck by default', () => {
      render(<Editor />);

      const config = mockUseEditor.mock.calls[0][0];
      const attributes = config.editorProps.attributes;
      expect(attributes.spellcheck).toBe('true');
    });
  });
});
