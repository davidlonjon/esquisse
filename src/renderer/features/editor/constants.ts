/**
 * Editor configuration constants
 * Centralized configuration values for the editor component
 */

// Layout
export const EDITOR_MAX_WIDTH = 700; // px
export const EDITOR_MIN_HEIGHT = '70vh';
export const EDITOR_PADDING = '2rem';

// Typography
export const EDITOR_FONT_FAMILY =
  "ui-monospace, 'SFMono-Regular', 'JetBrains Mono', 'Fira Code', 'Menlo', 'Consolas', 'Liberation Mono', 'Courier New', monospace";
export const EDITOR_FONT_SIZE = 16; // px
export const EDITOR_LINE_HEIGHT = 1.75;

// Timing
export const AUTO_SAVE_DELAY = 2000; // ms - debounce delay for auto-save
export const EDITOR_FOCUS_DELAY = 200; // ms - delay before focusing editor on mount

// Focus Mode
export const FOCUS_MODE_OPACITY = 0.3; // opacity for dimmed paragraphs
export const FOCUS_MODE_TRANSITION = 'opacity 0.2s ease';

// Typewriter Mode
export const TYPEWRITER_OFFSET = 0.5; // 50% of viewport height
export const TYPEWRITER_THRESHOLD = 4; // px - minimum scroll distance before triggering

// Placeholder
export const DEFAULT_PLACEHOLDER = 'Start writing...';

// Heading Levels
export const HEADING_LEVELS = [1, 2, 3] as Array<1 | 2 | 3 | 4 | 5 | 6>;

export const HUD_AUTO_HIDE_DELAY = 5000; // ms - HUD auto-hide duration

// Bubble menu configuration
export const BUBBLE_MENU_GAP = 8; // px - gap between menu and selection
export const BUBBLE_MENU_TRANSITION_DURATION = 200; // ms
export const BUBBLE_MENU_SHOW_DELAY = 100; // ms - delay before showing
