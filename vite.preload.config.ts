import { defineConfig } from 'vite';

import { config } from './config/index';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      '@shared': config.aliases['@shared'],
      '@preload': config.aliases['@preload'],
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
