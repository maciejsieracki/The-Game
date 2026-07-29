import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import * as path from 'path';

/** Konfiguracja WYŁĄCZNIE dla testu obrotu kamery (tools/.zeton-tabliczka/kat.html). */
export default defineConfig({
  base: './',
  root: path.resolve(__dirname),
  plugins: [viteSingleFile()],
  build: {
    outDir: path.resolve(__dirname, '../.zeton-tabliczka-kat-dist'),
    emptyOutDir: true,
    sourcemap: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      input: path.resolve(__dirname, 'kat.html'),
      output: { format: 'iife', inlineDynamicImports: true, manualChunks: undefined },
    },
  },
});
