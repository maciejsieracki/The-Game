import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';
import { resolve } from 'path';
import * as fs from 'fs';
import * as path from 'path';

function fixScriptTag(): Plugin {
  return {
    name: 'fix-script-tag',
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
 * copyHtmlToRoot — po buildzie kopiuje zagniezdzone index.html do katalogu outDir
 * jako Gra-podglad-OBLEZENIE-BITWA.html
 */
function copyHtmlToRoot(): Plugin {
  return {
    name: 'copy-html-to-root',
    enforce: 'post',
    apply: 'build',
    closeBundle() {
      const outDir = resolve(__dirname, 'dist-oblezenie-bitwa');
      function findHtml(dir: string): string | null {
        if (!fs.existsSync(dir)) return null;
        for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, f.name);
          if (f.isDirectory()) { const r = findHtml(full); if (r) return r; }
          else if (f.name === 'index.html') return full;
        }
        return null;
      }
      const src = findHtml(outDir);
      if (src) {
        const dest = path.join(outDir, 'Gra-podglad-OBLEZENIE-BITWA.html');
        fs.copyFileSync(src, dest);
        console.log('[oblezenie-bitwa] Skopiowano:', dest);
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [
    viteSingleFile(),
    fixScriptTag(),
    copyHtmlToRoot(),
  ],
  build: {
    outDir: 'dist-oblezenie-bitwa',
    emptyOutDir: false,
    sourcemap: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      input: resolve(__dirname, 'src/oblezenie/index.html'),
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        manualChunks: undefined,
        entryFileNames: 'Gra-podglad-OBLEZENIE-BITWA.js',
        assetFileNames: 'Gra-podglad-OBLEZENIE-BITWA.[ext]',
      },
    },
  },
});
