'use strict';
// R2 (odpowiedz na zarzuty 2 i 3): mikro-benchmark z ZAPISAMI w trakcie tury i z kosztem zaleznych skanow.
// Run z gra/:  node ../dyspozycje/autobot/runs/R-WEB-PERF-PLACED-IMPROVEMENTS-CACHE-Q1/bench-micro-v2.cjs
// Scenariusze: zapis do placedImprovements co K wywolan (K = brak, 200, 20, 1). Kazde wywolanie = placedImprovementsForOwner
// + 5 skanow zaleznych (kazdy skan = petla po wartosciach mapy wlasciciela, jak empireHasKopalniaMiedzi/Glinianka/
// ZloziaZelaza/Zlota i computeEmpireLivestockUnlocks), wykonywanych na zwroconej mapie wlasciciela.
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const GRA = path.resolve(process.cwd());
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const t = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-pi2-'));
fs.writeFileSync(path.join(t, 'e.ts'), `export { createOwnerImprovementsCache, VersionedMap } from ${JSON.stringify(GRA + '/src/game/trade-routes')};\nexport { territoryOwnerAt } from ${JSON.stringify(GRA + '/src/map/territory')};\n`);
esbuild.buildSync({ entryPoints: [path.join(t, 'e.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: path.join(t, 'b.cjs'), absWorkingDir: GRA, logLevel: 'error', nodePaths: [path.join(GRA, 'node_modules')] });
const { createOwnerImprovementsCache, VersionedMap, territoryOwnerAt } = require(path.join(t, 'b.cjs'));
const [NI, NC, NCALL, NO] = [3000, 70, 1500, 8];
const KEYS = ['farma', 'kopalnia_miedzi', 'kopalnia_zlota', 'glinianka', 'kopalnia_zelaza', 'tartak', 'kopalnia_gliny'];
let s = 1; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; const ri = (n) => Math.floor(rnd() * n);
const basePlaced = []; for (let i = 0; i < NI; i++) basePlaced.push([`${ri(120)},${ri(120)}`, [KEYS[ri(KEYS.length)]]]);
const cities = []; for (let i = 0; i < NC; i++) cities.push({ q: ri(120), r: ri(120), population: 6 + ri(8), ownerId: i % NO });
const buildNodes = () => cities.map((c) => ({ q: c.q, r: c.r, pop: c.population, level: 1, ownerId: c.ownerId }));
const downstream = (m) => { let n = 0; for (const k of KEYS) { for (const layers of m.values()) { for (const x of layers) if (x === k) { n++; break; } } } return n; };
const before = (o, placed) => { const nodes = buildNodes(); const out = new Map(); for (const [k, l] of placed) { const [q, r] = k.split(','); if (territoryOwnerAt(Number(q), Number(r), nodes) === o) out.set(k, l); } return out; };
function scenario(every, withCache) {
  const placed = new VersionedMap(); for (const [k, l] of basePlaced) placed.set(k, l);
  const cache = createOwnerImprovementsCache(territoryOwnerAt);
  let sum = 0;
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < NCALL; i++) {
    // klucz zapisu deterministyczny (nie z gen. RNG), zeby obie gałęzie (PRZED/PO) dostały identyczną sekwencję stanów
    if (every && i % every === 0) placed.set(`${(i * 37) % 120},${(i * 91) % 120}`, ['farma']);
    const o = i % NO;
    const m = withCache ? cache.get(o, placed, buildNodes()) : before(o, placed);
    sum += downstream(m);
  }
  return [Number(process.hrtime.bigint() - t0) / 1e6, sum, withCache ? cache.stats : null];
}
console.log(`ulepszenia=${NI} miasta=${NC} wywolania/ture=${NCALL} wlasciciele=${NO} load=${os.loadavg()[0].toFixed(2)}`);
for (const every of [0, 200, 20, 1]) {
  const label = every === 0 ? 'bez zapisow' : `zapis co ${every} wywolan`;
  for (let i = 1; i <= 3; i++) {
    const [tb, sb] = scenario(every, false);
    const [ta, sa, st] = scenario(every, true);
    console.log(`${label} | przebieg ${i}: PRZED ${tb.toFixed(0)} ms | PO ${ta.toFixed(0)} ms | x${(tb / ta).toFixed(2)} | wynik identyczny: ${sb === sa} | misses=${st.misses} hits=${st.hits}`);
  }
}
fs.rmSync(t, { recursive: true, force: true });
