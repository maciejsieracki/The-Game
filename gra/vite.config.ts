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

/**
 * escapeNonAsciiForJs — R-WEB-MEMORY-STATIC-FOOTPRINT-Q1.
 *
 * Zamienia każdy znak spoza ASCII w gotowym kodzie JS na ucieczkę `\uXXXX` (znaki spoza BMP jako para
 * surogatów). Powód: Chromium trzyma źródło skryptu jako string; jeśli zawiera choć jeden znak spoza
 * Latin-1 (polskie litery), cały ~70-milionowy bundle zajmuje 2 B/znak (UTF-16) zamiast 1 B — ok. 70 MB
 * stale przez całą grę. Ucieczka `\uXXXX` znaczy to samo w literale tekstowym, w szablonie (wartość
 * „cooked”), w literale regex (z flagą `u` i bez — para surogatów w trybie `u` łączy się w jeden znak),
 * w identyfikatorze i w komentarzu. esbuild `charset: 'ascii'` nie zmienia literałów regex, dlatego
 * zamiana działa na tekście wyniku, po minifikacji. Znak poprzedzony nieparzystą liczbą `\` (ucieczka
 * tożsamościowa `\ł`, znaczy po prostu `ł`) traci ten `\`, żeby nie powstało `\\u0142`.
 * Jedyny kontekst o innej semantyce to `String.raw`/surowe tagowane szablony — test
 * `memory-static-ascii-bundle-test.cjs` sprawdza, że bundle nie ma ich ze znakami spoza ASCII.
 */
export function escapeNonAsciiForJs(code: string): string {
  let out = '';
  let last = 0;
  for (let i = 0; i < code.length; i++) {
    const c = code.charCodeAt(i);
    if (c < 0x80) continue;
    let chunk = code.slice(last, i);
    let bs = 0;
    for (let k = chunk.length - 1; k >= 0 && chunk.charCodeAt(k) === 0x5c; k--) bs++;
    if (bs % 2 === 1) chunk = chunk.slice(0, -1);
    out += chunk + '\\u' + c.toString(16).padStart(4, '0');
    last = i + 1;
  }
  return last === 0 ? code : out + code.slice(last);
}

function asciiOnlyJs(): Plugin {
  return {
    name: 'ascii-only-js',
    apply: 'build',
    // generateBundle: po minifikacji (renderChunk), przed viteSingleFile (enforce: 'post'), który wkleja JS do HTML.
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk') file.code = escapeNonAsciiForJs(file.code);
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [
    asciiOnlyJs(),
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
