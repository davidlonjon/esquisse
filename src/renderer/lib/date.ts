/**
 * Date utility functions for parsing, formatting, and manipulating dates
 */

import { isAfter, parseISO } from 'date-fns';

/**
 * Parse ISO 8601 string to Date object
 */
export function parseISODate(isoString: string): Date {
  return parseISO(isoString);
}

/**
 * Format Date object to ISO 8601 string (for storage)
 * Uses native toISOString() to ensure proper UTC format with Z suffix
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Check if a date is in the future (after current date/time)
 */
export function isFutureDate(date: Date): boolean {
  return isAfter(date, new Date());
}

/**
 * Get max selectable date (current date/time)
 */
export function getMaxSelectableDate(): Date {
  return new Date();
}

/**
 * Combine date and time into a single Date object
 */
export function combineDateAndTime(date: Date, hours: number, minutes: number): Date {
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

/**
 * Extract hours and minutes from Date
 */
export function extractTime(date: Date): { hours: number; minutes: number } {
  return {
    hours: date.getHours(),
    minutes: date.getMinutes(),
  };
}
