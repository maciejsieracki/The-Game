'use strict';
// Mikro-benchmark (nie live): koszt `placedImprovementsForOwner` PRZED (skan) vs PO (cache) na syntetycznym stanie t.~95.
// Run z gra/:  node ../dyspozycje/autobot/runs/R-WEB-PERF-PLACED-IMPROVEMENTS-CACHE-Q1/bench-micro.cjs [ulepszenia=3000] [miasta=70] [wywolania=1500] [wlasciciele=8]
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const GRA = path.resolve(process.cwd());
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const t = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-pi-'));
fs.writeFileSync(path.join(t, 'e.ts'), `export { createOwnerImprovementsCache, VersionedMap } from ${JSON.stringify(GRA + '/src/game/trade-routes')};\nexport { territoryOwnerAt } from ${JSON.stringify(GRA + '/src/map/territory')};\n`);
esbuild.buildSync({ entryPoints: [path.join(t, 'e.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: path.join(t, 'b.cjs'), absWorkingDir: GRA, logLevel: 'error', nodePaths: [path.join(GRA, 'node_modules')] });
const { createOwnerImprovementsCache, VersionedMap, territoryOwnerAt } = require(path.join(t, 'b.cjs'));
const [NI, NC, NCALL, NO] = [3000, 70, 1500, 8].map((d, i) => Number(process.argv[2 + i] || d));
let s = 1; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; const ri = (n) => Math.floor(rnd() * n);
const placed = new VersionedMap(); for (let i = 0; i < NI; i++) placed.set(`${ri(120)},${ri(120)}`, ['farma']);
const cities = []; for (let i = 0; i < NC; i++) cities.push({ q: ri(120), r: ri(120), population: 6 + ri(8), ownerId: i % NO });
const buildNodes = () => cities.map((c) => ({ q: c.q, r: c.r, pop: c.population, level: 1, ownerId: c.ownerId }));
const before = (o) => { const nodes = buildNodes(); const out = new Map(); for (const [k, l] of placed) { const [q, r] = k.split(','); if (territoryOwnerAt(Number(q), Number(r), nodes) === o) out.set(k, l); } return out; };
function run(fn) { const t0 = process.hrtime.bigint(); let sum = 0; for (let i = 0; i < NCALL; i++) sum += fn(i % NO).size; return [Number(process.hrtime.bigint() - t0) / 1e6, sum]; }
console.log(`ulepszenia=${NI} miasta=${NC} wywolania/ture=${NCALL} wlasciciele=${NO} load=${os.loadavg()[0].toFixed(2)}`);
for (let i = 1; i <= 3; i++) {
  const [tb, sb] = run(before);
  const c = createOwnerImprovementsCache(territoryOwnerAt);
  const [ta, sa] = run((o) => c.get(o, placed, buildNodes()));
  console.log(`przebieg ${i}: PRZED ${tb.toFixed(0)} ms | PO ${ta.toFixed(0)} ms | x${(tb / ta).toFixed(1)} | wynik identyczny: ${sb === sa} | misses=${c.stats.misses} hits=${c.stats.hits}`);
}
fs.rmSync(t, { recursive: true, force: true });
