import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import * as path from 'path';
export default defineConfig({
  base: './',
  root: path.resolve(__dirname),
  plugins: [viteSingleFile()],
  build: {
    outDir: path.resolve(__dirname, '../.zloze-mockup-dist'),
    emptyOutDir: true, sourcemap: false, assetsInlineLimit: 100_000_000,
    rollupOptions: { output: { format: 'iife', inlineDynamicImports: true, manualChunks: undefined } },
  },
});
