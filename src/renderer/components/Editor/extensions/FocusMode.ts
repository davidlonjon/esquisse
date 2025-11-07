import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

import type { FocusModeOptions } from '../types';

/**
 * FocusMode Extension
 * Highlights the active paragraph/sentence and dims the rest
 * Inspired by iA Writer's focus mode
 */
export const FocusMode = Extension.create<FocusModeOptions>({
  name: 'focusMode',

  addOptions() {
    return {
      className: 'is-active',
      mode: 'paragraph',
    };
  },

  addProseMirrorPlugins() {
    const { mode, className } = this.options;

    return [
      new Plugin({
        key: new PluginKey('focusMode'),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, _oldState) {
            // Get the current selection
            const { $from } = tr.selection;
            const decorations: Decoration[] = [];

            if (mode === 'paragraph') {
              try {
                // Find the current paragraph node
                let depth = $from.depth;
                while (depth > 0 && $from.node(depth).type.name !== 'paragraph') {
                  depth--;
                }

                if (depth > 0) {
                  const nodeStart = $from.before(depth);
                  const nodeEnd = $from.after(depth);

                  // Only add decoration if positions are valid
                  if (nodeStart >= 0 && nodeEnd <= tr.doc.content.size && nodeStart < nodeEnd) {
                    decorations.push(
                      Decoration.node(nodeStart, nodeEnd, {
                        class: className,
                      })
                    );
                  }
                }
              } catch (error) {
                // Silently ignore decoration errors
                console.debug('[FocusMode] Decoration error:', error);
              }
            }

            return DecorationSet.create(tr.doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
