import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';

/**
 * fixScriptTag — identyczny post-transform jak w mappreview i kanonie.
 * Usuwa crossorigin i zmienia type="module" -> type="text/javascript"
 * by single-file IIFE działał z file:// (bez czarnego ekranu CORS).
 */
function fixScriptTag(): Plugin {
  return {
    name: 'fix-script-tag-placementpreview',
    enforce: 'post',
    apply: 'build',
    transformIndexHtml(html: string): string {
      let result = html.replace(/\s+crossorigin(?:="[^"]*")?(?=[\s>])/g, '');
      result = result.replace(/<script\s+type="module"/g, '<script type="text/javascript"');
      return result;
    },
  };
}

/**
 * Standalone build config — Placement UX preview (prototyp MAPA).
 *
 * Uruchom z katalogu gra/:
 *   npx vite build --config src/placementpreview/vite.placementpreview.config.ts
 *
 * Output: dist-placementpreview/index.html (single, file://-ready).
 * Publikuj jako ../Civ-MAPA/Gra-podglad-PLACEMENT.html — NIE dotykaj kanonu.
 */
export default defineConfig({
  root: '.',
  base: './',
  plugins: [
    viteSingleFile(),
    fixScriptTag(),
  ],
  build: {
    outDir: 'dist-placementpreview',
    emptyOutDir: false,
    sourcemap: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      input: 'src/placementpreview/index.html',
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
});
