import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

import { BubbleMenu } from './components';
import {
  DEFAULT_PLACEHOLDER,
  EDITOR_FOCUS_DELAY,
  HEADING_LEVELS,
  TYPEWRITER_OFFSET,
  TYPEWRITER_THRESHOLD,
} from './constants';
import { FocusMode } from './extensions/FocusMode';
import { TypewriterScroll } from './extensions/TypewriterScroll';
import type { EditorProps } from './types';

import './styles/index.css';

/**
 * Editor component
 * A minimalist rich text editor with iA Writer-inspired design
 * Features: focus mode, typewriter scrolling, auto-save, Markdown shortcuts
 */
export function Editor({
  content = '',
  placeholder = DEFAULT_PLACEHOLDER,
  onChange,
  onSave,
  focusMode = true,
  typewriterMode = true,
  editable = true,
}: EditorProps) {
  const editorClassNames = ['editor-content'];

  if (focusMode) {
    editorClassNames.push('focus-mode');
  }

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: {
            levels: HEADING_LEVELS,
          },
          link: false,
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass: 'is-editor-empty',
        }),
        Typography,
        Image.configure({
          HTMLAttributes: {
            class: 'editor-image',
          },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'editor-link',
            rel: 'noopener noreferrer',
            target: '_blank',
          },
        }),
        ...(focusMode
          ? [
              FocusMode.configure({
                className: 'is-active',
                mode: 'paragraph',
              }),
            ]
          : []),
        TypewriterScroll.configure({
          enabled: typewriterMode,
          offset: TYPEWRITER_OFFSET,
          threshold: TYPEWRITER_THRESHOLD,
        }),
      ],
      content,
      editable,
      editorProps: {
        attributes: {
          class: editorClassNames.join(' '),
          spellcheck: 'true',
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        onChange?.(html);
      },
      onCreate: ({ editor }) => {
        // Focus the editor on mount with proper checks
        setTimeout(() => {
          if (editor && editor.view && !editor.isDestroyed) {
            try {
              editor.commands.focus('end');
            } catch (error) {
              console.warn('[Editor] Failed to focus:', error);
            }
          }
        }, EDITOR_FOCUS_DELAY);
      },
    },
    []
  ); // Empty dependency array to prevent re-initialization

  // Update content when it changes externally (not from user typing)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      const { from, to } = editor.state.selection;
      editor.commands.setContent(content, { emitUpdate: false });
      // Restore cursor position if possible
      try {
        editor.commands.setTextSelection({ from, to });
      } catch {
        // Ignore if position is invalid after content change
      }
    }
  }, [content, editor]);

  // Control editor editability
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // Ensure editor is focused when editable
  useEffect(() => {
    if (!editor || editor.isDestroyed || !editable) return;

    // Only focus if the editor view is fully initialized
    const focusEditor = () => {
      if (editor.isDestroyed) return;

      // Check if view and its required methods exist
      if (editor.view && editor.view.hasFocus !== undefined) {
        editor.commands.focus('start');
      }
    };

    // Use a longer timeout to ensure view is fully initialized
    const timeoutId = setTimeout(focusEditor, 200);

    return () => clearTimeout(timeoutId);
  }, [editor, editable]);

  // Show loading state while editor initializes
  if (!editor) {
    return <div className="p-8 text-muted-foreground">Loading editor...</div>;
  }

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + S to save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      if (editor) {
        onSave?.(editor.getHTML());
      }
    }
  };

  return (
    <div className="editor-container" onKeyDown={handleKeyDown}>
      <EditorContent editor={editor} />
      {editor && <BubbleMenu editor={editor} />}
    </div>
  );
}
