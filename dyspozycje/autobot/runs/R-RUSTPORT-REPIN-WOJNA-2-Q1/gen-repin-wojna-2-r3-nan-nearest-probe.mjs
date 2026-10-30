// Probe: web nearestLivingGeneral (generals.ts @ dc8a3adc) dla kandydatow z NaN wspolrzednymi.
// Uruchomienie: node --experimental-strip-types nan-probe.mjs <WEB_ROOT> <WORK_DIR> <OUT_JSON>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [webRoot, workDir, outJson] = process.argv.slice(2);
writeFileSync(join(workDir, 'generals.ts'), readFileSync(join(webRoot, 'gra/src/game/generals.ts'), 'utf8'));
const G = await import(pathToFileURL(join(workDir, 'generals.ts')).href);

let seed = 4242;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const cases = [];
for (let c = 0; c < 400; c++) {
  const n = ri(2, 5);
  const coord = () => (rnd() < 0.3 ? NaN : ri(0, 3));
  const roster = [];
  const used = new Set();
  for (let i = 0; i < n; i++) {
    const id = ids[ri(0, ids.length - 1)];
    if (used.has(id)) continue;
    used.add(id);
    roster.push({ id, ownerId: 0, q: coord(), r: coord(), isGeneral: true });
  }
  const unit = { id: 'u', ownerId: 0, q: ri(0, 3), r: ri(0, 3), isGeneral: false };
  const out = G.nearestLivingGeneral(unit, roster);
  cases.push({ unit, roster, out: out ? out.id : null });
}
const withNaN = cases.filter((c) => c.roster.some((g) => Number.isNaN(g.q) || Number.isNaN(g.r)));
console.log(`cases=${cases.length} withNaNCandidate=${withNaN.length}`);
const enc = (x) => (Number.isNaN(x) ? 'NaN' : String(x));
const doc = cases.map((c) => ({
  unit: { ...c.unit, q: enc(c.unit.q), r: enc(c.unit.r), ownerId: '0' },
  roster: c.roster.map((g) => ({ ...g, q: enc(g.q), r: enc(g.r), ownerId: '0' })),
  out: c.out,
}));
writeFileSync(outJson, JSON.stringify(doc));
