import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

import type { TypewriterScrollOptions } from '../types';

/**
 * TypewriterScroll Extension
 * Keeps the cursor vertically centered while typing
 * Inspired by iA Writer's typewriter mode
 */
export const TypewriterScroll = Extension.create<TypewriterScrollOptions>({
  name: 'typewriterScroll',

  addOptions() {
    return {
      enabled: true,
      offset: 0.5, // Center the cursor
      threshold: 4,
    };
  },

  addProseMirrorPlugins() {
    const { enabled, offset, threshold = 4 } = this.options;

    if (!enabled) {
      return [];
    }

    return [
      new Plugin({
        key: new PluginKey('typewriterScroll'),
        view(editorView) {
          const scrollSelector = '.editor-container';
          const pluginThreshold = threshold;

          const centerCursor = () => {
            const { selection } = editorView.state;
            if (!selection.empty) {
              return;
            }

            let coords;
            try {
              coords = editorView.coordsAtPos(selection.from);
            } catch {
              return;
            }

            const scrollElement =
              (editorView.dom.closest(scrollSelector) as HTMLElement | null) ??
              document.scrollingElement ??
              document.documentElement;

            const isElement = scrollElement instanceof HTMLElement;
            const containerHeight = isElement ? scrollElement.clientHeight : window.innerHeight;

            // Target: center of the visible container area
            const targetY = containerHeight * offset;

            const cursorOffset = isElement
              ? coords.top - scrollElement.getBoundingClientRect().top + scrollElement.scrollTop
              : coords.top + window.scrollY;

            // How far cursor is from target center position
            const scrollDiff = coords.top - targetY;

            if (Math.abs(scrollDiff) <= pluginThreshold) {
              return;
            }

            const maxScroll = isElement
              ? scrollElement.scrollHeight - scrollElement.clientHeight
              : document.documentElement.scrollHeight - window.innerHeight;

            // Scroll so cursor ends up at target position
            const nextScroll = Math.max(0, Math.min(cursorOffset - targetY, maxScroll));

            if (isElement) {
              scrollElement.scrollTop = nextScroll;
            } else {
              window.scrollTo({ top: nextScroll });
            }
          };

          let rafId: number | null = null;

          const scheduleCenter = () => {
            if (rafId !== null) {
              cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(() => {
              rafId = null;
              centerCursor();
            });
          };

          // Initial centering with a small delay to ensure DOM is ready
          setTimeout(scheduleCenter, 100);

          return {
            update(view, prevState) {
              const selectionUnchanged = view.state.selection.eq(prevState.selection);
              const docUnchanged = view.state.doc.eq(prevState.doc);

              if (selectionUnchanged && docUnchanged) {
                return;
              }

              scheduleCenter();
            },
            destroy() {
              if (rafId !== null) {
                cancelAnimationFrame(rafId);
              }
            },
          };
        },
      }),
    ];
  },
});
