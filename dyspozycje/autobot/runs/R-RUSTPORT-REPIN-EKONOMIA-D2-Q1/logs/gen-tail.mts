// Generator wektorow D2.2a (REPIN-EKONOMIA-D2): uruchamia WEB z pinu 91dc998a.
// Wycinek economy.ts@91dc998a L908-1009 (verbatim, patrz economy-tail-slice.mts) + civ-matrix.ts@91dc998a.
// Uruchomienie (katalog roboczy = kopia weba): node --experimental-strip-types --import ./gen/register.mjs gen/gen-tail.mts <out.json>
import { writeFileSync } from 'node:fs';
import { cityYieldTailSlice } from '../gra/src/game/economy-tail-slice.mts';
import { loadCivMatrix } from '../gra/src/game/civ-matrix.ts';

const out = process.argv[2];
const f = (x: number): { f: string } => ({ f: Object.is(x, -0) ? '-0' : String(x) });
const enc = (v: any): any => {
  if (v === undefined) return { u: true };
  if (v === null) return null;
  if (typeof v === 'number') return f(v);
  return v;
};

// Deterministyczny PRNG (mulberry32).
let seed = 0x5eed2202;
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

const PARAMS_POOL = [
  { korupcjaCap: 0.5, mennicaMnoznikPoWalucie: 1.5, budynekBibliotekaBonusNauki: 0.15, budynekAkademiaBonusNauki: 0.1, budynekGarncarniaBonusZywnosci: 0.1, zywnoscZuzytkaPopulacja: 0.5 },
  { korupcjaCap: 0.2, mennicaMnoznikPoWalucie: 1.62, budynekBibliotekaBonusNauki: 0, budynekAkademiaBonusNauki: 0, budynekGarncarniaBonusZywnosci: 0, zywnoscZuzytkaPopulacja: 0.3 },
  { korupcjaCap: 1, mennicaMnoznikPoWalucie: 1, budynekBibliotekaBonusNauki: 0.25, budynekAkademiaBonusNauki: 0.5, budynekGarncarniaBonusZywnosci: 0.2, zywnoscZuzytkaPopulacja: 0 },
  { korupcjaCap: NaN, mennicaMnoznikPoWalucie: 0, budynekBibliotekaBonusNauki: -0, budynekAkademiaBonusNauki: 1, budynekGarncarniaBonusZywnosci: 0.1, zywnoscZuzytkaPopulacja: 0.5 },
];

const cases: any[] = [];
const N = 2400;
for (let i = 0; i < N; i++) {
  const civKey = pick(keyPool);
  const spec: string[] = [];
  const nSpec = Math.floor(rnd() * 4);
  for (let s = 0; s < nSpec; s++) spec.push(pick(['poborca', 'poborca', 'inny']));
  const procNauka = pick([0, 10, 33, 50, 100, 37.5, -10, 120]);
  const procPien = pick([0, 20, 33, 50, 100, 62.5, NaN]);
  const procLux = pick([0, 0, 10, 25, 100]);
  const ctxOpt = (pool: any[]) => (rnd() < 0.3 ? undefined : pick(pool));
  const a = {
    handelTerenu: num(0, 300),
    pieniadzBudynkow: num(0, 80),
    naukaBudynkow: num(0, 60),
    zywnoscTerenu: num(0, 400),
    zywnoscBudynkow: num(0, 120),
    kulturaBudynkow: num(0, 40),
  };
  const city = {
    civKey,
    ludnosc: num(0, 30),
    podziałHandlu: { procentNauka: procNauka, procentPieniadz: procPien, procentLuksus: procLux },
    specjalisci: spec,
  };
  const ctx = {
    strataFraction: rnd() < 0.15 ? pick(SPECIAL) : Math.round(rnd() * 1000) / 1000,
    walutaOdkryta: ctxOpt([true, false, true]),
    maMennica: ctxOpt([true, false, true]),
    maBiblioteka: pick([true, false]),
    maAkademia: pick([true, false]),
    civHandelMult: ctxOpt([1, 0, 2.5, NaN, 1.15]),
    premiaHandluTrasHandlowych: ctxOpt([0, -5, 10.5, 0.25, NaN]),
    additionalTax: ctxOpt([0, -3, 12.7, NaN, Infinity, 4.2]),
    civNaukaMult: ctxOpt([1, 0, 1.5]),
    liczbaGarncarni: ctxOpt([0, 1, 3]),
    wojskoZuzycieZywnosci: pick([0, 5.5, 2]),
  };
  const params = pick(PARAMS_POOL);
  const got = cityYieldTailSlice(city, ctx, params, a);
  const encObj = (o: any) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, enc(v)]));
  cases.push({
    in: {
      a: encObj(a),
      city: { civKey: enc(civKey), ludnosc: enc(city.ludnosc), podzial: encObj(city.podziałHandlu), specjalisci: spec },
      ctx: encObj(ctx),
      params: encObj(params),
    },
    out: encObj(got),
  });
}

writeFileSync(out, JSON.stringify({ pin: '91dc998a', n: cases.length, cases }, null, 0) + '\n');
console.log(`wrote ${cases.length} cases`);
