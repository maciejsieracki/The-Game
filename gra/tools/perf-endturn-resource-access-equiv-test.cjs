'use strict';
/**
 * perf-endturn-resource-access-equiv-test.cjs — R-WEB-PERF-ENDTURN-AI-PHASE-Q1 (R2).
 * Równoważność WARTOŚCIOWA: getResourceAccessForCity (po zmianie: bez liczenia `potential`)
 * == getCityResourceAccessForCity(...).active na >= 200 losowych stanach (prawdziwe funkcje
 * przez esbuild, nie regexy). Mutacje: ignorowanie placedImprovements / options / sortowania -> test pada.
 * Plus mikro-benchmark (--bench) na dużym syntetycznym stanie (137 miast), n>=7, min/med/max.
 * Uruchom z gra/:  node tools/perf-endturn-resource-access-equiv-test.cjs [--bench]
 */
const fs = require('fs'); const os = require('os'); const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const SRC = path.resolve(__dirname, '..', 'src');
const BENCH = process.argv.includes('--bench');

async function bundle(mutate) {
  const plugin = { name: 'mut', setup(b) {
    if (!mutate) return;
    b.onLoad({ filter: /game[\\/]resource-access\.ts$/ }, args => {
      const before = fs.readFileSync(args.path, 'utf8');
      const s = mutate(before);
      if (s === before) throw new Error('mutacja nie zadziałała');
      return { contents: s, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  } };
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ra-eq-')), 'b.cjs');
  await esbuild.build({
    stdin: { contents: `export * from './game/resource-access'; export { Nakladka, TerenBazowy } from './types/hex';`,
      resolveDir: SRC, loader: 'ts' },
    bundle: true, platform: 'node', format: 'cjs', outfile: out, write: true, plugins: [plugin],
    loader: { '.json': 'json' }, logLevel: 'silent',
  });
  const m = require(out);
  fs.rmSync(path.dirname(out), { recursive: true, force: true });
  return m;
}

let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)];

function makeState(M, radius, nCities) {
  const hexes = {};
  const terrain = [M.TerenBazowy.Laka, M.TerenBazowy.Rownina, M.TerenBazowy.Wzgorza, M.TerenBazowy.Gory, M.TerenBazowy.PlytkieMorze, M.TerenBazowy.Pustynia];
  const nak = [M.Nakladka.Brak, M.Nakladka.Brak, M.Nakladka.Las, M.Nakladka.ZlozeGliny, M.Nakladka.ZlozeRudy, M.Nakladka.ZlozeKonia];
  const zl = [undefined, undefined, undefined, 'sol', 'zloto', 'miedz', 'zelazo', 'cyna', 'wegiel', 'kon'];
  const keys = [];
  for (let q = -radius; q <= radius; q++) for (let r = -radius; r <= radius; r++) {
    const k = `${q},${r}`; keys.push(k);
    hexes[k] = { coords: { q, r }, terenBazowy: pick(terrain), nakladka: pick(nak), zloze: pick(zl), zlozeMinEra: pick([1, 2, 3]) };
  }
  const map = { szerokoscQ: 2 * radius + 1, wysokoscR: 2 * radius + 1, hexes };
  const imps = ['farma', 'irygacja', 'bydlo', 'owce', 'lama', 'stadnina', 'glinianka', 'kamieniolom', 'wyrab', 'tartak',
    'warzelnia_soli', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_cyny', 'kopalnia_zlota', 'droga'];
  const placed = new Map();
  const nImp = Math.floor(keys.length * (0.1 + rnd() * 0.3));
  for (let i = 0; i < nImp; i++) {
    const k = pick(keys);
    placed.set(k, rnd() < 0.2 ? [pick(imps), pick(imps)] : pick(imps));
  }
  const cities = [];
  for (let i = 0; i < nCities; i++) {
    const h = hexes[pick(keys)].coords;
    cities.push({ id: 'c' + i, q: h.q, r: h.r, population: Math.floor(rnd() * 14), kulturaSkumulowana: Math.floor(rnd() * 400) });
  }
  return { map, placed, cities };
}
function randOpts() {
  const o = {};
  if (rnd() < 0.5) o.ownerId = pick(['0', '1', 'ai1']);
  if (rnd() < 0.5) o.builtIds = pick([[], ['piec_hutniczy'], ['odlewnia_brazu', 'piec_hutniczy']]);
  if (rnd() < 0.6) o.empireStock = { braz: pick([0, 3]), zloto: pick([0, 0, 5]) };
  if (rnd() < 0.3) o.empireLivestockUnlocks = new Set(pick([[], ['kon'], ['bydlo', 'kon']]));
  return o;
}

let fails = 0;
let base;
async function main() {
base = await bundle(null);
function runEquiv(M, count) {
  seed = 12345; let n = 0, nonEmpty = 0, diff = 0;
  for (let s = 0; s < count; s++) {
    const st = makeState(M, 6 + Math.floor(rnd() * 6), 5);
    for (const c of st.cities) {
      const era = pick([1, 2, 3, 99]); const o = randOpts();
      const pl = rnd() < 0.1 ? null : st.placed;
      const a = M.getResourceAccessForCity(c, st.map, pl, era, o);
      const b = base.getCityResourceAccessForCity(c, st.map, pl, era, o).active;
      n++; if (b.length) nonEmpty++;
      if (JSON.stringify(a) !== JSON.stringify(b)) diff++;
    }
  }
  return { n, nonEmpty, diff };
}
const r0 = runEquiv(base, 60);
console.log(`[equiv] losowych przypadków(miasto x stan)=${r0.n}, niepustych active=${r0.nonEmpty}, różnic=${r0.diff}`);
if (r0.diff !== 0 || r0.n < 200 || r0.nonEmpty < 50) { console.log('FAIL równoważność / pokrycie'); fails++; }
{
  const st = makeState(base, 8, 1); const c = st.cities[0];
  const x = JSON.stringify(base.getResourceAccessForCity(c, st.map, st.placed, 1, {}));
  const y = JSON.stringify(base.getResourceAccessForCity(c, st.map, st.placed, 99, {}));
  console.log('[era-niezależność active]', x === y ? 'OK' : 'FAIL'); if (x !== y) fails++;
}
const muts = {
  'ignoruj placedImprovements': s => s.replace('sortLabels(collectActiveAccess(city, map, placedImprovements, options))', 'sortLabels(collectActiveAccess(city, map, null, options))'),
  'odwrocone sortowanie': s => s.replace('return sortLabels(collectActiveAccess(city, map, placedImprovements, options));', 'return Array.from(collectActiveAccess(city, map, placedImprovements, options)).sort().reverse();'),
  'ignoruj options': s => s.replace('sortLabels(collectActiveAccess(city, map, placedImprovements, options))', 'sortLabels(collectActiveAccess(city, map, placedImprovements, {}))'),
};
for (const [name, f] of Object.entries(muts)) {
  const M = await bundle(f); const r = runEquiv(M, 60);
  console.log(`[mutacja] ${name}: różnic=${r.diff} ->`, r.diff > 0 ? 'WYKRYTA (OK)' : 'NIEWYKRYTA (FAIL)'); if (r.diff === 0) fails++;
}
if (BENCH) {
  seed = 777; const st = makeState(base, 40, 137);
  for (const c of st.cities) c.population = 8 + Math.floor(rnd() * 8);
  const o = { ownerId: '1', empireStock: { braz: 1, zloto: 1 } };
  const fOld = c => base.getCityResourceAccessForCity(c, st.map, st.placed, 99, o).active;
  const fNew = c => base.getResourceAccessForCity(c, st.map, st.placed, 99, o);
  const t = fn => { const a = process.hrtime.bigint(); let h = 0; for (const c of st.cities) h += fn(c).length; return [Number(process.hrtime.bigint() - a) / 1e6, h]; };
  const stat = a => { const s = [...a].sort((x, y) => x - y); return `min ${s[0].toFixed(1)} / med ${s[Math.floor(s.length / 2)].toFixed(1)} / max ${s[s.length - 1].toFixed(1)} ms`; };
  const A = [], B = []; let ha, hb;
  t(fOld); t(fNew);
  for (let i = 0; i < 9; i++) { const [x, h1] = t(fOld); const [y, h2] = t(fNew); A.push(x); B.push(y); ha = h1; hb = h2; }
  console.log(`[bench 137 miast/6561 heksów syntetyczne, n=9 naprzemiennie, load ${os.loadavg().map(v => v.toFixed(2)).join('/')}] przed: ${stat(A)}; po: ${stat(B)}; wynik identyczny: ${ha === hb}`);
  if (ha !== hb) fails++;
}
console.log(fails ? `FAIL (${fails})` : 'PASS');
process.exit(fails ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
