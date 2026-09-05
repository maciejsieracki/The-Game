'use strict';
/**
 * building-happiness-test.cjs — ryczałt +1 szczęścia per budynek (decyzja Macieja 2026-07-22),
 * od 2026-09-05 WYŁĄCZNIE dla budynków szczęściodajnych.
 *
 * R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 G1 (właściciel 2026-09-05): ryczałt przestał obowiązywać
 * WSZYSTKIE budynki. Kryterium właściciela — czy MIESZKANIEC z budynku korzysta, czy tylko
 * państwo albo wojsko. Klasyfikacja żyje w DANYCH (`dajeSzczescie` w data/buildings.json),
 * nie w liście w kodzie; brak pola = `false`. Dziewiętnaście budynków daje szczęście,
 * dwadzieścia dwa dają DOKŁADNIE 0 (Mury, Koszary, Warsztat oblężniczy itd.).
 * Run: cd gra && node tools/building-happiness-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.building-happiness-entry.ts');
const BUNDLE = path.resolve(__dirname, '.building-happiness-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  buildingHappinessAtLevel,
  buildingGivesHappiness,
  sumBuildingHappinessFromBuiltIds,
  BUILDING_HAPPINESS_BASE_PER_BUILDING,
} from '../src/game/economy';
export { computeHappinessBreakdown } from '../src/game/society-breakdown';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[building-happiness-test] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE);
const buildings = require('../data/buildings.json');

let passed = 0;
let failed = 0;

function eq(a, b, msg) {
  if (a === b) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + ' got ' + JSON.stringify(a) + ' expected ' + JSON.stringify(b)); }
}
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg); }
}

console.log('\n[building-happiness-test]\n');

eq(M.BUILDING_HAPPINESS_BASE_PER_BUILDING, 1, 'base per building = 1');

const mury = buildings.find(b => b.id === 'mury');
const swiatynia = buildings.find(b => b.id === 'swiatynia');
const studnia = buildings.find(b => b.id === 'studnia');

// PRZED G1: Mury (zadowolenie 0) dostawaly ryczalt +1 jak kazdy budynek. PO G1: budynek
// niesklasyfikowany jako szczesciodajny daje DOKLADNIE 0 -- ryczalt nie jest juz automatem.
// Wlasciwosc "budynek bez baza.zadowolenie i tak dostaje ryczalt +1" NIE zniknela: przeniosla
// sie na budynki szczesciodajne bez wlasnego bonusu (Targowisko, Port, Biblioteka, Stela).
eq(M.buildingGivesHappiness(mury), false, 'Mury: dajeSzczescie = false (obrona, korzysta panstwo/wojsko)');
eq(M.buildingHappinessAtLevel(mury, 1), 0, 'Mury (dajeSzczescie false) -> DOKLADNIE 0 (G1)');
const targowisko = buildings.find(b => b.id === 'targowisko');
eq(targowisko.baza.zadowolenie, 0, 'Targowisko nie ma wlasnego baza.zadowolenie');
eq(M.buildingGivesHappiness(targowisko), true, 'Targowisko: dajeSzczescie = true (handel, korzysta mieszkaniec)');
eq(M.buildingHappinessAtLevel(targowisko, 1), 1, 'Targowisko (zadowolenie 0, ale szczesciodajne) -> +1 ryczaltu');
// GRUPY-BUDYNKOW (Maciej 2026-07-25): Świątynia.baza.zadowolenie rozdzielone z 3 do 2
// (Kamienne kręgi 1 + Świątynia 2 = 3 łącznie, bo oba budynki stoją teraz obok siebie
// zamiast Świątyni zastępującej Kamienne kręgi) -- patrz buildings.json + handoff §7.
eq(M.buildingHappinessAtLevel(swiatynia, 1), 3, 'Świątynia (zadowolenie 2 po rozdzieleniu) -> 2+1=3');

// Hipotetyczny budynek z zadowolenie 2 w JSON -> efekt 3
const hypo = { ...swiatynia, baza: { ...swiatynia.baza, zadowolenie: 2 } };
eq(M.buildingHappinessAtLevel(hypo, 1), 3, 'Budynek z zadowolenie 2 -> 2+1=3');

const threeIds = ['mury', 'swiatynia', 'studnia'];
const sum = M.sumBuildingHappinessFromBuiltIds(threeIds, buildings, () => 1);
// PRZED G1: mury:1 + swiatynia:3 + studnia:2 => 6. PO G1: Mury nie licza sie wcale => 5.
const studniaExpected = M.buildingHappinessAtLevel(studnia, 1);
const expected = 0 + 3 + studniaExpected;
eq(sum, expected, '3 budynki: suma ryczaltow + zadowolenie, Mury wnosza 0');
eq(sum, 5, '3 budynki (mury+swiatynia+studnia lvl1) -> 5 (Mury wypadly z ryczaltu, G1)');
// Kontrola dodatnia: podmiana Murow na budynek szczesciodajny bez wlasnego bonusu
// podnosi sume dokladnie o ryczalt, wiec suma NADAL liczy ryczalt, a nie tylko baza.zadowolenie.
const sumZTargowiskiem = M.sumBuildingHappinessFromBuiltIds(
  ['targowisko', 'swiatynia', 'studnia'], buildings, () => 1,
);
eq(sumZTargowiskiem, sum + 1, 'podmiana Mury -> Targowisko dodaje dokladnie +1 ryczaltu');

const breakdown = M.computeHappinessBreakdown({
  population: 5,
  buildingZadowolenie: sum,
}, null);
const budLine = breakdown.lines.find(l => l.id === 'budynki');
eq(budLine?.value, 5, 'breakdown budynki line = 5');
// PRZED G1 etykieta mowila graczowi "+1 za budynek" -- reguly obowiazujacej wtedy dla
// wszystkich budynkow. PO G1 ta regula byla juz nieprawdziwa (22 budynki daja 0), wiec
// etykieta musi nazywac wlasciwe kryterium. Sprawdzana wlasciwosc bez zmian: rozpiska
// nazywa graczowi POWOD wartosci linii, nie tylko sama liczbe.
ok(budLine?.label.includes('szczęściodajne'),
  'breakdown label nazywa kryterium G1 (budynki szczesciodajne), a nie nieaktualne "+1 za budynek"');
ok(!budLine?.label.includes('+1'),
  'breakdown label NIE obiecuje juz "+1 za kazdy budynek" (byloby klamstwem wobec 22 budynkow bez szczescia)');

console.log('\n' + passed + ' passed, ' + failed + ' failed\n');
process.exit(failed > 0 ? 1 : 0);
