// Generator: wektory webowego planGeneralLimitDemotions (origin/main gra/src/game/generals.ts).
// Uruchomienie: node gen-demotion-vectors.mjs <sciezka do generals.mts> <wyjscie.json>
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
const [, , src, out] = process.argv;
const web = await import(pathToFileURL(src).href);
let seed = 12345;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const eras = [1, 2, 3, 0, -4, 2.7, 3.99, NaN, Infinity, -Infinity, 10];
const flags = [true, true, true, false, undefined, null, 'true', 1];
const cases = [];
const fixed = [
  { roster: [], eras: {} },
  { roster: [{ id: 'g1', ownerId: 0, isGeneral: true }], eras: { 0: 1 } },
  { roster: [{ id: 'g1', ownerId: 0, isGeneral: true }, { id: 'g2', ownerId: 0, isGeneral: true }], eras: { 0: 1 } },
  { roster: [{ id: 'g1', ownerId: 0, isGeneral: true }, { id: 'g2', ownerId: 0, isGeneral: true }, { id: 'g3', ownerId: 0, isGeneral: true }], eras: { 0: 3 } },
  { roster: [{ id: 'g1', ownerId: 0, isGeneral: true }, { id: 'u', ownerId: 0 }, { id: 'g2', ownerId: 0, isGeneral: true }], eras: { 0: 1 } },
  { roster: [{ id: 'a', ownerId: 0, isGeneral: true }, { id: 'b', ownerId: 1, isGeneral: true }, { id: 'c', ownerId: 0, isGeneral: true }, { id: 'd', ownerId: 1, isGeneral: true }], eras: { 0: 1, 1: 2 } },
  { roster: [{ id: 'x', ownerId: 3, isGeneral: true }, { id: 'y', ownerId: 3, isGeneral: true }], eras: {} },
];
for (const f of fixed) cases.push(f);
for (let i = 0; i < 400; i++) {
  const n = Math.floor(rnd() * 14);
  const roster = [];
  for (let k = 0; k < n; k++) {
    const u = { id: `u${i}_${k}`, ownerId: Math.floor(rnd() * 4) };
    const fl = pick(flags);
    if (fl !== undefined) u.isGeneral = fl;
    roster.push(u);
  }
  const eraMap = {};
  for (let o = 0; o < 4; o++) if (rnd() < 0.7) eraMap[o] = pick(eras);
  cases.push({ roster, eras: eraMap });
}
const enc = (x) => (Number.isNaN(x) ? 'NaN' : x === Infinity ? 'Infinity' : x === -Infinity ? '-Infinity' : x);
const outCases = cases.map((c) => {
  // Brak wpisu epoki = 1 (ZALOZENIE generatora: w grze gameStartEra; tu stala, bo wartosc jest parametrem).
  const demote = web.planGeneralLimitDemotions(c.roster, (o) => (Object.prototype.hasOwnProperty.call(c.eras, String(o)) ? c.eras[o] : 1));
  return {
    roster: c.roster,
    eras: Object.fromEntries(Object.entries(c.eras).map(([k, v]) => [k, enc(v)])),
    expectedDemote: demote,
  };
});
writeFileSync(out, JSON.stringify({ generator: 'origin/main gra/src/game/generals.ts planGeneralLimitDemotions', node: process.version, cases: outCases }, null, 1));
console.log('cases', outCases.length, 'with demotions', outCases.filter((c) => c.expectedDemote.length > 0).length);
