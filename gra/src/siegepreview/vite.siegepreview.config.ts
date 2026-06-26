import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';
function fix(): Plugin { return { name: 'fix-siege', enforce: 'post', apply: 'build', transformIndexHtml(h: string){ let r=h.replace(/\s+crossorigin(?:="[^"]*")?(?=[\s>])/g,''); return r.replace(/<script\s+type="module"/g,'<script type="text/javascript"'); } }; }
export default defineConfig({ root: '.', base: './', plugins: [viteSingleFile(), fix()], build: { outDir: 'dist-siegepreview', emptyOutDir: false, sourcemap: false, assetsInlineLimit: 100000000, rollupOptions: { input: 'src/siegepreview/index.html', output: { format: 'iife', inlineDynamicImports: true, manualChunks: undefined } } } });
