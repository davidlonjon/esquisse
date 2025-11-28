import type { Editor } from '@tiptap/react';
import { Check, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BubbleMenuButton } from './BubbleMenuButton';

interface LinkInputProps {
  editor: Editor;
  onClose: () => void;
}

export function LinkInput({ editor, onClose }: LinkInputProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(() => editor.getAttributes('link')?.href ?? '');

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const applyLink = () => {
    const trimmedUrl = url.trim();
    const chain = editor.chain().focus();

    if (trimmedUrl) {
      chain.extendMarkRange('link').setLink({ href: trimmedUrl }).run();
    } else {
      chain.unsetLink().run();
    }

    onClose();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyLink();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div className="bubble-menu__link">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('editor.bubbleMenu.linkPlaceholder')}
          aria-label={t('editor.bubbleMenu.link')}
        />

        <BubbleMenuButton
          icon={Check}
          onClick={applyLink}
          tooltip={t('editor.bubbleMenu.applyLink')}
          aria-label={t('editor.bubbleMenu.applyLink')}
        />

        <BubbleMenuButton
          icon={X}
          onClick={onClose}
          tooltip={t('editor.bubbleMenu.cancel')}
          aria-label={t('editor.bubbleMenu.cancel')}
        />
      </form>
    </div>
  );
}
