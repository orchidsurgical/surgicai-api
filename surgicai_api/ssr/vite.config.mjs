import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        editor: resolve(__dirname, 'frontend/editor.js')
      },
      output: {
        entryFileNames: 'editor.js',
        format: 'iife',
        name: 'EditorBundle'
      }
    },
    outDir: 'static/js',
    emptyOutDir: true
  }
});
