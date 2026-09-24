import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Shown on the launcher so anyone can tell which build is live. Vercel sets the commit SHA.
const BUILD = `${(process.env.VERCEL_GIT_COMMIT_SHA ?? 'local').slice(0, 7)} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;

export default defineConfig({
  plugins: [react()],
  define: { __BUILD__: JSON.stringify(BUILD) },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
});
