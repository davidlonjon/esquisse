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
    };
  },

  addProseMirrorPlugins() {
    const { enabled, offset } = this.options;

    if (!enabled) {
      return [];
    }

    return [
      new Plugin({
        key: new PluginKey('typewriterScroll'),
        view() {
          return {
            update(view) {
              // Get the cursor position
              const { from } = view.state.selection;
              const coords = view.coordsAtPos(from);

              if (!coords) return;

              // Get viewport dimensions
              const viewportHeight = window.innerHeight;
              const targetY = viewportHeight * offset;

              // Calculate scroll position
              const currentScroll = window.scrollY;
              const cursorTop = coords.top;
              const scrollDiff = cursorTop - targetY;

              // Smooth scroll to keep cursor at target position (>50px threshold)
              if (Math.abs(scrollDiff) > 50) {
                window.scrollTo({
                  top: currentScroll + scrollDiff,
                  behavior: 'smooth',
                });
              }
            },
          };
        },
      }),
    ];
  },
});
