// REPIN-EKONOMIA-B2 (krok 2, partia B2a): wektory z URUCHOMIONEGO weba 91dc998a.
//   - buildingWorkCost (production.ts:555) z rabatem markera prod_koszt_budynku_proc,
//   - newestAvailableSameTypeUnit + epochNumber (production.ts:190-226).
// Uruchomienie (Node 22, z katalogu tego runu):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-repin-b2-vectors.mjs <WEB_ROOT (git archive 91dc998a gra/src gra/data)> <KATALOG_WYJSCIA>
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
mkdirSync(outDir, { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;

const P = await import(src('game/production.ts'));

// Koder liczb: non-finite jako napis (JSON nie ma NaN/Infinity). Wartosci skonczone bez zmian.
const enc = (x) => (typeof x === 'number' && !Number.isFinite(x) ? String(x) : x);

// ---- buildingWorkCost ------------------------------------------------------
const BASES = [0, 0.4, 1, 2, 3, 7, 10, 25, 100, 999, 12345.6, -5, NaN, Infinity];
const BONUSY_VARIANTS = [
  { name: 'brak', bonusy: undefined },
  { name: 'pusta', bonusy: [] },
  { name: 'm0', bonusy: [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0, realizuje: 'miasto', matrixParamId: 'prod_koszt_budynku_proc' }] },
  { name: 'm01', bonusy: [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.1, realizuje: 'miasto', matrixParamId: 'prod_koszt_budynku_proc' }] },
  { name: 'm025', bonusy: [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.25, realizuje: 'miasto', matrixParamId: 'prod_koszt_budynku_proc' }] },
  { name: 'm05', bonusy: [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.5, realizuje: 'miasto', matrixParamId: 'prod_koszt_budynku_proc' }] },
  { name: 'm099', bonusy: [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.99, realizuje: 'miasto', matrixParamId: 'prod_koszt_budynku_proc' }] },
  { name: 'm1', bonusy: [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: 1, realizuje: 'miasto', matrixParamId: 'prod_koszt_budynku_proc' }] },
  { name: 'mneg', bonusy: [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: -0.3, realizuje: 'miasto', matrixParamId: 'prod_koszt_budynku_proc' }] },
  { name: 'innyParam', bonusy: [{ typ: 'koszt_redukcja', cel: 'jednostki', wartosc: 0.3, realizuje: 'ekonomia', matrixParamId: 'prod_koszt_jednostki_proc' }] },
  { name: 'opisOnly', bonusy: [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.3, opis: 'koszt budynkow', realizuje: 'miasto' }] },
];
// Pace 0 pominiety celowo: web testuje `pace ?` (0 = falsy = brak tempa), a Rust przyjmuje Option;
// wolajacy mapuje falsy pace na None (ZALOZENIE w module repin_b2).
const PACES = [undefined, 'niski', 'normalny', 'wysoki', 1.5];
const OWNERS = [0, 1, 2, -1];
const DIFFS = ['easy', 'normal', 'hard'];

const buildingCases = [];
for (const base of BASES) for (const bv of BONUSY_VARIANTS) for (const pace of PACES) for (const owner of OWNERS) for (const diff of DIFFS) {
  const out = P.buildingWorkCost(base, bv.bonusy, pace, owner, diff);
  buildingCases.push({
    base: enc(base), bonusy: bv.name, pace: pace === undefined ? null : pace, owner, diff, out: enc(out),
  });
}
const bonusyByName = Object.fromEntries(BONUSY_VARIANTS.map(v => [v.name, v.bonusy ?? null]));
writeFileSync(join(outDir, 'building_work_cost.json'), JSON.stringify({
  pin: '91dc998a5f1b51ad29e0f4785edfd45655445c53',
  bonusyVariants: Object.fromEntries(Object.entries(bonusyByName).map(([k, v]) => [k, v])),
  cases: buildingCases,
}, null, 1) + '\n');

// ---- epochNumber + newestAvailableSameTypeUnit ----------------------------
const EPOKI = ['Kamien', 'Kamień', 'Braz', 'Brąz', 'Zelazo', 'Żelazo', 'Nieznana', '', 'constructor', null];
const epochCases = EPOKI.map(e => ({ epoka: e, out: P.epochNumber(e) }));

const UNITS = [
  { Jednostka: 'A1', Typ: 'Piechota', Epoka: 'Kamien' },
  { Jednostka: 'A2', Typ: 'Piechota', Epoka: 'Braz' },
  { Jednostka: 'A3', Typ: ' Piechota ', Epoka: 'Zelazo' },
  { Jednostka: 'A4', Typ: 'Piechota', Epoka: 'Żelazo' },
  { Jednostka: 'B1', Typ: 'Lucznik', Epoka: 'Braz' },
  { Jednostka: 'A5', Typ: '', Epoka: 'Zelazo' },
  { Jednostka: 'A6', Typ: 'Piechota', Epoka: 'Nieznana' },
  { Jednostka: 'A7', Typ: 'Piechota' },
  { Jednostka: 'A8', Typ: 'Piechota', Epoka: null },
  { Jednostka: 'A1', Typ: 'Lucznik', Epoka: 'Zelazo' },
  { Jednostka: 'D1', Typ: 'Piechota', Epoka: 'Zelazo' },
  { Jednostka: 'E1', Typ: 'Piechota', Epoka: 'Braz' },
  { Jednostka: 'E2', Typ: 'Piechota', Epoka: 'Braz' },
];
const CURRENT = ['A1', 'A2', 'A5', 'B1', 'A7', 'A8', 'A3', 'A4', 'E1', 'ZZZ'];
const CAND_SETS = [
  ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'B1', 'D1', 'E1', 'E2'],
  ['A2', 'A3'],
  ['A4', 'A3'],
  ['A6'],
  ['A7', 'A8', 'E2'],
  ['B1', 'A1'],
  [],
];
const unitCases = [];
for (const cur of CURRENT) for (const cands of CAND_SETS) {
  const hit = P.newestAvailableSameTypeUnit(cur, cands, UNITS);
  unitCases.push({ current: cur, candidates: cands, out: hit ? hit.Jednostka + '|' + hit.Epoka + '|' + hit.Typ : null, outIndex: hit ? UNITS.indexOf(hit) : null });
}
writeFileSync(join(outDir, 'unit_newest.json'), JSON.stringify({
  pin: '91dc998a5f1b51ad29e0f4785edfd45655445c53',
  units: UNITS,
  epochCases,
  cases: unitCases,
}, null, 1) + '\n');

console.log(`building=${buildingCases.length} unitCases=${unitCases.length} epoch=${epochCases.length}`);
