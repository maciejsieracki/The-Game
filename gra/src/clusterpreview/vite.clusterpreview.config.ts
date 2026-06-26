import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';

/**
 * fixScriptTag — identyczny post-transform jak w innych harness-ach.
 * Usuwa `crossorigin`, zmienia type="module" → type="text/javascript"
 * żeby plik działał z file:// bez CORS black-screen.
 */
function fixScriptTag(): Plugin {
  return {
    name: 'fix-script-tag-clusterpreview',
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
 * Standalone build config dla podglądu klastrów cywilizacji (lane Civ-MAPA).
 *
 * Run (z gra/):
 *   npx vite build --config src/clusterpreview/vite.clusterpreview.config.ts
 * Output: dist-clusterpreview/src/clusterpreview/index.html (single file, file:// ready).
 * Deploy: cp dist-clusterpreview/src/clusterpreview/index.html ../Gra-podglad-KLASTRY.html
 */
export default defineConfig({
  root: '.',
  base: './',
  plugins: [
    viteSingleFile(),
    fixScriptTag(),
  ],
  build: {
    outDir: 'dist-clusterpreview',
    emptyOutDir: false,
    sourcemap: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      input: 'src/clusterpreview/index.html',
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
});
