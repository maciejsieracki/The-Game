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

function copyHtmlToCivMapa(): Plugin {
  return {
    name: 'copy-wonderpreview-html',
    enforce: 'post',
    apply: 'build',
    closeBundle() {
      const outDir = resolve(__dirname, 'dist-wonderpreview');
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
      if (!src) {
        console.warn('[wonderpreview] Brak index.html w', outDir);
        return;
      }
      const root = path.resolve(__dirname, '..');
      const dest = path.join(root, 'Civ-MAPA', 'Gra-podglad-CUDA-ROBLOX.html');
      fs.copyFileSync(src, dest);
      console.log('[wonderpreview] OK:', dest);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [
    viteSingleFile(),
    fixScriptTag(),
    copyHtmlToCivMapa(),
  ],
  build: {
    outDir: 'dist-wonderpreview',
    emptyOutDir: true,
    sourcemap: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      input: resolve(__dirname, 'src/wonderpreview/index.html'),
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
});
