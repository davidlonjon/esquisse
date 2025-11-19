import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { config } from './config/index.ts';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: config.aliases,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
