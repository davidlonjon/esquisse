import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { LinkInput } from './LinkInput';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const buildEditor = () => {
  const setLinkRun = vi.fn();
  const setLinkSpy = vi.fn(() => ({ run: setLinkRun }));
  const unsetLinkRun = vi.fn();
  const unsetLinkSpy = vi.fn(() => ({ run: unsetLinkRun }));
  const extendMarkRangeSpy = vi.fn(() => ({
    setLink: setLinkSpy,
  }));
  const focusSpy = vi.fn(() => ({
    extendMarkRange: extendMarkRangeSpy,
    setLink: setLinkSpy,
    unsetLink: unsetLinkSpy,
  }));
  const chainSpy = vi.fn(() => ({
    focus: focusSpy,
  }));

  const editor = {
    getAttributes: vi.fn(() => ({ href: 'https://example.com' })),
    chain: chainSpy,
  } as unknown as import('@tiptap/react').Editor;

  return { editor, setLinkSpy, unsetLinkSpy };
};

describe('LinkInput', () => {
  it('pre-populates the input with the current link', () => {
    const { editor } = buildEditor();

    render(<LinkInput editor={editor} onClose={vi.fn()} />);

    expect(screen.getByRole('textbox')).toHaveValue('https://example.com');
  });

  it('focuses the input on mount', () => {
    const { editor } = buildEditor();

    render(<LinkInput editor={editor} onClose={vi.fn()} />);

    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('applies a new link on submit', async () => {
    const user = userEvent.setup();
    const { editor, setLinkSpy } = buildEditor();
    const handleClose = vi.fn();

    render(<LinkInput editor={editor} onClose={handleClose} />);

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'https://newlink.test');
    await user.click(screen.getByRole('button', { name: 'editor.bubbleMenu.applyLink' }));

    expect(setLinkSpy).toHaveBeenCalledWith({ href: 'https://newlink.test' });
    expect(handleClose).toHaveBeenCalled();
  });

  it('removes the link when URL is empty', async () => {
    const user = userEvent.setup();
    const { editor, unsetLinkSpy } = buildEditor();

    render(<LinkInput editor={editor} onClose={vi.fn()} />);

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.click(screen.getByRole('button', { name: 'editor.bubbleMenu.applyLink' }));

    expect(unsetLinkSpy).toHaveBeenCalled();
  });

  it('closes when Escape is pressed', async () => {
    const user = userEvent.setup();
    const { editor } = buildEditor();
    const handleClose = vi.fn();

    render(<LinkInput editor={editor} onClose={handleClose} />);

    const input = screen.getByRole('textbox');
    await user.type(input, '{Escape}');

    expect(handleClose).toHaveBeenCalled();
  });
});
