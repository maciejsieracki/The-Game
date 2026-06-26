import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';

/**
 * fixScriptTag — identical post-transform to the game's vite.config.ts.
 * Strips `crossorigin` and switches `type="module"` -> `type="text/javascript"`
 * so the single-file IIFE bundle runs from file:// (no silent CORS black screen).
 */
function fixScriptTag(): Plugin {
  return {
    name: 'fix-script-tag-mappreview',
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
 * Standalone build config for the world-map preview (F1, lane RENDER-MAPA).
 *
 * Kept SEPARATE from the game's vite.config.ts (this session must not touch it).
 * Imports only generator + scene -> the truncated units.ts/battleScene.ts of
 * other sessions are NOT in the graph, so the build succeeds regardless.
 *
 * Run (from gra/):
 *   npx vite build --config src/mappreview/vite.mappreview.config.ts
 * Output: dist-mappreview/index.html (single, file://-ready). Publish as
 * ../Gra-podglad-MAPA.html (separate preview, NEVER the canon).
 */
export default defineConfig({
  root: '.',
  base: './',
  plugins: [
    viteSingleFile(),
    fixScriptTag(),
  ],
  build: {
    outDir: 'dist-mappreview',
    emptyOutDir: false,
    sourcemap: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      input: 'src/mappreview/index.html',
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
});
