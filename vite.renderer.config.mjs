import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@main': path.resolve(__dirname, './src/main'),
      '@preload': path.resolve(__dirname, './src/preload'),
      '@features': path.resolve(__dirname, './src/renderer/features'),
      '@components': path.resolve(__dirname, './src/renderer/components'),
      '@ui': path.resolve(__dirname, './src/renderer/components/ui'),
      '@layout': path.resolve(__dirname, './src/renderer/components/layout'),
      '@hooks': path.resolve(__dirname, './src/renderer/hooks'),
      '@services': path.resolve(__dirname, './src/renderer/services'),
      '@providers': path.resolve(__dirname, './src/renderer/providers'),
      '@config': path.resolve(__dirname, './src/renderer/config'),
      '@lib': path.resolve(__dirname, './src/renderer/lib'),
      '@styles': path.resolve(__dirname, './src/renderer/styles'),
      '@pages': path.resolve(__dirname, './src/renderer/pages'),
      '@test': path.resolve(__dirname, './src/test'),
    },
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
