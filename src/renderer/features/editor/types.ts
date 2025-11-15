/**
 * Type definitions for the Editor component
 */

/**
 * Props for the Editor component
 */
export interface EditorProps {
  /** Initial HTML content to display in the editor */
  content?: string;

  /** Placeholder text shown when editor is empty */
  placeholder?: string;

  /** Callback fired when editor content changes */
  onChange?: (content: string) => void;

  /** Callback fired when user manually saves (Cmd/Ctrl+S) */
  onSave?: (content: string) => void;

  /** Enable focus mode (dims inactive paragraphs) */
  focusMode?: boolean;

  /** Enable typewriter mode (keeps cursor centered) */
  typewriterMode?: boolean;
}

/**
 * Options for FocusMode extension
 */
export interface FocusModeOptions {
  /** CSS class to apply to active paragraph */
  className: string;

  /** Focus mode type */
  mode: 'paragraph' | 'sentence';
}

/**
 * Options for TypewriterScroll extension
 */
export interface TypewriterScrollOptions {
  /** Enable typewriter scrolling */
  enabled: boolean;

  /** Vertical offset (0.5 = 50% of viewport height) */
  offset: number;

  /** Minimum scroll delta before moving container */
  threshold?: number;
}
