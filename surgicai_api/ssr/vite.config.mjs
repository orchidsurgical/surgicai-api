import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        transcribe: resolve(__dirname, 'frontend-src/transcribe.js')
      },
      output: {
        entryFileNames: 'transcribe.js',
        format: 'iife' // Ensures globals for browser usage
      }
    },
    outDir: 'static/js',
    emptyOutDir: true
  }
});
