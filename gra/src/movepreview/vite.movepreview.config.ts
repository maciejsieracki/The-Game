import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';

function fixScriptTag(): Plugin {
  return {
    name: 'fix-script-tag-movepreview',
    enforce: 'post',
    apply: 'build',
    transformIndexHtml(html: string): string {
      let result = html.replace(/\s+crossorigin(?:="[^"]*")?(?=[\s>])/g, '');
      result = result.replace(/<script\s+type="module"/g, '<script type="text/javascript"');
      return result;
    },
  };
}

export default defineConfig({
  root: '.',
  base: './',
  plugins: [
    viteSingleFile(),
    fixScriptTag(),
  ],
  build: {
    outDir: 'dist-movepreview',
    emptyOutDir: false,
    sourcemap: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      input: 'src/movepreview/index.html',
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
});
