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
        // SECURITY: Do NOT expose API keys to the client-side bundle!
        // API keys should only be used on the server-side (Edge Functions).
        // The Gemini API key is used in supabase/functions/generate-character/index.ts
        // and should never be exposed to the frontend.
        //
        // If you need to make API calls from the client, use the Supabase Edge Functions
        // which securely store the API key in environment variables.
        //
        // REMOVED: 'process.env.API_KEY' and 'process.env.GEMINI_API_KEY'
        // These were exposing sensitive credentials to the browser.
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
