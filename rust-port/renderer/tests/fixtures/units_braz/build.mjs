// Bundles gen.ts with esbuild 0.24.0 (R-RUSTPORT-P4-23-MOD06-UNITS-BRONZE-Q1).
//
// No adaptation of web code at all: every symbol gen.ts needs is already
// exported by the web modules. Usage (scratch refscript dir, `node_modules`
// linked next to it): node build.mjs
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['gen.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'gen.mjs',
  logLevel: 'warning',
  nodePaths: [new URL('./node_modules', import.meta.url).pathname],
});
