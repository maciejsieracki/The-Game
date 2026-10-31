'use strict';
/**
 * Weryfikacja produkcji Kamieniołomu/Tartaku przez rzeczywisty resolver
 * i rzeczywiste naliczanie terytorialne.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.kamieniolom-kamien-epoka-entry.ts');
const BUNDLE = path.join(__dirname, '.kamieniolom-kamien-epoka-bundle.cjs');
const MUTATED_TERRAIN = path.resolve(__dirname, '..', 'src/game/.kamieniolom-kamien-epoka-mutated.ts');
const formulaModule = process.env.MUTATE_FORMULA
  ? '../src/game/.kamieniolom-kamien-epoka-mutated'
  : '../src/game/terrain-improvements';

if (process.env.MUTATE_FORMULA) {
  const sourcePath = path.resolve(__dirname, '..', 'src/game/terrain-improvements.ts');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const mutated = source.replace('Math.pow(1.5, normalizedEra - 1)', 'Math.pow(1.4, normalizedEra - 1)');
  if (mutated === source) throw new Error('Nie znaleziono formuły epoki do mutacji');
  fs.writeFileSync(MUTATED_TERRAIN, mutated, 'utf8');
}
const cleanup = () => {
  if (fs.existsSync(ENTRY)) fs.unlinkSync(ENTRY);
  if (fs.existsSync(BUNDLE)) fs.unlinkSync(BUNDLE);
  if (fs.existsSync(MUTATED_TERRAIN)) fs.unlinkSync(MUTATED_TERRAIN);
};
process.on('exit', cleanup);

fs.writeFileSync(ENTRY, `
export {
  territoryResourceYieldForImprovement,
} from '../src/game/terrain-improvements';
export { resourceProductionAmountForEra } from '${formulaModule}';
export { computeTerritoryResourceYieldByCity } from '../src/game/turn-economy';
export { buildTerritoryNodesFromCities } from '../src/map/territory-work';
`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE,
  absWorkingDir: GRA, logLevel: 'silent' });
const M = require(BUNDLE);
const data = require('../data/terrain-improvements.json');
let passed = 0;
let failed = 0;
function ok(condition, message) {
  if (condition) { passed += 1; console.log('PASS:', message); }
  else { failed += 1; console.error('FAIL:', message); }
}
function eq(actual, expected, message) { ok(actual === expected,
  `${message} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`); }
function makeMap(keys) {
  const hexes = {};
  keys.forEach((key, index) => {
    hexes[`${index},0`] = { coords: { q: index, r: 0 }, ulepszenie: key };
  });
  return { hexes, riverPaths: [] };
}
function territoryTotal(keys, era) {
  const cities = [{ id: 'c0', ownerId: 0, q: 0, r: 0, population: 1 }];
  const map = makeMap(keys);
  const nodes = M.buildTerritoryNodesFromCities(cities);
  const result = M.computeTerritoryResourceYieldByCity(cities, map, nodes, () => era);
  return result.get('c0')?.kamien ?? result.get('c0')?.drewno ?? 0;
}

console.log('-- Dane bazowe --');
// R-WEB-SAWMILL-QUARRY-PRODUCTION-50-Q1 (2026-10-31): baza 50 przywrócona decyzją
// właściciela (regres 200 z commita 9175f031f). Skalowanie epoką x1,5 bez zmian: 50/75/113.
eq(data.kamieniolom.surowiec_ilosc_tura, 50, 'Kamieniołom ma bazę 50');
eq(data.tartak.surowiec_ilosc_tura, 50, 'Tartak ma bazę 50');

console.log('-- Resolver: epoki 1–3, niepoprawna epoka --');
for (const [era, expected] of [[1, 50], [2, 75], [3, 113]]) {
  eq(M.territoryResourceYieldForImprovement('kamieniolom', null, era)?.amount,
    expected, `Kamieniołom epoka ${era}`);
  eq(M.territoryResourceYieldForImprovement('tartak', null, era)?.amount,
    expected, `Tartak regresja epoka ${era}`);
}
eq(M.territoryResourceYieldForImprovement('kamieniolom', null, 0)?.amount, 50,
  'epoka 0 używa bezpiecznie epoki 1');
eq(M.territoryResourceYieldForImprovement('kamieniolom', null, 99)?.amount, 50,
  'niepoprawna epoka używa bezpiecznie epoki 1');
eq(M.territoryResourceYieldForImprovement('kamieniolom', null, undefined)?.amount, 50,
  'epoka undefined używa bezpiecznie epoki 1');
eq(M.territoryResourceYieldForImprovement('kamieniolom', null, NaN)?.amount, 50,
  'epoka NaN używa bezpiecznie epoki 1');

console.log('-- Rzeczywiste naliczanie terytorialne --');
for (const [era, expected] of [[1, 50], [2, 75], [3, 113]]) {
  eq(territoryTotal(['kamieniolom'], era), expected,
    `jeden Kamieniołom epoka ${era}`);
  eq(territoryTotal(['kamieniolom', 'kamieniolom'], era), expected * 2,
    `dwa Kamieniołomy epoka ${era}`);
  eq(territoryTotal([], era), 0, `brak Kamieniołomu epoka ${era}`);
}

console.log('-- Granice formuły i bazy 50 (R-WEB-SAWMILL-QUARRY-PRODUCTION-50-Q1) --');
for (const era of [undefined, 0, 4, NaN]) {
  eq(M.resourceProductionAmountForEra('tartak', 50, era), 50,
    `resourceProductionAmountForEra tartak era=${String(era)} → 50`);
  eq(M.resourceProductionAmountForEra('kamieniolom', 50, era), 50,
    `resourceProductionAmountForEra kamieniolom era=${String(era)} → 50`);
}
eq(M.resourceProductionAmountForEra('tartak', 50, 1), 50, 'tartak era 1 → 50');
eq(M.resourceProductionAmountForEra('tartak', 50, 2), 75, 'tartak era 2 → 75');
eq(M.resourceProductionAmountForEra('tartak', 50, 3), 113, 'tartak era 3 → 113');
eq(M.resourceProductionAmountForEra('glinianka', 50, 3), 50, 'glinianka bez skalowania epoką: era 3 → 50');
eq(M.territoryResourceYieldForImprovement('glinianka', null, 3)?.amount, 50,
  'glinianka bez skalowania (resolver, era 3) = 50');
eq(M.territoryResourceYieldForImprovement('tartak', null, 1)?.amount, 50,
  'tartak epoka 1 = 50 (wartość startowa)');
eq(territoryTotal(['kamieniolom', 'kamieniolom'], 1), 100,
  'dwa Kamieniołomy w epoce 1 = 100 (stawka per ulepszenie)');

console.log('-- Mutacja formuły --');
eq(M.resourceProductionAmountForEra('kamieniolom', 50, 2), 75,
  'mutacja samej formuły/mnożnika epoki (MUTATE_FORMULA=1) musi zaczerwienić test');

console.log(`\n${passed} PASS, ${failed} FAIL`);
process.exitCode = failed ? 1 : 0;
