'use strict';
/**
 * power-ranking-view-test.cjs -- P-MOC-PODZIAL-WIDOK (Maciej 2026-08-12): przełącznik widoku
 * Rankingu Mocy (Całkowita / Gospodarcza / Militarna) w panelu imperium.
 * Run: cd gra && node tools/power-ranking-view-test.cjs
 *
 * Zakres:
 *  [1] computeObjectivePower: dla jednej cywilizacji suma "military" (Armia+Rekruci) + suma
 *      "!military" (reszta) == power całkowity (filtr wg tej samej listy components, bez
 *      osobnego silnika liczenia -- zgodnie z ZADANIEM dla dispatchu w PYTANIA-OTWARTE.md).
 *  [2] loadMilitaryComponentKeys: WYŁĄCZNIE armia+rekruci otagowane wojskowe (JSON `wojskowy`).
 *  [3] sortPowerRankingForMode / powerRankingValueForMode (ui/powerOverlayHud.ts): 3 tryby dają
 *      RÓŻNE sumy per cywilizacja i re-sortują/re-numerują CAŁY ranking (nie tylko gracza).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.power-ranking-view-entry.ts');
const BUNDLE = path.join(__dirname, '.power-ranking-view-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { computeObjectivePower, loadMilitaryComponentKeys } from '../src/game/power-objective';
export { sortPowerRankingForMode, powerRankingValueForMode } from '../src/ui/powerOverlayHud';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('power-ranking-view-test (P-MOC-PODZIAL-WIDOK)\n');

// --- [1] + [2]: computeObjectivePower -- military + economic == total, dla jednej cywilizacji ---
const civInput = {
  ownerId: 0,
  epoka: 1,
  jednostki: 483,
  wygraneBitwy: 0,
  bitwyPktSum: 461,
  sumaLudkow: 285,
  rekrutEkw: 281,
  miasta: 49,
  heksyTerytorium: 2540,
  budynki: 341,
  techZbadane: 23,
  ulepszeniaTerenu: 615,
  kulturaImperium: 2634,
  miastaJednoscReligii: 49,
  zdobyczePower: 440,
};
const obj = M.computeObjectivePower(civInput);
let militarySum = 0;
let economicSum = 0;
for (const c of obj.components) {
  if (c.military) militarySum += c.points;
  else economicSum += c.points;
}
assert(Math.round(militarySum + economicSum) === obj.power,
  `military(${militarySum}) + economic(${economicSum}) = power total (${obj.power})`);
assert(militarySum > 0, `military > 0 (Armia+Rekruci realnie w sumie) -- got ${militarySum}`);
assert(economicSum > 0, `economic > 0 (reszta skladnikow) -- got ${economicSum}`);
assert(militarySum !== obj.power && economicSum !== obj.power,
  '3 wartosci (total/economic/military) SA ROZNE dla tej samej cywilizacji (nietrywialny podzial)');

const militaryKeys = M.loadMilitaryComponentKeys();
assert(militaryKeys.size === 2, `dokladnie 2 skladniki oznaczone wojskowe (got ${militaryKeys.size})`);
assert(militaryKeys.has('armia') && militaryKeys.has('rekruci'), 'wojskowe = {armia, rekruci}');
for (const c of obj.components) {
  const expected = c.key === 'armia' || c.key === 'rekruci';
  assert(c.military === expected, `component "${c.key}" military=${c.military} (oczekiwano ${expected})`);
}

// --- [3] sortPowerRankingForMode / powerRankingValueForMode -- pelny ranking, 3 cywilizacje ---
// Fixture: gracz (isPlayer) ma NAJWIEKSZA Moc calkowita, ale NAJMNIEJSZA militarna -- powinien
// spasc na dole w trybie "military" i wskoczyc na gore w "economic", dowodzac ze CALY ranking
// (nie tylko wartosc gracza) przelicza sie na nowo.
// Kolejnosc WEJSCIOWA celowo NIE posortowana wg zadnego trybu -- dowodzi, ze
// sortPowerRankingForMode realnie sortuje, nie tylko przepisuje wejscie 1:1.
const fixtureRows = [
  { civ: 'Egipt', power: 100, powerMilitary: 5, powerEconomic: 95, rank: 0, isPlayer: false },
  { civ: 'Gracz', power: 300, powerMilitary: 10, powerEconomic: 290, rank: 0, isPlayer: true },
  { civ: 'Rzym', power: 250, powerMilitary: 200, powerEconomic: 50, rank: 0, isPlayer: false },
];

const total = M.sortPowerRankingForMode(fixtureRows, 'total');
assert(total.map(r => r.civ).join(',') === 'Gracz,Rzym,Egipt', 'total: kolejnosc = 300>250>100');
assert(total[0].rank === 1 && total[2].rank === 3, 'total: rank 1..3 przenumerowany');

const economic = M.sortPowerRankingForMode(fixtureRows, 'economic');
assert(economic.map(r => r.civ).join(',') === 'Gracz,Egipt,Rzym', 'economic: kolejnosc = 290>95>50');
assert(economic[0].civ === 'Gracz' && economic[0].rank === 1, 'economic: Gracz nadal #1 (dominuje gospodarczo)');

const militaryMode = M.sortPowerRankingForMode(fixtureRows, 'military');
assert(militaryMode.map(r => r.civ).join(',') === 'Rzym,Gracz,Egipt', 'military: kolejnosc = 200>10>5');
assert(militaryMode[0].civ === 'Rzym' && militaryMode[0].rank === 1,
  'military: Rzym wyprzedza Gracza mimo nizszej Mocy calkowitej -- CALY ranking przeliczony, nie tylko gracz');
assert(militaryMode.find(r => r.civ === 'Gracz').rank === 2, 'military: Gracz spada na #2 (byl #1 w total)');

const gracz = fixtureRows.find(r => r.civ === 'Gracz');
assert(M.powerRankingValueForMode(gracz, 'total') === 300, 'powerRankingValueForMode total = power');
assert(M.powerRankingValueForMode(gracz, 'economic') === 290, 'powerRankingValueForMode economic = powerEconomic');
assert(M.powerRankingValueForMode(gracz, 'military') === 10, 'powerRankingValueForMode military = powerMilitary');

// Oryginalna tablica NIE mutowana (sortPowerRankingForMode kopiuje, panel re-renderuje na zadanie).
assert(fixtureRows[0].civ === 'Egipt' && fixtureRows[0].rank === 0,
  'sortPowerRankingForMode nie mutuje wejsciowej tablicy (kolejnosc/rank wejsciowy nietkniety)');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
