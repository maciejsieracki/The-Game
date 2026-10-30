// Generator wektorow D2.2b (Step 2 + Step 3' port + praca netto), uruchamia WEB z pinu 91dc998a.
// Wycinek economy-head-slice.mts (verbatim L849-860, L884-890, L892-903) + civ-matrix.ts@91dc998a.
import { writeFileSync } from 'node:fs';
import { cityYieldHeadSlice } from '../gra/src/game/economy-head-slice.mts';
import { loadCivMatrix } from '../gra/src/game/civ-matrix.ts';

const out = process.argv[2];
const f = (x: number): { f: string } => ({ f: Object.is(x, -0) ? '-0' : String(x) });
const enc = (v: any): any => {
  if (v === undefined) return { u: true };
  if (v === null) return null;
  if (typeof v === 'number') return f(v);
  return v;
};

let seed = 0x5eed2d2b;
const rnd = (): number => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
const SPECIAL = [0, -0, 1, 2.5, 7, 13.7, 100, 1e6, NaN, Infinity, -Infinity, 0.5, 0.999, 1e-9, 250.99999, -3];
const num = (lo: number, hi: number): number =>
  rnd() < 0.2 ? pick(SPECIAL) : Math.round((lo + rnd() * (hi - lo)) * 100) / 100;

const matrix = loadCivMatrix();
const keyPool: (string | null | undefined)[] = [null, undefined, '', 'nieznana_cywilizacja', 'GRECY', 'Grecy'];
for (const row of matrix.cywilizacje) {
  keyPool.push(row.ikonaId, row.typCywilizacji, row.Cywilizacja);
}
const PARAM_POOL = [
  { budynekMlynMnoznikPracy: 2, budynekMlynBonusPracy: 2, budynekCegielniBonusPracy: 0.25 },
  { budynekMlynMnoznikPracy: 1.5, budynekMlynBonusPracy: 0, budynekCegielniBonusPracy: 0 },
  { budynekMlynMnoznikPracy: 0, budynekMlynBonusPracy: -0, budynekCegielniBonusPracy: -0 },
  { budynekMlynMnoznikPracy: NaN, budynekMlynBonusPracy: 3, budynekCegielniBonusPracy: 0.1 },
];

const cases: any[] = [];
const N = 1200;
for (let i = 0; i < N; i++) {
  const civKey = pick(keyPool);
  const a = {
    pracaTerenu: num(0, 300),
    pracaBudynkow: num(0, 120),
    pieniadzBudynkow: num(0, 80),
    pieniadzPortu: rnd() < 0.3 ? 0 : num(0, 60),
  };
  const city = { civKey };
  const ctx = { maMlyn: pick([true, false]), maCegielnia: pick([true, false]) };
  const params = pick(PARAM_POOL);
  const got = cityYieldHeadSlice(city, ctx, params, a);
  const encObj = (o: any) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, enc(v)]));
  cases.push({
    in: {
      a: encObj(a),
      city: { civKey: enc(civKey) },
      ctx: encObj(ctx),
      params: encObj(params),
    },
    out: encObj(got),
  });
}

writeFileSync(out, JSON.stringify({ pin: '91dc998a', n: cases.length, cases }, null, 0) + '\n');
console.log(`wrote ${cases.length} cases`);
