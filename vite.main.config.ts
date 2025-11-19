import { copyFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

import { defineConfig } from 'vite';

import { config } from './config/index';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      '@shared': config.aliases['@shared'],
      '@main': config.aliases['@main'],
    },
  },
  build: {
    rollupOptions: {
      external: ['sql.js'],
    },
  },
  plugins: [
    {
      name: 'copy-schema',
      closeBundle() {
        // Copy schema.sql to build directory
        const schemaSource = join(config.paths.main, 'database/schema.sql');
        const schemaTarget = join(config.paths.build, 'schema.sql');
        try {
          mkdirSync(dirname(schemaTarget), { recursive: true });
          copyFileSync(schemaSource, schemaTarget);
          console.log('Copied schema.sql to build directory');
        } catch (error) {
          console.error('Failed to copy schema.sql:', error);
        }
      },
    },
  ],
});
