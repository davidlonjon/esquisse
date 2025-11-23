/**
 * Zod validation schemas for type safety and runtime validation
 */

import { z } from 'zod';

// Journal validation schemas
export const CreateJournalInputSchema = z.object({
  name: z.string().min(1, 'Journal name is required').max(255, 'Journal name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional(),
});

export const UpdateJournalInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Journal name is required')
    .max(255, 'Journal name is too long')
    .optional(),
  description: z.string().max(1000, 'Description is too long').nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .nullable()
    .optional(),
});

// Entry validation schemas
export const EntryStatusSchema = z.enum(['active', 'archived', 'draft']);

export const CreateEntryInputSchema = z.object({
  journalId: z.string().min(1, 'Journal ID is required'),
  title: z.string().max(255, 'Title is too long').optional(),
  content: z.string(),
  tags: z.array(z.string().max(50, 'Tag is too long')).max(20, 'Too many tags').optional(),
  status: EntryStatusSchema.optional(),
  isFavorite: z.boolean().optional(),
});

export const UpdateEntryInputSchema = z.object({
  title: z.string().max(255, 'Title is too long').nullable().optional(),
  content: z.string().optional(),
  tags: z
    .array(z.string().max(50, 'Tag is too long'))
    .max(20, 'Too many tags')
    .nullable()
    .optional(),
  status: EntryStatusSchema.optional(),
  isFavorite: z.boolean().optional(),
});

// Settings validation schemas
export const UpdateSettingsInputSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  fontSize: z
    .number()
    .int()
    .min(8, 'Font size too small')
    .max(72, 'Font size too large')
    .optional(),
  fontFamily: z
    .string()
    .min(1, 'Font family is required')
    .max(255, 'Font family is too long')
    .optional(),
  autoSave: z.boolean().optional(),
  autoSaveInterval: z
    .number()
    .int()
    .min(5000, 'Auto-save interval too short')
    .max(300000, 'Auto-save interval too long')
    .optional(),
  language: z.enum(['en', 'fr']).optional(),
});

// Generic ID validation (not strictly UUID to maintain backward compatibility with tests)
export const IdSchema = z.string().min(1, 'ID is required');

// Search query validation
export const SearchQuerySchema = z
  .string()
  .min(1, 'Search query is required')
  .max(255, 'Search query is too long');

// Response validation schemas
export const JournalSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const EntrySchema = z.object({
  id: z.string(),
  journalId: z.string(),
  title: z.string().optional(),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  status: EntryStatusSchema,
  isFavorite: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  fontSize: z.number().int(),
  fontFamily: z.string(),
  autoSave: z.boolean(),
  autoSaveInterval: z.number().int(),
  language: z.enum(['en', 'fr']),
});

export const BackupInfoSchema = z.object({
  name: z.string(),
  path: z.string(),
  date: z.string(),
  size: z.number().int(),
});
