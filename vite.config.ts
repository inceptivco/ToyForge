import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              // Split vendor dependencies into separate chunks
              if (id.includes('node_modules')) {
                // Don't split React/ReactDOM - keep them in main bundle to avoid dependency issues
                // Only split other large dependencies
                if (id.includes('@supabase')) {
                  return 'vendor-supabase';
                }
                if (id.includes('recharts')) {
                  return 'vendor-charts';
                }
                // Group other node_modules (excluding React) into vendor chunk
                if (!id.includes('react')) {
                  return 'vendor';
                }
              }
            }
          }
        },
        chunkSizeWarningLimit: 1000, // Increase limit to 1000 kB
      }
    };
});
