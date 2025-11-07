/* eslint-disable import/no-named-as-default */
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
/* eslint-enable import/no-named-as-default */
import { useEffect } from 'react';

import {
  DEFAULT_PLACEHOLDER,
  EDITOR_FOCUS_DELAY,
  HEADING_LEVELS,
  TYPEWRITER_OFFSET,
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
  focusMode: _focusMode = true,
  typewriterMode = true,
}: EditorProps) {
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: {
            levels: HEADING_LEVELS,
          },
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
        FocusMode.configure({
          className: 'is-active',
          mode: 'paragraph',
        }),
        TypewriterScroll.configure({
          enabled: typewriterMode,
          offset: TYPEWRITER_OFFSET,
        }),
      ],
      content,
      editorProps: {
        attributes: {
          class: 'editor-content',
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
    if (editor && content && content !== editor.getHTML()) {
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

  // Show loading state while editor initializes
  if (!editor) {
    return <div style={{ padding: '2rem' }}>Loading editor...</div>;
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
    </div>
  );
}
