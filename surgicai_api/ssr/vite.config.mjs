import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        transcribe: resolve(__dirname, 'frontend-src/transcribe.js'),
        template_fields: resolve(__dirname, 'frontend-src/template_fields.js')
      },
      output: {
        entryFileNames: '[name].js',
        // format: 'iife' // Ensures globals for browser usage
      }
    },
    outDir: 'static/js',
    emptyOutDir: true
  }
});
