import { describe, it, expect } from 'vitest';

import { formatDuration } from './time';

describe('time.ts - Time Utilities', () => {
  describe('formatDuration', () => {
    it('should format seconds only', () => {
      expect(formatDuration(30)).toBe('30s');
    });

    it('should format zero seconds', () => {
      expect(formatDuration(0)).toBe('0s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(90)).toBe('1m 30s');
    });

    it('should format exactly one minute', () => {
      expect(formatDuration(60)).toBe('1m 0s');
    });

    it('should format multiple minutes', () => {
      expect(formatDuration(300)).toBe('5m 0s');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(3600)).toBe('1h 0m');
    });

    it('should format hours with remainder minutes', () => {
      expect(formatDuration(3750)).toBe('1h 2m');
    });

    it('should format multiple hours', () => {
      expect(formatDuration(7200)).toBe('2h 0m');
    });

    it('should format hours, minutes, and ignore seconds', () => {
      expect(formatDuration(3665)).toBe('1h 1m');
    });

    it('should handle large durations', () => {
      expect(formatDuration(86400)).toBe('24h 0m');
    });

    it('should format 59 seconds', () => {
      expect(formatDuration(59)).toBe('59s');
    });

    it('should format 119 seconds (1m 59s)', () => {
      expect(formatDuration(119)).toBe('1m 59s');
    });

    it('should format 3599 seconds (59m 59s)', () => {
      expect(formatDuration(3599)).toBe('59m 59s');
    });

    it('should format exactly 2 hours', () => {
      expect(formatDuration(7200)).toBe('2h 0m');
    });

    it('should format 5h 30m', () => {
      expect(formatDuration(19800)).toBe('5h 30m');
    });
  });
});
