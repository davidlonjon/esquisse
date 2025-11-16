/**
 * Editor component exports
 * Main entry point for the Editor component and related utilities
 */

export { Editor } from './Editor';
export * from './types';
export * from './constants';
export {
  useEditorContentStore,
  selectEditorContent,
  selectEditorWordCount,
  selectEditorLastSaved,
} from './store/editor.store';
