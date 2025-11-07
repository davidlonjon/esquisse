import { join } from 'path';

import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      '@shared': join(__dirname, './src/shared'),
      '@preload': join(__dirname, './src/preload'),
    },
  },
  build: {
    // Ensure the output is a single file that can be loaded as a preload script
    rollupOptions: {
      output: {
        format: 'cjs',
        entryFileNames: 'preload.js',
      },
    },
  },
});
