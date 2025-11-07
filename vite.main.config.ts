import { copyFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      '@shared': join(__dirname, './src/shared'),
      '@main': join(__dirname, './src/main'),
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
        const schemaSource = join(__dirname, 'src/main/database/schema.sql');
        const schemaTarget = join(__dirname, '.vite/build/schema.sql');
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
