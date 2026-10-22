// Bundles gen.ts with esbuild 0.24.0 (R-RUSTPORT-P4-22-MOD13-MISC-Q1).
//
// Web files are bundled UNCHANGED. One test-harness redirect, no rewrite:
//   - when `render/rangeOverlay.ts` imports `./mapRenderStyle`, it gets
//     `relief_shim.ts` instead. The shim re-exports the REAL module
//     (`export *`) and wraps only `reliefSurfaceSampler`: in mode "real"
//     (default) it calls the real web function, in mode "analytic" it returns
//     a closed-form height field that the Rust test re-implements. This lets
//     the relief-drape algorithm of rangeOverlay be compared bit for bit
//     without porting the terrain-relief raycaster (`teren-gory-wzgorza.ts`,
//     not part of MOD-13). See README.md.
//
// Usage (from the scratch refscript dir, `node_modules` linked next to it):
//   node build.mjs
import * as esbuild from 'esbuild';
import * as path from 'node:path';

const here = new URL('.', import.meta.url).pathname;

const reliefShim = {
  name: 'relief-shim',
  setup(build) {
    build.onResolve({ filter: /^\.\/mapRenderStyle$/ }, (args) => {
      if (!/[\\/]render[\\/]rangeOverlay\.ts$/.test(args.importer)) return undefined;
      return { path: path.join(here, 'relief_shim.ts') };
    });
  },
};

await esbuild.build({
  entryPoints: ['gen.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'gen.mjs',
  logLevel: 'warning',
  nodePaths: [new URL('./node_modules', import.meta.url).pathname],
  plugins: [reliefShim],
});
