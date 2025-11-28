import type { Editor } from '@tiptap/core';
import { BubbleMenu as TiptapBubbleMenu } from '@tiptap/react/menus';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
} from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { getShortcutCombo } from '@lib/shortcuts';

import { BUBBLE_MENU_GAP, BUBBLE_MENU_SHOW_DELAY } from '../constants';

import { BubbleMenuButton } from './BubbleMenuButton';
import { LinkInput } from './LinkInput';

interface BubbleMenuProps {
  editor: Editor;
}

export function BubbleMenu({ editor }: BubbleMenuProps) {
  const { t } = useTranslation();
  const [isLinkEditing, setIsLinkEditing] = useState(false);

  if (!editor.isEditable) {
    return null;
  }

  const shouldShow: NonNullable<ComponentProps<typeof TiptapBubbleMenu>['shouldShow']> = ({
    state,
  }) => {
    if (!editor.isEditable) return false;
    if (state.selection.empty) return false;
    if (editor.isActive('codeBlock')) return false;
    return true;
  };

  const linkButtonLabel = t('editor.bubbleMenu.link');

  return (
    <TiptapBubbleMenu
      editor={editor}
      shouldShow={shouldShow}
      updateDelay={BUBBLE_MENU_SHOW_DELAY}
      options={{
        offset: BUBBLE_MENU_GAP,
        onHide: () => setIsLinkEditing(false),
      }}
    >
      <div
        className="bubble-menu"
        role="toolbar"
        aria-label={t('editor.bubbleMenu.label', { defaultValue: 'Text formatting' })}
      >
        {isLinkEditing ? (
          <LinkInput editor={editor} onClose={() => setIsLinkEditing(false)} />
        ) : (
          <div className="flex items-center gap-1">
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

            <div className="bubble-menu__separator" />

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

            <div className="bubble-menu__separator" />

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

            <div className="bubble-menu__separator" />

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

            <div className="bubble-menu__separator" />

            <BubbleMenuButton
              icon={Link2}
              onClick={() => setIsLinkEditing(true)}
              isActive={editor.isActive('link')}
              tooltip={linkButtonLabel}
              shortcut={getShortcutCombo('insertLink')}
              aria-label={linkButtonLabel}
            />
          </div>
        )}
      </div>
    </TiptapBubbleMenu>
  );
}
