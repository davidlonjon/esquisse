import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
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
