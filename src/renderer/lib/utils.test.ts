import { describe, it, expect } from 'vitest';

import { cn } from './utils';

describe('utils.ts - Utility Functions', () => {
  describe('cn', () => {
    it('should merge single class name', () => {
      expect(cn('foo')).toBe('foo');
    });

    it('should merge multiple class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
      expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz');
    });

    it('should merge Tailwind conflicting classes', () => {
      // Later class should override earlier one
      expect(cn('px-2', 'px-4')).toBe('px-4');
      expect(cn('text-sm', 'text-lg')).toBe('text-lg');
    });

    it('should handle array of classes', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('should handle object with boolean values', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });

    it('should handle mixed inputs', () => {
      expect(cn('foo', ['bar', 'baz'], { qux: true, quux: false })).toBe('foo bar baz qux');
    });

    it('should handle empty strings', () => {
      expect(cn('', 'foo', '')).toBe('foo');
    });

    it('should handle undefined and null', () => {
      expect(cn(undefined, 'foo', null)).toBe('foo');
    });

    it('should handle duplicate classes (keeps last occurrence)', () => {
      // twMerge doesn't deduplicate non-conflicting classes
      expect(cn('foo', 'bar', 'foo')).toBe('foo bar foo');
    });

    it('should handle no arguments', () => {
      expect(cn()).toBe('');
    });
  });
});
