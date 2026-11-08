// REPIN-EKONOMIA-F runda 3: regeneracja z web origin/main 16c0509f6 (rationEraFoodCostMultiplier usuniety w webie
// -> eraMults z citizenConsumptionEraMultiplier; computeCityRationCost bez zmiany sygnatury).
// (oryginal) REPIN-EKONOMIA-B (krok 2, batch 1): wektory mnoznika ery Racji z URUCHOMIONEGO weba 91dc998a.
// Uruchomienie (Node 22, z katalogu tego runu):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-repin-b-ration-era.mjs <WEB_ROOT = katalog z gra/src i gra/data (git archive 91dc998a)> <PLIK_WYJSCIA.json>
import { writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outFile = presolve(process.argv[3]);
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;

await import(src('game/cities.ts'));
const PG = await import(src('game/population-growth-v85.ts'));
const CE = await import(src('game/citizen-consumption-era.ts'));

// Niecalkowite i niefinitowe jako napisy: serde_json (bez float_roundtrip) potrafi sparsowac liczbe o 1 ulp obok
// (np. 92592.58499999999) - test parsuje napisy std `str::parse::<f64>` (poprawne zaokraglenie).
const enc = (x) => (typeof x === 'number' && (!Number.isFinite(x) || !Number.isInteger(x)) ? String(x) : x);
const LEVELS = [0, 0.5, 1, 2.5, 4, 6];
const POPS = [0, 1, 5.5, 100, 12345.678, -3];
const ERAS = [undefined, 0, 0.5, 1, 1.0000001, 1.999, 2, 2.5, 3, 4, 5, 6, NaN, Infinity, -Infinity];
const SPICH = [
  null,
  { ceramikaActive: true, solActive: false, maSpichlerzPop: false, maSpichlerzIIPop: false },
  { ceramikaActive: true, solActive: true, maSpichlerzPop: true, maSpichlerzIIPop: true },
];
const cases = [];
for (const pop of POPS) for (const level of LEVELS) for (const era of ERAS) for (const st of SPICH) {
  const spich = st ?? undefined;
  const out = era === undefined
    ? PG.computeCityRationCost(pop, level, undefined, spich)
    : PG.computeCityRationCost(pop, level, undefined, spich, era);
  cases.push({ pop: enc(pop), level: enc(level), era: era === undefined ? null : enc(era), st, out: enc(out) });
}
const eraMults = ERAS.map(e => ({ era: e === undefined ? null : enc(e), mult: enc(CE.citizenConsumptionEraMultiplier(e)) }));
writeFileSync(outFile, JSON.stringify({ pin: '16c0509f633a0c437ddf4fbdf1f41a38e109befc', eraMults, cases }, null, 1) + '\n');
console.log(`cases=${cases.length} eraMults=${eraMults.length}`);
