import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';

/**
 * fixScriptTag — identical post-transform to the game's vite.config.ts.
 *
 * After vite-plugin-singlefile inlines the IIFE bundle, the original
 * `type="module" crossorigin` attributes remain.  From file:// those cause a
 * silent CORS failure (black screen).  So we strip `crossorigin` and switch
 * `type="module"` -> `type="text/javascript"` to match the IIFE output.
 * Must run AFTER viteSingleFile (enforce: 'post').
 */
function fixScriptTag(): Plugin {
  return {
    name: 'fix-script-tag-gallery',
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
 * Standalone build config for the 4-view unit gallery.
 *
 * Kept SEPARATE from the game's vite.config.ts (which this session must not
 * touch).  `root` stays at the project root so the gallery's
 * `/src/gallery4/main.ts` entry and the loader's `../../data/*.json` imports
 * resolve exactly as in the game build.  Output goes to its own outDir and is a
 * single self-contained, file://-ready HTML.
 *
 * Run:  npx vite build --config src/gallery4/vite.gallery.config.ts --outDir <dir>
 *
 * NOTE: run from the project root (gra/).  The input path below is resolved
 * relative to the project root by Vite, matching the game build's resolution
 * of `/src/...` entries and the loader's `../../data/*.json` imports.
 */
export default defineConfig({
  root: '.',
  base: './',
  plugins: [
    viteSingleFile(),
    fixScriptTag(),
  ],
  build: {
    outDir: 'dist-gallery4',
    emptyOutDir: true,
    sourcemap: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      input: 'src/gallery4/index.html',
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
});
