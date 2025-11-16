import { create } from 'zustand';

import { getWordCountFromHTML } from '@lib/text';

interface EditorContentState {
  content: string;
  wordCount: number;
  lastSaved: Date | null;
  setContent: (value: string) => void;
  resetContent: (value?: string) => void;
  setLastSaved: (timestamp: Date | null) => void;
}

const computeWordCount = (value: string) => getWordCountFromHTML(value);

export const useEditorContentStore = create<EditorContentState>((set) => ({
  content: '',
  wordCount: 0,
  lastSaved: null,
  setContent: (value) => set({ content: value, wordCount: computeWordCount(value) }),
  resetContent: (value = '') => set({ content: value, wordCount: computeWordCount(value) }),
  setLastSaved: (timestamp) => set({ lastSaved: timestamp }),
}));

export const selectEditorContent = (state: EditorContentState) => state.content;
export const selectEditorWordCount = (state: EditorContentState) => state.wordCount;
export const selectEditorLastSaved = (state: EditorContentState) => state.lastSaved;
