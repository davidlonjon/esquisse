import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

import { FocusMode } from './extensions/FocusMode';
import { TypewriterScroll } from './extensions/TypewriterScroll';

import './Editor.css';

interface EditorProps {
  content?: string;
  placeholder?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  focusMode?: boolean;
  typewriterMode?: boolean;
}

export function Editor({
  content = '',
  placeholder = 'Start writing...',
  onChange,
  onSave,
  focusMode = true,
  typewriterMode = true,
}: EditorProps) {
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
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
          offset: 0.5,
        }),
      ],
      content,
      editorProps: {
        attributes: {
          class: 'editor-content',
          spellcheck: 'true',
          style: 'min-height: 70vh; outline: none;',
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
        }, 200);
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
    <div
      className="editor-container"
      onKeyDown={handleKeyDown}
      style={{
        width: '100%',
        height: '100vh',
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '700px',
          fontFamily: "'IBM Plex Mono', 'Courier New', Courier, monospace",
          fontSize: '16px',
          lineHeight: '1.75',
          color: '#0a0a0a',
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
