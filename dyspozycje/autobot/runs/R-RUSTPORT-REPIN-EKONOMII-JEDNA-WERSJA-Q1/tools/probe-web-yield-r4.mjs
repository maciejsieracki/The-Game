import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const S = '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad';
const esbuild = await import(S + '/esb/node_modules/esbuild/lib/main.js');
const built = await esbuild.build({
  entryPoints: [S + '/gen/probe-entry.ts'], bundle: true, write: false, format: 'esm', platform: 'node',
  logLevel: 'error', loader: { '.json': 'json', '.png': 'dataurl' },
  absWorkingDir: S,
});
writeFileSync(S + '/gen/probe-bundle.mjs', built.outputFiles[0].text);
const W = await import(S + '/gen/probe-bundle.mjs');
const KEYS = ['tartak', 'kamieniolom', 'glinianka', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_cyny', 'warzelnia_soli', 'stadnina', 'kopalnia_zlota', 'farma'];
const rows = [];
for (const k of KEYS) {
  const y = {};
  for (const e of [undefined, 1, 2, 3, 4, 0]) {
    const r = W.territoryResourceYieldForImprovement(k, null, e);
    y[String(e)] = r ? `${r.resourceKey}:${r.amount}` : 'null';
  }
  rows.push([k, y]);
}
console.log('DEFAULT_AMOUNT', W.TERRITORY_YIELD_DEFAULT_AMOUNT);
for (const [k, y] of rows) console.log(k.padEnd(16), JSON.stringify(y));
console.log('resourceProductionAmountForEra(glinianka,50,2) =', W.resourceProductionAmountForEra('glinianka', 50, 2));
