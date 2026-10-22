// Bundles gen_relief.ts with esbuild 0.24.0 (R-RUSTPORT-P4-24-MISC-RELIEF-WIRE-Q1).
//
// NO plugin, NO redirect: every web file (including `render/mapRenderStyle.ts`
// and its `reliefSurfaceSampler`) is bundled unchanged. After bundling, the
// script fails if the bundle mentions the P4.22 shim (`relief_shim` or the
// `__MISC_RELIEF` switch), so the vectors can only come from the real sampler.
//
// Usage (from the scratch refscript dir, `node_modules` linked next to it):
//   node build_relief.mjs
import * as esbuild from 'esbuild';
import * as fs from 'node:fs';

await esbuild.build({
  entryPoints: ['gen_relief.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'gen_relief.mjs',
  logLevel: 'warning',
  nodePaths: [new URL('./node_modules', import.meta.url).pathname],
});

const out = fs.readFileSync('gen_relief.mjs', 'utf8');
if (out.includes('relief_shim') || out.includes('__MISC_RELIEF')) {
  throw new Error('gen_relief.mjs contains the relief shim');
}
if (!out.includes('function reliefSurfaceSampler(') || !out.includes('function powierzchniaReliefuY(')) {
  throw new Error('gen_relief.mjs does not contain the real relief sampler');
}
console.log('gen_relief.mjs: real reliefSurfaceSampler, no shim');
