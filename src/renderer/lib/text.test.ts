import { describe, it, expect } from 'vitest';

import { getWordCountFromHTML } from './text';

describe('text.ts - Text Utilities', () => {
  describe('getWordCountFromHTML', () => {
    it('should count words in plain text', () => {
      expect(getWordCountFromHTML('Hello world')).toBe(2);
    });

    it('should count words stripping HTML tags', () => {
      expect(getWordCountFromHTML('<p>Hello world</p>')).toBe(2);
    });

    it('should return 0 for empty string', () => {
      expect(getWordCountFromHTML('')).toBe(0);
    });

    it('should return 0 for whitespace only', () => {
      expect(getWordCountFromHTML('   ')).toBe(0);
    });

    it('should return 0 for HTML tags only', () => {
      expect(getWordCountFromHTML('<p></p>')).toBe(0);
    });

    it('should count words with multiple tags', () => {
      expect(getWordCountFromHTML('<p>Hello <strong>world</strong></p>')).toBe(2);
    });

    it('should handle nested tags', () => {
      expect(getWordCountFromHTML('<div><p>Hello <em>world</em></p></div>')).toBe(2);
    });

    it('should normalize multiple spaces', () => {
      expect(getWordCountFromHTML('Hello    world')).toBe(2);
    });

    it('should handle newlines and tabs', () => {
      expect(getWordCountFromHTML('Hello\n\tworld')).toBe(2);
    });

    it('should count words in complex HTML', () => {
      const html = `
        <h1>Title</h1>
        <p>This is a paragraph with <strong>bold</strong> text.</p>
        <ul>
          <li>Item one</li>
          <li>Item two</li>
        </ul>
      `;
      // Title (1) + This is a paragraph with bold text (8) + Item one (2) + Item two (2) = 13
      // But "text." is counted as one word, so it's actually 12
      expect(getWordCountFromHTML(html)).toBe(12);
    });

    it('should handle self-closing tags', () => {
      expect(getWordCountFromHTML('Hello<br/>world')).toBe(2);
    });

    it('should handle tags with attributes', () => {
      expect(getWordCountFromHTML('<p class="test">Hello world</p>')).toBe(2);
    });

    it('should count single word', () => {
      expect(getWordCountFromHTML('Hello')).toBe(1);
    });

    it('should handle mixed content with spaces around tags', () => {
      expect(getWordCountFromHTML('Hello <span>world</span> test')).toBe(3);
    });
  });
});
