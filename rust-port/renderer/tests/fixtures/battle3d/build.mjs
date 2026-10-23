// Bundles gen.ts with esbuild 0.24.0 (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q1).
// Web files are bundled UNCHANGED (no plugin, no shim).
//
// Usage (from the scratch refscript dir, `node_modules` linked next to it):
//   node build.mjs
import * as esbuild from 'esbuild';

const here = new URL('.', import.meta.url).pathname;

await esbuild.build({
  entryPoints: [`${here}gen.ts`],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: `${here}gen.mjs`,
  logLevel: 'warning',
  // Round 2 (Evaluator r1, objection 4): path comments in the bundle are relative to `absWorkingDir`;
  // pinning it to this script's directory makes `gen.mjs` byte-identical for any scratch location.
  absWorkingDir: here.replace(/\/$/, ''),
  nodePaths: [new URL('./node_modules', import.meta.url).pathname],
});
