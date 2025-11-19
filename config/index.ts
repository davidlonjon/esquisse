/**
 * Shared Configuration Module
 *
 * Single source of truth for paths, aliases, and other configuration values
 * shared across build tools (Vite, TypeScript, Tailwind, Forge).
 *
 * This module ensures consistency and prevents configuration drift.
 */

import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { z } from 'zod';

// Get project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

/**
 * Configuration schema with Zod validation
 */
const ConfigSchema = z.object({
  paths: z.object({
    root: z.string(),
    src: z.string(),
    main: z.string(),
    preload: z.string(),
    renderer: z.string(),
    shared: z.string(),
    test: z.string(),
    build: z.string(),
    out: z.string(),
  }),
  aliases: z.record(z.string(), z.string()),
  entries: z.object({
    main: z.string(),
    preload: z.string(),
  }),
  content: z.object({
    globs: z.array(z.string()),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Application configuration
 * Validated at module load time
 */
export const config: Config = ConfigSchema.parse({
  // Directory paths (relative to project root)
  paths: {
    root: projectRoot,
    src: resolve(projectRoot, './src'),
    main: resolve(projectRoot, './src/main'),
    preload: resolve(projectRoot, './src/preload'),
    renderer: resolve(projectRoot, './src/renderer'),
    shared: resolve(projectRoot, './src/shared'),
    test: resolve(projectRoot, './src/test'),
    build: resolve(projectRoot, './.vite/build'),
    out: resolve(projectRoot, './out'),
  },

  // Path aliases (used by Vite and TypeScript)
  aliases: {
    // Root aliases
    '@': resolve(projectRoot, './src/renderer'),
    '@shared': resolve(projectRoot, './src/shared'),
    '@main': resolve(projectRoot, './src/main'),
    '@preload': resolve(projectRoot, './src/preload'),
    '@test': resolve(projectRoot, './src/test'),

    // Renderer feature aliases
    '@features': resolve(projectRoot, './src/renderer/features'),
    '@components': resolve(projectRoot, './src/renderer/components'),
    '@ui': resolve(projectRoot, './src/renderer/components/ui'),
    '@layout': resolve(projectRoot, './src/renderer/components/layout'),
    '@hooks': resolve(projectRoot, './src/renderer/hooks'),
    '@services': resolve(projectRoot, './src/renderer/services'),
    '@providers': resolve(projectRoot, './src/renderer/providers'),
    '@config': resolve(projectRoot, './src/renderer/config'),
    '@lib': resolve(projectRoot, './src/renderer/lib'),
    '@styles': resolve(projectRoot, './src/renderer/styles'),
    '@pages': resolve(projectRoot, './src/renderer/pages'),
  },

  // Entry points for Electron processes
  entries: {
    main: 'src/main/index.ts',
    preload: 'src/preload/index.ts',
  },

  // Content patterns (used by Tailwind)
  content: {
    globs: ['./index.html', './src/renderer/**/*.{js,ts,jsx,tsx}'],
  },
});

/**
 * Convert aliases object to TypeScript paths format
 * TypeScript requires /* suffixes for wildcard imports
 */
export function getTypeScriptPaths(): Record<string, string[]> {
  const paths: Record<string, string[]> = {};

  for (const [alias, path] of Object.entries(config.aliases)) {
    // Convert absolute path to relative path from project root
    const relativePath = './' + path.replace(config.paths.root + '/', '');

    // Special case: @ui without wildcard (it points to index.ts)
    if (alias === '@ui') {
      paths[alias] = [relativePath + '/index.ts'];
    }

    // Add wildcard version for all aliases
    paths[`${alias}/*`] = [`${relativePath}/*`];
  }

  return paths;
}

/**
 * Get content globs for Tailwind
 */
export function getTailwindContent(): string[] {
  return config.content.globs;
}

/**
 * Validate configuration on module load
 * This ensures config errors are caught early
 */
try {
  ConfigSchema.parse(config);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Configuration validation failed:');
    console.error(error.format());
    process.exit(1);
  }
  throw error;
}
