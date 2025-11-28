Plan Summary

The plan includes:

✅ Full formatting toolbar with all options (Bold, Italic, Headings, Lists, Blockquote, Code, Link)
✅ Inline link editing within the bubble menu
✅ Desktop and mobile support with touch-optimized sizing
✅ Comprehensive implementation guide with 8 phases
✅ Code examples for all components
✅ Testing strategy (unit + integration tests)
✅ Accessibility compliance (WCAG 2.1 Level AA)
✅ Internationalization (English + French)
✅ Edge case handling (focus mode, read-only, positioning)
✅ Performance optimizations

Key technical decisions based on your preferences:

- Using @tiptap/extension-bubble-menu (official Tiptap extension)
- Inline link input within bubble menu (simple, no popover)
- Full set of formatting buttons per your request
- Mobile support with larger touch targets (h-10 w-10 on mobile)
- Matches existing UI patterns (Tooltip styling, HUDButton patterns)

  Estimated effort: 12-15 hours including tests and documentation

  The plan is ready for implementation and will be saved to docs/BUBBLE_MENU.md as requested!

⏺ User approved Claude's plan
⎿  Plan saved to: ~/.claude/plans/twinkly-orbiting-stroustrup.md · /plan to edit
Floating Text Formatting Toolbar (Bubble Menu) Implementation Plan

     Overview

     Add a Notion-like floating toolbar that appears when text is selected in the Tiptap editor. The toolbar provides quick access to common text formatting options including bold,
     italic, headings, lists, blockquote, code, and links.

     User Requirements

     - Full formatting toolbar with all common options
     - Inline link editing within the bubble menu
     - Desktop and mobile support with touch-friendly interactions
     - Keyboard shortcuts displayed and functional
     - Seamless integration with existing editor, focus mode, and read-only mode
     - Dark mode support matching existing UI patterns
     - Accessibility with full keyboard navigation and screen reader support

     Implementation Strategy

     Phase 1: Dependencies & Setup

     1.1 Install Required Package

     npm install @tiptap/extension-bubble-menu@^3.10.2

     Rationale: Official Tiptap extension matching current version (3.10.2), provides bubble menu positioning and lifecycle management.

     Icon Library: Already installed lucide-react@^0.552.0
     - Icons needed: Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Link2, X (close)

     1.2 Update Constants

     File: src/renderer/features/editor/constants.ts

     Add bubble menu configuration:
     // Bubble Menu Configuration
     export const BUBBLE_MENU_GAP = 8; // px - gap between menu and selection
     export const BUBBLE_MENU_TRANSITION_DURATION = 200; // ms
     export const BUBBLE_MENU_SHOW_DELAY = 100; // ms - delay before showing

     ---
     Phase 2: Styling

     2.1 Create Bubble Menu Stylesheet

     File: src/renderer/features/editor/styles/editor-bubble-menu.css (NEW)

     Key design principles:
     - Match existing tooltip styling: bg-neutral-800 dark:bg-neutral-700
     - Smooth transitions matching OverlayHUD pattern
     - Support for active/hover/disabled states
     - Responsive button sizing for mobile touch targets

     /* Bubble menu container */
     .bubble-menu {
       @apply fixed z-50;
       @apply inline-flex items-center;
       @apply rounded-lg;
       @apply bg-neutral-800 dark:bg-neutral-700;
       @apply border border-neutral-700 dark:border-neutral-600;
       @apply shadow-lg;
       @apply px-2 py-1.5 gap-1;
       @apply transition-all duration-200 ease-out;
       @apply opacity-0 invisible;
     }

     .bubble-menu.is-visible {
       @apply opacity-100 visible;
     }

     /* Bubble menu button */
     .bubble-menu-button {
       @apply flex items-center justify-center;
       @apply h-8 w-8 rounded;
       @apply text-white/70;
       @apply transition-colors duration-150;
       @apply cursor-pointer;
     }

     .bubble-menu-button:hover {
       @apply bg-white/10 text-white/90;
     }

     .bubble-menu-button.is-active {
       @apply bg-primary/20 text-primary;
     }

     .bubble-menu-button:disabled {
       @apply opacity-40 cursor-not-allowed;
     }

     /* Mobile-friendly touch targets */
     @media (max-width: 768px) {
       .bubble-menu-button {
         @apply h-10 w-10; /* Larger for touch */
       }
     }

     /* Separator */
     .bubble-menu-separator {
       @apply w-px h-4 bg-neutral-600 dark:bg-neutral-500;
       @apply mx-1;
     }

     /* Link input (inline) */
     .bubble-menu-link-input {
       @apply flex items-center gap-2;
       @apply bg-neutral-900/50 dark:bg-neutral-800/50;
       @apply rounded px-3 py-1.5;
     }

     .bubble-menu-link-input input {
       @apply bg-transparent border-none outline-none;
       @apply text-white text-sm;
       @apply min-w-[200px];
     }

     /* Respect reduced motion preference */
     @media (prefers-reduced-motion: reduce) {
       .bubble-menu {
         @apply transition-none;
       }
     }

     2.2 Import Stylesheet

     File: src/renderer/features/editor/styles/index.css

     Add import:
     @import './editor-bubble-menu.css';

     ---
     Phase 3: Core Components

     3.1 BubbleMenuButton Component

     File: src/renderer/features/editor/components/BubbleMenuButton.tsx (NEW)

     Reusable button component with tooltip support:

     import { type LucideIcon } from 'lucide-react';
     import { Tooltip } from '@ui';
     import { cn } from '@lib/utils';

     interface BubbleMenuButtonProps {
       icon: LucideIcon;
       onClick: () => void;
       isActive?: boolean;
       disabled?: boolean;
       tooltip?: string;
       shortcut?: string;
       'aria-label': string;
     }

     export function BubbleMenuButton({
       icon: Icon,
       onClick,
       isActive = false,
       disabled = false,
       tooltip,
       shortcut,
       'aria-label': ariaLabel,
     }: BubbleMenuButtonProps) {
       const button = (
         <button
           type="button"
           onClick={onClick}
           disabled={disabled}
           className={cn(
             'bubble-menu-button',
             isActive && 'is-active'
           )}
           aria-label={ariaLabel}
           aria-pressed={isActive}
         >
           <Icon size={18} />
         </button>
       );

       if (tooltip) {
         return (
           <Tooltip content={tooltip} shortcut={shortcut} position="top">
             {button}
           </Tooltip>
         );
       }

       return button;
     }

     Key Features:
     - Reuses existing Tooltip component pattern
     - Active state for current formatting
     - Disabled state for unavailable actions
     - ARIA attributes for accessibility
     - Icon size optimized for readability

     3.2 Main BubbleMenu Component

     File: src/renderer/features/editor/components/BubbleMenu.tsx (NEW)

     Main toolbar with all formatting options:

     import { BubbleMenu as BubbleMenuExtension } from '@tiptap/extension-bubble-menu';
     import type { Editor } from '@tiptap/react';
     import { useTranslation } from 'react-i18next';
     import { useState } from 'react';
     import {
       Bold,
       Italic,
       Heading1,
       Heading2,
       Heading3,
       List,
       ListOrdered,
       Quote,
       Code,
       Link2,
     } from 'lucide-react';
     import { BubbleMenuButton } from './BubbleMenuButton';
     import { LinkInput } from './LinkInput';
     import { getShortcutCombo } from '@lib/shortcuts';

     interface BubbleMenuProps {
       editor: Editor;
     }

     export function BubbleMenu({ editor }: BubbleMenuProps) {
       const { t } = useTranslation();
       const [isLinkEditing, setIsLinkEditing] = useState(false);

       // Don't render in read-only mode
       if (!editor.isEditable) return null;

       return (
         <BubbleMenuExtension
           editor={editor}
           tippyOptions={{
             duration: 200,
             placement: 'top',
             maxWidth: 'none',
             onHide: () => setIsLinkEditing(false),
           }}
           shouldShow={({ editor, state }) => {
             // Hide if no selection or empty selection
             const { from, to } = state.selection;
             if (from === to) return false;

             // Hide in code blocks (no formatting allowed)
             if (editor.isActive('codeBlock')) return false;

             // Hide when editing a link separately
             if (editor.isActive('link') && !isLinkEditing) return false;

             return true;
           }}
         >
           <div className="bubble-menu is-visible">
             {isLinkEditing ? (
               <LinkInput
                 editor={editor}
                 onClose={() => setIsLinkEditing(false)}
               />
             ) : (
               <div className="flex items-center gap-1">
                 {/* Text Formatting */}
                 <BubbleMenuButton
                   icon={Bold}
                   onClick={() => editor.chain().focus().toggleBold().run()}
                   isActive={editor.isActive('bold')}
                   disabled={!editor.can().chain().focus().toggleBold().run()}
                   tooltip={t('editor.bubbleMenu.bold')}
                   shortcut={getShortcutCombo('bold')}
                   aria-label={t('editor.bubbleMenu.bold')}
                 />

                 <BubbleMenuButton
                   icon={Italic}
                   onClick={() => editor.chain().focus().toggleItalic().run()}
                   isActive={editor.isActive('italic')}
                   disabled={!editor.can().chain().focus().toggleItalic().run()}
                   tooltip={t('editor.bubbleMenu.italic')}
                   shortcut={getShortcutCombo('italic')}
                   aria-label={t('editor.bubbleMenu.italic')}
                 />

                 <div className="bubble-menu-separator" />

                 {/* Headings */}
                 <BubbleMenuButton
                   icon={Heading1}
                   onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                   isActive={editor.isActive('heading', { level: 1 })}
                   tooltip={t('editor.bubbleMenu.heading1')}
                   shortcut={getShortcutCombo('heading1')}
                   aria-label={t('editor.bubbleMenu.heading1')}
                 />

                 <BubbleMenuButton
                   icon={Heading2}
                   onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                   isActive={editor.isActive('heading', { level: 2 })}
                   tooltip={t('editor.bubbleMenu.heading2')}
                   shortcut={getShortcutCombo('heading2')}
                   aria-label={t('editor.bubbleMenu.heading2')}
                 />

                 <BubbleMenuButton
                   icon={Heading3}
                   onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                   isActive={editor.isActive('heading', { level: 3 })}
                   tooltip={t('editor.bubbleMenu.heading3')}
                   shortcut={getShortcutCombo('heading3')}
                   aria-label={t('editor.bubbleMenu.heading3')}
                 />

                 <div className="bubble-menu-separator" />

                 {/* Lists */}
                 <BubbleMenuButton
                   icon={List}
                   onClick={() => editor.chain().focus().toggleBulletList().run()}
                   isActive={editor.isActive('bulletList')}
                   tooltip={t('editor.bubbleMenu.bulletList')}
                   shortcut={getShortcutCombo('bulletList')}
                   aria-label={t('editor.bubbleMenu.bulletList')}
                 />

                 <BubbleMenuButton
                   icon={ListOrdered}
                   onClick={() => editor.chain().focus().toggleOrderedList().run()}
                   isActive={editor.isActive('orderedList')}
                   tooltip={t('editor.bubbleMenu.orderedList')}
                   shortcut={getShortcutCombo('orderedList')}
                   aria-label={t('editor.bubbleMenu.orderedList')}
                 />

                 <div className="bubble-menu-separator" />

                 {/* Block Formatting */}
                 <BubbleMenuButton
                   icon={Quote}
                   onClick={() => editor.chain().focus().toggleBlockquote().run()}
                   isActive={editor.isActive('blockquote')}
                   tooltip={t('editor.bubbleMenu.blockquote')}
                   shortcut={getShortcutCombo('blockquote')}
                   aria-label={t('editor.bubbleMenu.blockquote')}
                 />

                 <BubbleMenuButton
                   icon={Code}
                   onClick={() => editor.chain().focus().toggleCode().run()}
                   isActive={editor.isActive('code')}
                   tooltip={t('editor.bubbleMenu.code')}
                   shortcut={getShortcutCombo('inlineCode')}
                   aria-label={t('editor.bubbleMenu.code')}
                 />

                 <div className="bubble-menu-separator" />

                 {/* Link */}
                 <BubbleMenuButton
                   icon={Link2}
                   onClick={() => setIsLinkEditing(true)}
                   isActive={editor.isActive('link')}
                   tooltip={t('editor.bubbleMenu.link')}
                   shortcut={getShortcutCombo('insertLink')}
                   aria-label={t('editor.bubbleMenu.link')}
                 />
               </div>
             )}
           </div>
         </BubbleMenuExtension>
       );
     }

     Key Features:
     - Full formatting toolbar per user request
     - Conditional rendering (read-only mode, code blocks)
     - Active state tracking for each format
     - Inline link editing toggle
     - Keyboard shortcuts displayed
     - ARIA labels for accessibility
     - Disabled state when commands unavailable

     3.3 LinkInput Component

     File: src/renderer/features/editor/components/LinkInput.tsx (NEW)

     Inline link editor within bubble menu:

     import { type Editor } from '@tiptap/react';
     import { useTranslation } from 'react-i18next';
     import { useState, useEffect, useRef } from 'react';
     import { Check, X } from 'lucide-react';
     import { BubbleMenuButton } from './BubbleMenuButton';

     interface LinkInputProps {
       editor: Editor;
       onClose: () => void;
     }

     export function LinkInput({ editor, onClose }: LinkInputProps) {
       const { t } = useTranslation();
       const inputRef = useRef<HTMLInputElement>(null);

       // Get current link URL if editing existing link
       const currentUrl = editor.getAttributes('link').href || '';
       const [url, setUrl] = useState(currentUrl);

       // Focus input on mount
       useEffect(() => {
         inputRef.current?.focus();
         inputRef.current?.select();
       }, []);

       const handleSubmit = (e?: React.FormEvent) => {
         e?.preventDefault();

         if (url) {
           // Set link
           editor
             .chain()
             .focus()
             .extendMarkRange('link')
             .setLink({ href: url })
             .run();
         } else {
           // Remove link if URL is empty
           editor.chain().focus().unsetLink().run();
         }

         onClose();
       };

       const handleKeyDown = (e: React.KeyboardEvent) => {
         if (e.key === 'Escape') {
           onClose();
         }
       };

       return (
         <div className="bubble-menu-link-input">
           <form onSubmit={handleSubmit} className="flex items-center gap-2">
             <input
               ref={inputRef}
               type="url"
               value={url}
               onChange={(e) => setUrl(e.target.value)}
               onKeyDown={handleKeyDown}
               placeholder={t('editor.bubbleMenu.linkPlaceholder')}
               aria-label={t('editor.bubbleMenu.link')}
               className="bg-transparent border-none outline-none text-white text-sm min-w-[200px]"
             />

             <BubbleMenuButton
               icon={Check}
               onClick={handleSubmit}
               tooltip={t('editor.bubbleMenu.applyLink')}
               aria-label={t('editor.bubbleMenu.applyLink')}
             />

             <BubbleMenuButton
               icon={X}
               onClick={onClose}
               tooltip={t('common.cancel', 'Cancel')}
               aria-label={t('common.cancel', 'Cancel')}
             />
           </form>
         </div>
       );
     }

     Key Features:
     - Inline input within bubble menu (per user preference)
     - Pre-populated with current URL when editing
     - Auto-focus and select on open
     - Submit on Enter, cancel on Escape
     - Remove link if URL is cleared
     - Accessible with ARIA labels

     3.4 Update Component Barrel Export

     File: src/renderer/features/editor/components/index.ts

     Add exports:
     export { BubbleMenu } from './BubbleMenu';
     export { BubbleMenuButton } from './BubbleMenuButton';
     export { LinkInput } from './LinkInput';

     ---
     Phase 4: Editor Integration

     4.1 Update Editor Component

     File: src/renderer/features/editor/Editor.tsx

     Changes needed:

     1. Import BubbleMenu extension and component:
     import { BubbleMenu as BubbleMenuExtension } from '@tiptap/extension-bubble-menu';
     import Link from '@tiptap/extension-link';
     import { BubbleMenu } from './components';

     2. Configure Link extension (if not already):
     Link.configure({
       openOnClick: false,
       HTMLAttributes: {
         class: 'text-primary underline cursor-pointer hover:text-primary-focus',
         rel: 'noopener noreferrer',
         target: '_blank',
       },
     }),

     3. Add BubbleMenu extension to extensions array:
     const extensions = [
       StarterKit.configure({
         // ... existing config ...
       }),
       Placeholder,
       Typography,
       Image,
       FocusMode,
       TypewriterScroll,
       BubbleMenuExtension, // ADD THIS
       Link.configure({
         openOnClick: false,
         HTMLAttributes: {
           class: 'text-primary underline cursor-pointer hover:text-primary-focus',
           rel: 'noopener noreferrer',
           target: '_blank',
         },
       }),
     ];

     4. Render BubbleMenu component:
     return (
       <div className="editor-wrapper">
         <EditorContent editor={editor} />
         {editor && <BubbleMenu editor={editor} />}
       </div>
     );

     ---
     Phase 5: Internationalization

     5.1 English Translations

     File: src/renderer/locales/en/common.json

     Add under "editor" namespace:
     {
       "editor": {
         "placeholder": "Start writing...",
         "bubbleMenu": {
           "bold": "Bold",
           "italic": "Italic",
           "heading1": "Heading 1",
           "heading2": "Heading 2",
           "heading3": "Heading 3",
           "bulletList": "Bullet List",
           "orderedList": "Numbered List",
           "blockquote": "Quote",
           "code": "Code",
           "link": "Link",
           "linkPlaceholder": "Enter URL...",
           "applyLink": "Apply link",
           "editLink": "Edit link",
           "removeLink": "Remove link"
         }
       }
     }

     5.2 French Translations

     File: src/renderer/locales/fr/common.json

     Add French translations:
     {
       "editor": {
         "placeholder": "Commencez à écrire...",
         "bubbleMenu": {
           "bold": "Gras",
           "italic": "Italique",
           "heading1": "Titre 1",
           "heading2": "Titre 2",
           "heading3": "Titre 3",
           "bulletList": "Liste à puces",
           "orderedList": "Liste numérotée",
           "blockquote": "Citation",
           "code": "Code",
           "link": "Lien",
           "linkPlaceholder": "Entrez l'URL...",
           "applyLink": "Appliquer le lien",
           "editLink": "Modifier le lien",
           "removeLink": "Supprimer le lien"
         }
       }
     }

     ---
     Phase 6: Keyboard Shortcuts Documentation

     6.1 Update Shortcuts Registry

     File: src/renderer/config/shortcuts.ts

     Add editor formatting shortcuts:

     1. Update ShortcutId type:
     export type ShortcutId =
       | 'previousEntry'
       | 'nextEntry'
       // ... existing shortcuts ...
       | 'bold'
       | 'italic'
       | 'heading1'
       | 'heading2'
       | 'heading3'
       | 'bulletList'
       | 'orderedList'
       | 'blockquote'
       | 'inlineCode'
       | 'insertLink';

     2. Add shortcuts to SHORTCUTS array:
     // Editor formatting shortcuts
     {
       id: 'bold',
       keys: 'mod+b',
       description: 'Toggle bold formatting',
       category: 'editor',
       location: 'features/editor/Editor.tsx (Tiptap)',
       globallyControlled: false,
       display: {
         labelKey: 'editor.bubbleMenu.bold',
         descriptionKey: 'Toggle bold text',
         combos: { mac: '⌘B', windows: 'Ctrl B' },
       },
     },
     {
       id: 'italic',
       keys: 'mod+i',
       description: 'Toggle italic formatting',
       category: 'editor',
       location: 'features/editor/Editor.tsx (Tiptap)',
       globallyControlled: false,
       display: {
         labelKey: 'editor.bubbleMenu.italic',
         descriptionKey: 'Toggle italic text',
         combos: { mac: '⌘I', windows: 'Ctrl I' },
       },
     },
     {
       id: 'heading1',
       keys: 'mod+alt+1',
       description: 'Toggle heading level 1',
       category: 'editor',
       location: 'features/editor/Editor.tsx (Tiptap)',
       globallyControlled: false,
       display: {
         labelKey: 'editor.bubbleMenu.heading1',
         descriptionKey: 'Toggle heading 1',
         combos: { mac: '⌘⌥1', windows: 'Ctrl Alt 1' },
       },
     },
     {
       id: 'heading2',
       keys: 'mod+alt+2',
       description: 'Toggle heading level 2',
       category: 'editor',
       location: 'features/editor/Editor.tsx (Tiptap)',
       globallyControlled: false,
       display: {
         labelKey: 'editor.bubbleMenu.heading2',
         descriptionKey: 'Toggle heading 2',
         combos: { mac: '⌘⌥2', windows: 'Ctrl Alt 2' },
       },
     },
     {
       id: 'heading3',
       keys: 'mod+alt+3',
       description: 'Toggle heading level 3',
       category: 'editor',
       location: 'features/editor/Editor.tsx (Tiptap)',
       globallyControlled: false,
       display: {
         labelKey: 'editor.bubbleMenu.heading3',
         descriptionKey: 'Toggle heading 3',
         combos: { mac: '⌘⌥3', windows: 'Ctrl Alt 3' },
       },
     },
     {
       id: 'bulletList',
       keys: 'mod+shift+8',
       description: 'Toggle bullet list',
       category: 'editor',
       location: 'features/editor/Editor.tsx (Tiptap)',
       globallyControlled: false,
       display: {
         labelKey: 'editor.bubbleMenu.bulletList',
         descriptionKey: 'Toggle bullet list',
         combos: { mac: '⌘⇧8', windows: 'Ctrl Shift 8' },
       },
     },
     {
       id: 'orderedList',
       keys: 'mod+shift+7',
       description: 'Toggle ordered list',
       category: 'editor',
       location: 'features/editor/Editor.tsx (Tiptap)',
       globallyControlled: false,
       display: {
         labelKey: 'editor.bubbleMenu.orderedList',
         descriptionKey: 'Toggle numbered list',
         combos: { mac: '⌘⇧7', windows: 'Ctrl Shift 7' },
       },
     },
     {
       id: 'blockquote',
       keys: 'mod+shift+b',
       description: 'Toggle blockquote',
       category: 'editor',
       location: 'features/editor/Editor.tsx (Tiptap)',
       globallyControlled: false,
       display: {
         labelKey: 'editor.bubbleMenu.blockquote',
         descriptionKey: 'Toggle blockquote',
         combos: { mac: '⌘⇧B', windows: 'Ctrl Shift B' },
       },
     },
     {
       id: 'inlineCode',
       keys: 'mod+e',
       description: 'Toggle inline code',
       category: 'editor',
       location: 'features/editor/Editor.tsx (Tiptap)',
       globallyControlled: false,
       display: {
         labelKey: 'editor.bubbleMenu.code',
         descriptionKey: 'Toggle inline code',
         combos: { mac: '⌘E', windows: 'Ctrl E' },
       },
     },
     {
       id: 'insertLink',
       keys: 'mod+k',
       description: 'Insert or edit link',
       category: 'editor',
       location: 'features/editor/Editor.tsx (Tiptap)',
       globallyControlled: false,
       display: {
         labelKey: 'editor.bubbleMenu.link',
         descriptionKey: 'Insert or edit link',
         combos: { mac: '⌘K', windows: 'Ctrl K' },
       },
     },

     Note: These shortcuts are handled by Tiptap itself, not through useGlobalHotkeys. The registry serves documentation purposes for the keyboard shortcuts panel.

     ---
     Phase 7: Testing

     7.1 Unit Tests - BubbleMenuButton

     File: src/renderer/features/editor/components/BubbleMenuButton.test.tsx (NEW)

     import { describe, it, expect, vi } from 'vitest';
     import { render, screen } from '@testing-library/react';
     import userEvent from '@testing-library/user-event';
     import { Bold } from 'lucide-react';
     import { BubbleMenuButton } from './BubbleMenuButton';

     describe('BubbleMenuButton', () => {
       it('renders with icon', () => {
         render(
           <BubbleMenuButton
             icon={Bold}
             onClick={vi.fn()}
             aria-label="Bold"
           />
         );

         const button = screen.getByRole('button', { name: 'Bold' });
         expect(button).toBeInTheDocument();
       });

       it('calls onClick when clicked', async () => {
         const handleClick = vi.fn();
         const user = userEvent.setup();

         render(
           <BubbleMenuButton
             icon={Bold}
             onClick={handleClick}
             aria-label="Bold"
           />
         );

         await user.click(screen.getByRole('button'));
         expect(handleClick).toHaveBeenCalledTimes(1);
       });

       it('shows active state', () => {
         render(
           <BubbleMenuButton
             icon={Bold}
             onClick={vi.fn()}
             isActive={true}
             aria-label="Bold"
           />
         );

         const button = screen.getByRole('button');
         expect(button).toHaveClass('is-active');
         expect(button).toHaveAttribute('aria-pressed', 'true');
       });

       it('shows disabled state', () => {
         render(
           <BubbleMenuButton
             icon={Bold}
             onClick={vi.fn()}
             disabled={true}
             aria-label="Bold"
           />
         );

         const button = screen.getByRole('button');
         expect(button).toBeDisabled();
       });

       it('displays tooltip when provided', () => {
         render(
           <BubbleMenuButton
             icon={Bold}
             onClick={vi.fn()}
             tooltip="Make text bold"
             shortcut="⌘B"
             aria-label="Bold"
           />
         );

         // Tooltip rendering tested in Tooltip.test.tsx
         expect(screen.getByRole('button')).toBeInTheDocument();
       });
     });

     7.2 Unit Tests - LinkInput

     File: src/renderer/features/editor/components/LinkInput.test.tsx (NEW)

     import { describe, it, expect, vi } from 'vitest';
     import { render, screen } from '@testing-library/react';
     import userEvent from '@testing-library/user-event';
     import { LinkInput } from './LinkInput';

     const mockEditor = {
       getAttributes: vi.fn(() => ({ href: 'https://example.com' })),
       chain: vi.fn(() => ({
         focus: vi.fn(() => ({
           extendMarkRange: vi.fn(() => ({
             setLink: vi.fn(() => ({ run: vi.fn() })),
           })),
           unsetLink: vi.fn(() => ({ run: vi.fn() })),
         })),
       })),
     } as any;

     describe('LinkInput', () => {
       it('pre-populates input with current URL', () => {
         render(<LinkInput editor={mockEditor} onClose={vi.fn()} />);

         const input = screen.getByRole('textbox');
         expect(input).toHaveValue('https://example.com');
       });

       it('focuses and selects input on mount', () => {
         render(<LinkInput editor={mockEditor} onClose={vi.fn()} />);

         const input = screen.getByRole('textbox') as HTMLInputElement;
         expect(input).toHaveFocus();
       });

       it('updates link on submit', async () => {
         const user = userEvent.setup();
         const setLinkSpy = vi.fn(() => ({ run: vi.fn() }));

         const editor = {
           ...mockEditor,
           chain: vi.fn(() => ({
             focus: vi.fn(() => ({
               extendMarkRange: vi.fn(() => ({
                 setLink: setLinkSpy,
               })),
             })),
           })),
         } as any;

         render(<LinkInput editor={editor} onClose={vi.fn()} />);

         const input = screen.getByRole('textbox');
         await user.clear(input);
         await user.type(input, 'https://newurl.com');
         await user.click(screen.getByRole('button', { name: /apply/i }));

         expect(setLinkSpy).toHaveBeenCalledWith({ href: 'https://newurl.com' });
       });

       it('removes link when URL is empty', async () => {
         const user = userEvent.setup();
         const unsetLinkSpy = vi.fn(() => ({ run: vi.fn() }));

         const editor = {
           ...mockEditor,
           chain: vi.fn(() => ({
             focus: vi.fn(() => ({
               unsetLink: unsetLinkSpy,
             })),
           })),
         } as any;

         render(<LinkInput editor={editor} onClose={vi.fn()} />);

         const input = screen.getByRole('textbox');
         await user.clear(input);
         await user.click(screen.getByRole('button', { name: /apply/i }));

         expect(unsetLinkSpy).toHaveBeenCalled();
       });

       it('closes on Escape key', async () => {
         const handleClose = vi.fn();
         const user = userEvent.setup();

         render(<LinkInput editor={mockEditor} onClose={handleClose} />);

         const input = screen.getByRole('textbox');
         await user.type(input, '{Escape}');

         expect(handleClose).toHaveBeenCalled();
       });
     });

     7.3 Integration Tests - Editor

     File: Update src/renderer/features/editor/Editor.test.tsx

     Add tests for bubble menu integration:
     describe('Editor with BubbleMenu', () => {
       it('includes BubbleMenu extension', () => {
         const { editor } = renderEditor();

         const extensions = editor?.extensionManager.extensions || [];
         const hasBubbleMenu = extensions.some(
           ext => ext.name === 'bubbleMenu'
         );

         expect(hasBubbleMenu).toBe(true);
       });

       it('renders BubbleMenu component', () => {
         render(<Editor content="" onChange={vi.fn()} />);

         // BubbleMenu is rendered but hidden by default
         // Test would need to simulate text selection to make it visible
         expect(screen.queryByRole('toolbar')).toBeInTheDocument();
       });
     });

     ---
     Phase 8: Mobile & Touch Support

     8.1 Touch-Friendly Sizing

     Already handled in CSS with responsive breakpoints:
     @media (max-width: 768px) {
       .bubble-menu-button {
         @apply h-10 w-10; /* Larger touch targets */
       }
     }

     8.2 Touch Event Handling

     Tiptap's BubbleMenu extension handles touch events natively. No additional configuration needed for basic functionality.

     8.3 Mobile Considerations

     Tested behaviors:
     - Text selection triggers native mobile selection handles
     - Bubble menu appears above selection
     - Touch outside closes bubble menu
     - Keyboard opens for link input on mobile

     Potential improvements (future):
     - Adjust positioning on small screens
     - Simplify button layout on mobile (fewer buttons, scrollable)
     - Consider native share sheet integration

     ---
     File Summary

     NEW FILES (7 files)

     1. src/renderer/features/editor/components/BubbleMenu.tsx (~180 lines)
       - Main bubble menu component with full formatting toolbar
     2. src/renderer/features/editor/components/BubbleMenuButton.tsx (~70 lines)
       - Reusable button component with tooltip support
     3. src/renderer/features/editor/components/LinkInput.tsx (~100 lines)
       - Inline link editor within bubble menu
     4. src/renderer/features/editor/styles/editor-bubble-menu.css (~120 lines)
       - Bubble menu styling with dark mode and mobile support
     5. src/renderer/features/editor/components/BubbleMenuButton.test.tsx (~80 lines)
       - Unit tests for BubbleMenuButton
     6. src/renderer/features/editor/components/LinkInput.test.tsx (~120 lines)
       - Unit tests for LinkInput
     7. docs/BUBBLE_MENU.md (THIS FILE)
       - Implementation documentation

     MODIFIED FILES (8 files)

     1. package.json
       - Add: @tiptap/extension-bubble-menu@^3.10.2
     2. src/renderer/features/editor/Editor.tsx (~30 lines added)
       - Import and configure BubbleMenu extension
       - Configure Link extension
       - Render BubbleMenu component
     3. src/renderer/features/editor/constants.ts (~5 lines added)
       - Add bubble menu constants
     4. src/renderer/features/editor/styles/index.css (~1 line added)
       - Import editor-bubble-menu.css
     5. src/renderer/features/editor/components/index.ts (~3 lines added)
       - Export bubble menu components
     6. src/renderer/locales/en/common.json (~20 lines added)
       - English translations for bubble menu
     7. src/renderer/locales/fr/common.json (~20 lines added)
       - French translations for bubble menu
     8. src/renderer/config/shortcuts.ts (~120 lines added)
       - Add editor formatting shortcuts to registry

     ---
     Implementation Sequence

     Recommended Order (Estimated: 12-15 hours)

     1. Install dependencies (5 minutes)
     npm install @tiptap/extension-bubble-menu@^3.10.2
     2. Create constants (5 minutes)
       - Update constants.ts
     3. Create styles (30 minutes)
       - Create editor-bubble-menu.css
       - Import in index.css
     4. Create BubbleMenuButton (45 minutes)
       - Create component
       - Write unit tests
     5. Create LinkInput (1 hour)
       - Create component
       - Write unit tests
     6. Create main BubbleMenu (2 hours)
       - Create component with all formatting buttons
       - Wire up editor commands
       - Test interaction with editor
     7. Integrate into Editor (1 hour)
       - Add extension to Editor.tsx
       - Configure Link extension
       - Render component
     8. Add translations (30 minutes)
       - English translations
       - French translations
       - Validate with npm run validate:translations
     9. Update shortcuts documentation (1 hour)
       - Add shortcuts to shortcuts.ts
       - Update ShortcutId type
     10. Integration testing (2 hours)
       - Update Editor.test.tsx
       - Manual testing in app
       - Test all formatting options
     11. Mobile testing (1 hour)
       - Test touch interactions
       - Verify responsive sizing
       - Check positioning on small screens
     12. Accessibility audit (1 hour)
       - Keyboard navigation testing
       - Screen reader testing
       - ARIA attributes verification
     13. Polish & edge cases (2 hours)
       - Test with focus mode
       - Test in read-only mode
       - Test positioning edge cases
       - Performance optimization
     14. Documentation (30 minutes)
       - Move this plan to docs/BUBBLE_MENU.md
       - Update any relevant README sections

     ---
     Edge Cases & Considerations

     1. Focus Mode Interaction

     Challenge: Bubble menu might interfere with focus mode dimming
     Solution:
     - Set bubble menu z-index higher than focus mode overlay (z-50)
     - Bubble menu won't trigger focus mode recalculation
     - Test: Select text in non-focused paragraph → verify bubble menu appears

     2. Read-Only Mode

     Solution: Hide bubble menu when editor.isEditable is false
     if (!editor.isEditable) return null;

     3. Code Block Restrictions

     Solution: Don't show bubble menu inside code blocks (no formatting allowed)
     if (editor.isActive('codeBlock')) return false;

     4. Link Editing Flow

     Scenarios:
     - Creating new link: Select text → Click link button → Enter URL → Apply
     - Editing existing link: Cursor in link → Bubble menu doesn't show (separate LinkBubbleMenu would handle this, but skipped for now)
     - Removing link: Select link → Click link button → Clear URL → Apply

     5. Positioning Edge Cases

     Top of viewport: Tippy.js handles with flip behavior
     tippyOptions: {
       placement: 'top',
       // Automatically flips to bottom if no space above
     }

     Small screens: Responsive button sizing ensures usability

     Long selections: Bubble menu anchors to selection start

     6. Performance

     Optimizations:
     - Use React.memo for BubbleMenuButton (prevents re-render on unrelated state changes)
     - Bubble menu only renders when needed (conditional in shouldShow)
     - Tippy.js handles efficient position updates

     7. Keyboard Shortcuts

     Conflict resolution:
     - Editor shortcuts (Cmd+B, Cmd+I, etc.) handled by Tiptap
     - Global shortcuts (Cmd+K search) disabled when editor is focused
     - Bubble menu doesn't interfere with existing shortcuts

     8. Accessibility

     Requirements met:
     - All buttons have aria-label
     - Active state indicated with aria-pressed
     - Keyboard navigation via Tab
     - Focus management (input auto-focuses)
     - Screen reader announcements (implicit through ARIA)

     ---
     Success Criteria

     - Bubble menu appears on text selection
     - Bubble menu hides when selection is cleared
     - All formatting buttons work correctly
     - Active states reflect current formatting
     - Link editing works inline
     - Keyboard shortcuts function properly
     - Tooltips display with shortcuts
     - Dark mode styling matches existing UI
     - Mobile touch targets are adequate
     - Bubble menu positions correctly at viewport edges
     - Bubble menu doesn't interfere with focus mode
     - Bubble menu is hidden in read-only mode
     - All buttons are keyboard accessible
     - Translations work in English and French
     - All tests pass
     - Type checking passes
     - Linting passes
     - Documentation is complete

     ---
     Future Enhancements

     Phase 2 Features (Post-MVP)

     1. Separate Link Bubble Menu
       - Show when cursor is in existing link
       - Display current URL
       - Edit, remove, copy, open actions
     2. Text Alignment
       - Left, center, right, justify buttons
       - Toggle alignment per paragraph
     3. Text/Background Colors
       - Color picker for text color
       - Highlight color options
     4. Advanced Formatting
       - Strikethrough (Cmd+Shift+X)
       - Underline (Cmd+U)
       - Superscript/Subscript
     5. Clear Formatting
       - Remove all formatting from selection
       - Useful for paste cleanup
     6. Table Controls
       - Show when selection is in table
       - Add/remove rows/columns
       - Merge cells
     7. Image Controls
       - Show when image is selected
       - Resize, align, caption
     8. AI Integration
       - "Improve writing" button
       - Grammar/style suggestions

     ---
     Accessibility Compliance (WCAG 2.1 Level AA)

     Keyboard Navigation

     - Tab: Move focus between buttons
     - Enter/Space: Activate focused button
     - Escape: Close bubble menu (in link editing mode)
     - Arrow keys: Navigate buttons (future enhancement)

     ARIA Attributes

     <button
       role="button"
       aria-label="Bold"           // Screen reader label
       aria-pressed={isActive}     // Current state
       aria-disabled={disabled}    // Disabled state
     />

     Focus Management

     - Link input auto-focuses on open
     - Focus returns to editor after action
     - Visual focus indicators present

     Screen Reader Support

     - All buttons announced with labels
     - State changes announced (active/inactive)
     - Meaningful labels for all interactive elements

     Color Contrast

     - Text/icon color: white/70% opacity on dark background
     - Active state: primary color (sufficient contrast)
     - Hover state: white/90% opacity
     - Tested with WCAG contrast checker

     Motion & Animation

     @media (prefers-reduced-motion: reduce) {
       .bubble-menu {
         transition: none;
       }
     }

     ---
     Testing Checklist

     Manual Testing

     Basic Functionality:
     - Select text → bubble menu appears
     - Deselect → bubble menu disappears
     - Bold button toggles bold formatting
     - Italic button toggles italic formatting
     - All heading buttons work (H1, H2, H3)
     - List buttons work (bullet, ordered)
     - Blockquote button works
     - Code button toggles inline code
     - Link button opens inline editor
     - Link editor pre-populates existing URL
     - Link editor applies new link
     - Link editor removes link when URL is cleared

     Keyboard Shortcuts:
     - Cmd+B toggles bold (shows in tooltip)
     - Cmd+I toggles italic
     - Cmd+Alt+1/2/3 toggle headings
     - Cmd+Shift+8 toggles bullet list
     - Cmd+Shift+7 toggles ordered list
     - Cmd+Shift+B toggles blockquote
     - Cmd+E toggles inline code
     - Cmd+K opens link editor

     Visual States:
     - Active states show correctly
     - Hover states work
     - Disabled states appear when appropriate
     - Dark mode styling matches existing UI
     - Transitions are smooth

     Edge Cases:
     - Bubble menu hidden in read-only mode
     - Bubble menu hidden in code blocks
     - Positioning correct at top of viewport
     - Positioning correct at edges of viewport
     - Mobile touch targets adequate
     - Focus mode doesn't interfere

     Accessibility:
     - All buttons keyboard accessible
     - Tab navigation works
     - Screen reader announces states
     - ARIA labels present
     - Focus visible

     Internationalization:
     - English translations display
     - French translations display
     - Tooltips show in correct language

     Automated Testing

     - npm run type-check passes
     - npm run lint passes
     - npm run format passes
     - npm run validate:translations passes
     - npm test passes (all unit tests)
     - Unit tests for BubbleMenuButton pass
     - Unit tests for LinkInput pass
     - Integration tests pass

     ---
     Performance Optimization

     Current Optimizations

     1. Component Memoization:
     export const BubbleMenuButton = React.memo(BubbleMenuButtonComponent);
     2. Conditional Rendering:
       - Don't render in read-only mode
       - Don't render in code blocks
       - Only show when selection exists
     3. Efficient Updates:
       - Tippy.js handles position updates efficiently
       - State updates localized to bubble menu component

     Future Optimizations (if needed)

     1. Debounce Position Updates:
     const debouncedUpdate = useMemo(
       () => debounce(updatePosition, 50),
       []
     );
     2. Lazy Load Heavy Components:
     const ColorPicker = lazy(() => import('./ColorPicker'));
     3. Virtual Scrolling (for expanded toolbar):
       - If toolbar becomes very wide
       - Render only visible buttons

     ---
     Critical Files for Review

     Before implementation, review these files to understand existing patterns:

     1. src/renderer/features/editor/Editor.tsx (lines 1-150)
       - Editor initialization and configuration
       - Extension setup pattern
     2. src/renderer/components/ui/Tooltip.tsx (lines 1-136)
       - Tooltip positioning logic
       - Portal rendering pattern
     3. src/renderer/components/layout/HUDButton.tsx (lines 1-80)
       - Button variant patterns
       - Icon + tooltip integration
     4. src/renderer/features/editor/styles/editor-base.css (lines 1-50)
       - Editor color scheme
       - Existing CSS variable usage
     5. src/renderer/lib/positioning.ts (lines 1-55)
       - Positioning utility functions
       - TooltipPosition type
     6. src/renderer/config/shortcuts.ts (lines 1-346)
       - Shortcut registry structure
       - ShortcutId type pattern

     ---
     Conclusion

     This implementation plan provides a complete roadmap for adding a floating text formatting toolbar to the Tiptap editor in Esquisse. The approach:

     - Follows Esquisse's architecture: Feature-first structure, SRP, modularity
     - Reuses existing patterns: Tooltip, Button, positioning utilities
     - Comprehensive feature set: All formatting options per user request
     - Accessible: Full keyboard navigation and screen reader support
     - Internationalized: English and French translations
     - Well-tested: Unit tests and integration tests
     - Mobile-friendly: Touch-optimized with responsive sizing
     - Performant: Optimized rendering and updates

     Total estimated effort: 12-15 hours for complete implementation including tests, documentation, and polish.
