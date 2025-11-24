import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';
import { rename } from 'fs/promises';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    viteSingleFile(),
    {
      name: 'rename-html',
      closeBundle: async () => {
        // Rename index.html to ui.html for Figma
        try {
          await rename(
            resolve(__dirname, 'dist/index.html'),
            resolve(__dirname, 'dist/ui.html')
          );
        } catch {
          // File might already be renamed
        }
      },
    },
  ],
  root: resolve(__dirname, 'src/ui'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/ui/index.html'),
      output: {
        entryFileNames: 'ui.js',
      },
    },
  },
  define: {
    'process.env': {},
    'import.meta.env.DEV': JSON.stringify(mode === 'development'),
  },
}));
