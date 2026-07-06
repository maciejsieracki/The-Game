import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';

/**
 * fixScriptTag — runs after vite-plugin-singlefile inlines the bundle.
 *
 * vite-plugin-singlefile preserves the original <script type="module" crossorigin>
 * attributes from Vite's HTML template. When the file is opened from file://, the
 * `crossorigin` attribute causes the browser to perform a CORS preflight that fails
 * silently, resulting in the script never executing (black screen, no errors).
 *
 * Since our output is an IIFE (not an ES module), we:
 *   1. Remove `crossorigin` — no external fetch, so it's pointless.
 *   2. Change `type="module"` → `type="text/javascript"` — matches the IIFE format.
 *
 * This must run AFTER viteSingleFile (enforce: 'post', order matters).
 */
function fixScriptTag(): Plugin {
  return {
    name: 'fix-script-tag',
    enforce: 'post',
    apply: 'build',
    transformIndexHtml(html: string): string {
      // Remove crossorigin attribute (with or without quotes, with or without value)
      let result = html.replace(/\s+crossorigin(?:="[^"]*")?(?=[\s>])/g, '');
      // Change type="module" to type="text/javascript" for IIFE compatibility
      result = result.replace(/<script\s+type="module"/g, '<script type="text/javascript"');
      return result;
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [
    viteSingleFile(),
    fixScriptTag(),
  ],
  build: {
    outDir: 'dist',
    // Disable source maps — not needed in the self-contained file build
    sourcemap: false,
    // Inline all assets (images, fonts, etc.)
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      output: {
        // IIFE format: single classic script, runs from file:// without CORS issues
        format: 'iife',
        inlineDynamicImports: true,
        // No code-splitting
        manualChunks: undefined,
      },
    },
  },
});
