import { defineConfig } from 'vite';

// Szkielet P5.1. `base: './'` — ścieżki względne dla `frontendDist` Tauri (przełączenie
// `tauri.conf.json` to osobny temat; ten plik go nie dotyka).
export default defineConfig({
  base: './',
  clearScreen: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
  },
});
