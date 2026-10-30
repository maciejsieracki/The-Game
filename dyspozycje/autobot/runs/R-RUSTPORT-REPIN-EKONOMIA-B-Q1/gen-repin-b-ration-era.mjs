// REPIN-EKONOMIA-B (krok 2, batch 1): wektory mnoznika ery Racji z URUCHOMIONEGO weba 91dc998a.
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

const enc = (x) => (typeof x === 'number' && !Number.isFinite(x) ? String(x) : x);
const LEVELS = [0, 0.5, 1, 2.5, 4, 6];
const POPS = [0, 1, 5.5, 100, 12345.678, -3];
const ERAS = [undefined, 0, 0.5, 1, 1.0000001, 2, 3, 4, 5, NaN, Infinity, -Infinity];
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
const eraMults = ERAS.map(e => ({ era: e === undefined ? null : enc(e), mult: enc(PG.rationEraFoodCostMultiplier(e)) }));
writeFileSync(outFile, JSON.stringify({ pin: '91dc998a5f1b51ad29e0f4785edfd45655445c53', eraMults, cases }, null, 1) + '\n');
console.log(`cases=${cases.length} eraMults=${eraMults.length}`);
